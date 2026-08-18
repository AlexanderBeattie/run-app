import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import stravaRoutes from '../strava.routes';
import { pool } from '../../db';

process.env.JWT_SECRET = 'test-secret';
process.env.STRAVA_CLIENT_ID = 'test-client-id';
process.env.STRAVA_CLIENT_SECRET = 'test-client-secret';
process.env.STRAVA_REDIRECT_URI = 'http://localhost:3000/api/auth/strava/callback';
process.env.FRONTEND_URL = 'http://localhost:4201';

jest.mock('../../db', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../../utils/crypto.util', () => ({
  encrypt: jest.fn().mockReturnValue('encrypted-token'),
  decrypt: jest.fn().mockReturnValue('decrypted-token'),
}));

const mockPool = pool.query as jest.Mock;
const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

const app = express();
app.use(express.json());
app.use('/api/auth', stravaRoutes);

const validToken = jwt.sign(
  { id: 'user-123', email: 'test@test.com', role: 'runner' },
  'test-secret',
);
const expiredToken = jwt.sign(
  { id: 'user-123', email: 'test@test.com', role: 'runner' },
  'test-secret',
  { expiresIn: '-1s' } as any,
);

/** Helper: initiate OAuth and return the state param from the redirect URL. */
async function getValidState(): Promise<string> {
  const res = await request(app).get(`/api/auth/strava?token=${validToken}`);
  expect(res.status).toBe(302);
  const url = new URL(res.headers.location as string);
  return url.searchParams.get('state')!;
}

// ── GET /api/auth/strava ──────────────────────────────────────────────────────

describe('GET /api/auth/strava', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 if token query param is missing', async () => {
    const res = await request(app).get('/api/auth/strava');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing token query parameter');
  });

  it('returns 401 if token is not a valid JWT', async () => {
    const res = await request(app).get('/api/auth/strava?token=not-a-valid-jwt');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });

  it('returns 401 if token is expired', async () => {
    const res = await request(app).get(`/api/auth/strava?token=${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });

  it('redirects to Strava OAuth URL for a valid token', async () => {
    const res = await request(app).get(`/api/auth/strava?token=${validToken}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('https://www.strava.com/oauth/authorize');
  });

  it('includes required OAuth params in redirect URL', async () => {
    const res = await request(app).get(`/api/auth/strava?token=${validToken}`);
    expect(res.status).toBe(302);
    const url = new URL(res.headers.location as string);
    expect(url.searchParams.get('client_id')).toBe('test-client-id');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('activity:read');
    expect(url.searchParams.get('approval_prompt')).toBe('auto');
  });

  it('generates a 64-char hex state token (32 random bytes)', async () => {
    const res = await request(app).get(`/api/auth/strava?token=${validToken}`);
    expect(res.status).toBe(302);
    const url = new URL(res.headers.location as string);
    const state = url.searchParams.get('state');
    expect(state).toMatch(/^[a-f0-9]{64}$/);
  });

  it('each call generates a unique state token', async () => {
    const res1 = await request(app).get(`/api/auth/strava?token=${validToken}`);
    const res2 = await request(app).get(`/api/auth/strava?token=${validToken}`);
    const state1 = new URL(res1.headers.location as string).searchParams.get('state');
    const state2 = new URL(res2.headers.location as string).searchParams.get('state');
    expect(state1).not.toBe(state2);
  });

  it('includes redirect_uri in Strava authorization URL', async () => {
    const res = await request(app).get(`/api/auth/strava?token=${validToken}`);
    expect(res.status).toBe(302);
    const url = new URL(res.headers.location as string);
    expect(url.searchParams.get('redirect_uri')).toBeTruthy();
  });

  it('falls back to constructing redirect_uri from host when STRAVA_REDIRECT_URI is unset', async () => {
    const saved = process.env.STRAVA_REDIRECT_URI;
    delete process.env.STRAVA_REDIRECT_URI;
    const res = await request(app).get(`/api/auth/strava?token=${validToken}`);
    expect(res.status).toBe(302);
    const url = new URL(res.headers.location as string);
    expect(url.searchParams.get('redirect_uri')).toMatch(/strava\/callback/);
    process.env.STRAVA_REDIRECT_URI = saved;
  });

  it('pruneExpiredStates removes entries that have passed their TTL', async () => {
    jest.useFakeTimers();
    // Insert a state entry
    await request(app).get(`/api/auth/strava?token=${validToken}`);
    // Advance time past the 10-minute TTL
    jest.advanceTimersByTime(11 * 60 * 1000);
    // A new request triggers pruneExpiredStates — the expired entry is deleted
    const res = await request(app).get(`/api/auth/strava?token=${validToken}`);
    expect(res.status).toBe(302);
    jest.useRealTimers();
  });
});

