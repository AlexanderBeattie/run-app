import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import usersRouter from '../users.routes';

process.env.JWT_SECRET = 'test-secret';

jest.mock('../../db', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../../utils/crypto.util', () => ({
  encrypt: jest.fn().mockReturnValue('encrypted-token'),
  decrypt: jest.fn().mockReturnValue('decrypted-token'),
}));

import { pool } from '../../db';
const mockQuery = pool.query as jest.Mock;

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

const validToken = jwt.sign(
  { id: 'user-1', email: 'test@test.com', role: 'runner' },
  'test-secret',
);

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

const PROFILE_ROW = {
  id: 'user-1',
  display_name: 'Alice',
  total_runs: 3,
  total_distance_km: 21.5,
  favorite_pace: 'moderate',
};
const RECENT_ROWS = [
  { id: 'run-1', title: 'Park Loop', club_name: 'KLUB', distance_km: 5, pace: 'moderate', attended_date: '2024-01-10' },
];

beforeEach(() => mockQuery.mockReset());

describe('GET /api/users/:id/profile', () => {
  it('returns profile with aggregated stats for a valid user', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [PROFILE_ROW] })
      .mockResolvedValueOnce({ rows: RECENT_ROWS });

    const res = await request(app).get('/api/users/user-1/profile');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('user-1');
    expect(res.body.display_name).toBe('Alice');
    expect(res.body.total_runs).toBe(3);
    expect(res.body.total_distance_km).toBe(21.5);
    expect(res.body.favorite_pace).toBe('moderate');
    expect(res.body.recent_runs).toHaveLength(1);
    expect(res.body.recent_runs[0].title).toBe('Park Loop');
  });

  it('returns 404 when user does not exist', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/users/nonexistent/profile');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('User not found');
  });

  it('returns zero stats for a user with no runs', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...PROFILE_ROW, total_runs: 0, total_distance_km: 0, favorite_pace: null }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/users/user-1/profile');

    expect(res.status).toBe(200);
    expect(res.body.total_runs).toBe(0);
    expect(res.body.total_distance_km).toBe(0);
    expect(res.body.favorite_pace).toBeNull();
    expect(res.body.recent_runs).toHaveLength(0);
  });

  it('aggregates distance and run count correctly across multiple runs', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...PROFILE_ROW, total_runs: 5, total_distance_km: 47.2 }] })
      .mockResolvedValueOnce({ rows: Array(5).fill(RECENT_ROWS[0]) });

    const res = await request(app).get('/api/users/user-1/profile');

    expect(res.status).toBe(200);
    expect(res.body.total_runs).toBe(5);
    expect(res.body.total_distance_km).toBe(47.2);
    expect(res.body.recent_runs).toHaveLength(5);
  });

  it('returns 500 on database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

    const res = await request(app).get('/api/users/user-1/profile');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Server error');
  });
});

// ─── GET /api/users/strava/activities ─────────────────────────────────────────

describe('GET /api/users/strava/activities', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockFetch.mockReset();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).get('/api/users/strava/activities');
    expect(res.status).toBe(401);
  });

  it('returns 403 if user has no strava_access_token', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ strava_access_token: null }] });
    const res = await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Strava not connected');
  });

  it('returns 403 if user row not found in DB', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Strava not connected');
  });

  it('calls Strava API with the stored access token', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ strava_access_token: 'my-access-token', strava_token_expires_at: Math.floor(Date.now() / 1000) + 3600 }] });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.strava.com/api/v3/athlete/activities?per_page=10',
      expect.objectContaining({ headers: { Authorization: 'Bearer decrypted-token' } }),
    );
  });

  it('returns only Run and TrailRun activities (filters out Ride, Walk, etc.)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ strava_access_token: 'token', strava_token_expires_at: Math.floor(Date.now() / 1000) + 3600 }] });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Morning Run', type: 'Run', distance: 5000, moving_time: 1800, average_speed: 2.78, start_date_local: '2024-01-01', map: { summary_polyline: 'abc' } },
        { id: 2, name: 'Bike Ride', type: 'Ride', distance: 20000, moving_time: 3600, average_speed: 5.5, start_date_local: '2024-01-02', map: {} },
        { id: 3, name: 'Trail Run', type: 'TrailRun', distance: 8000, moving_time: 2700, average_speed: 2.96, start_date_local: '2024-01-03', map: { summary_polyline: 'def' } },
        { id: 4, name: 'Evening Walk', type: 'Walk', distance: 3000, moving_time: 2400, average_speed: 1.25, start_date_local: '2024-01-04', map: {} },
      ],
    });
    const res = await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].type).toBe('Run');
    expect(res.body[1].type).toBe('TrailRun');
  });

  it('maps activity fields to the expected shape', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ strava_access_token: 'token', strava_token_expires_at: Math.floor(Date.now() / 1000) + 3600 }] });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        id: 42,
        name: 'Morning Run',
        distance: 5000,
        moving_time: 1800,
        average_speed: 2.78,
        start_date_local: '2024-01-01T07:00:00',
        map: { summary_polyline: 'poly123' },
        type: 'Run',
      }],
    });
    const res = await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    const activity = res.body[0];
    expect(activity.id).toBe(42);
    expect(activity.name).toBe('Morning Run');
    expect(activity.distance).toBe(5000);
    expect(activity.moving_time).toBe(1800);
    expect(activity.average_speed).toBe(2.78);
    expect(activity.start_date_local).toBe('2024-01-01T07:00:00');
    expect(activity.polyline).toBe('poly123');
    expect(activity.type).toBe('Run');
  });

  it('returns null polyline when map has no summary_polyline', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ strava_access_token: 'token', strava_token_expires_at: Math.floor(Date.now() / 1000) + 3600 }] });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        id: 5, name: 'Run', type: 'Run', distance: 3000, moving_time: 900,
        average_speed: 3.33, start_date_local: '2024-01-01', map: {},
      }],
    });
    const res = await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body[0].polyline).toBeNull();
  });

  it('returns empty array when user has no activities', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ strava_access_token: 'token', strava_token_expires_at: Math.floor(Date.now() / 1000) + 3600 }] });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    const res = await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 401 when Strava returns 401 (token expired)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ strava_access_token: 'expired-token', strava_token_expires_at: Math.floor(Date.now() / 1000) + 3600 }] });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const res = await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });

  it('returns 429 when Strava rate limits the request', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ strava_access_token: 'token', strava_token_expires_at: Math.floor(Date.now() / 1000) + 3600 }] });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    const res = await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/rate limit/i);
  });

  it('returns 502 on other Strava API errors (e.g. 500)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ strava_access_token: 'token', strava_token_expires_at: Math.floor(Date.now() / 1000) + 3600 }] });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const res = await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Strava API error');
  });

  it('returns 502 if Strava API is unreachable (fetch throws)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ strava_access_token: 'token', strava_token_expires_at: Math.floor(Date.now() / 1000) + 3600 }] });
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Could not reach Strava API');
  });

  it('returns 500 on database error when looking up user', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/users/strava/activities')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(500);
  });
});