// ── GET /api/auth/strava/callback ─────────────────────────────────────────────

describe('GET /api/auth/strava/callback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it('returns 400 if Strava error param is present', async () => {
    const res = await request(app).get('/api/auth/strava/callback?error=access_denied&state=whatever');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Strava OAuth error');
  });

  it('returns 400 if state param is missing', async () => {
    const res = await request(app).get('/api/auth/strava/callback?code=abc123');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing state parameter');
  });

  it('returns 400 if state is unknown (not in store)', async () => {
    const res = await request(app).get('/api/auth/strava/callback?code=abc123&state=unknownstatetoken');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid or expired state token');
  });

  it('returns 400 if authorization code is missing with valid state', async () => {
    const state = await getValidState();
    const res = await request(app).get(`/api/auth/strava/callback?state=${state}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing authorization code');
  });

  it('returns 502 if Strava token exchange returns non-ok response', async () => {
    const state = await getValidState();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Bad verification code', errors: [] }),
    });

    const res = await request(app).get(`/api/auth/strava/callback?code=bad-code&state=${state}`);
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Strava token exchange failed');
  });

  it('returns 502 if Strava API is unreachable (fetch throws)', async () => {
    const state = await getValidState();
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const res = await request(app).get(`/api/auth/strava/callback?code=abc123&state=${state}`);
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Could not reach Strava API');
  });

  it('returns 500 if DB update fails after successful token exchange', async () => {
    const state = await getValidState();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'access-123',
        refresh_token: 'refresh-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        athlete: { id: 12345, firstname: 'Test', lastname: 'User' },
      }),
    });
    mockPool.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get(`/api/auth/strava/callback?code=valid-code&state=${state}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to save Strava tokens');
  });

  it('persists all Strava token fields to the database on success', async () => {
    const state = await getValidState();
    const stravaData = {
      access_token: 'access-token-xyz',
      refresh_token: 'refresh-token-xyz',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      athlete: { id: 99999, firstname: 'Test', lastname: 'Runner' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => stravaData,
    });
    mockPool.mockResolvedValueOnce({ rows: [] });

    await request(app).get(`/api/auth/strava/callback?code=good-code&state=${state}`);

    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET'),
      [99999, 'encrypted-token', 'encrypted-token', stravaData.expires_at, 'user-123'],
    );
  });

  it('redirects to frontend /profile?strava=connected on success', async () => {
    const state = await getValidState();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'access-123', refresh_token: 'refresh-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        athlete: { id: 12345 },
      }),
    });
    mockPool.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get(`/api/auth/strava/callback?code=good-code&state=${state}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('http://localhost:4201/profile?strava=connected');
  });

  it('state is consumed after use — second request with same state returns 400', async () => {
    const state = await getValidState();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access-123', refresh_token: 'refresh-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        athlete: { id: 12345 },
      }),
    });
    mockPool.mockResolvedValue({ rows: [] });

    // First request succeeds
    await request(app).get(`/api/auth/strava/callback?code=code-1&state=${state}`);

    // Second request with same state must fail
    const res2 = await request(app).get(`/api/auth/strava/callback?code=code-2&state=${state}`);
    expect(res2.status).toBe(400);
    expect(res2.body.error).toBe('Invalid or expired state token');
  });

  it('falls back to localhost:4201 as frontendUrl when FRONTEND_URL is unset', async () => {
    const saved = process.env.FRONTEND_URL;
    delete process.env.FRONTEND_URL;

    const state = await getValidState();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'access-123', refresh_token: 'refresh-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        athlete: { id: 12345 },
      }),
    });
    mockPool.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get(`/api/auth/strava/callback?code=good-code&state=${state}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('localhost:4201');

    process.env.FRONTEND_URL = saved;
  });

  it('calls Strava token endpoint with correct params', async () => {
    const state = await getValidState();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'at', refresh_token: 'rt',
        expires_at: 9999999999,
        athlete: { id: 1 },
      }),
    });
    mockPool.mockResolvedValueOnce({ rows: [] });

    await request(app).get(`/api/auth/strava/callback?code=mycode&state=${state}`);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.strava.com/api/v3/oauth/token',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"code":"mycode"'),
      }),
    );
    const body = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
    expect(body.client_id).toBe('test-client-id');
    expect(body.client_secret).toBe('test-client-secret');
    expect(body.grant_type).toBe('authorization_code');
  });
});
