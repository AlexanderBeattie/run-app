import request from 'supertest';
import express from 'express';
import authRoutes from '../auth.routes';
import { pool } from '../../db';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-32ch';
process.env.JWT_EXPIRES_IN = '1h';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

jest.mock('../../db', () => ({
  pool: { query: jest.fn() }
}));

const mockPool = pool.query as jest.Mock;

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 if fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('All fields required');
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Test', email: 'not-an-email', password: 'password123'
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid email format');
  });

  it('returns 400 if password is too short', async () => {
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Test', email: 'test@test.com', password: 'short'
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Password must be/);
  });

  it('returns 400 if password exceeds max length', async () => {
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Test', email: 'test@test.com', password: 'a'.repeat(129)
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Password must be/);
  });

  it('returns 409 if email already registered', async () => {
    mockPool.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Test', email: 'test@test.com', password: 'password123'
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already registered');
  });

  it('returns 201 and token on success with role always runner', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'new-id', display_name: 'Test', email: 'test@test.com', role: 'runner' }] });
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Test', email: 'test@test.com', password: 'password123'
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.expiresIn).toBe(3600);
    expect(res.body.user.email).toBe('test@test.com');
    expect(res.body.user.role).toBe('runner');
  });

  it('ignores client-supplied role and always registers as runner', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'new-id', display_name: 'Test', email: 'test@test.com', role: 'runner' }] });
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Test', email: 'test@test.com', password: 'password123', role: 'organizer'
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('runner');
  });

  it('returns 500 on database error', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [] })           // email check passes
      .mockRejectedValueOnce(new Error('DB error')); // INSERT fails
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Test', email: 'test@test.com', password: 'password123'
    });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 if fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 if user not found', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com', password: 'wrong'
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 if password incorrect', async () => {
    mockPool.mockResolvedValueOnce({ rows: [{
      id: 'user-1', email: 'test@test.com',
      password_hash: '$2a$12$invalidhashvalue', role: 'runner'
    }]});
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@test.com', password: 'wrongpassword'
    });
    expect(res.status).toBe(401);
  });

  it('returns 200 with token and refreshToken on valid credentials', async () => {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('correctpassword', 1);
    mockPool
      .mockResolvedValueOnce({ rows: [{ id: 'user-1', display_name: 'Test', email: 'test@test.com', password_hash: passwordHash, role: 'runner', strava_athlete_id: null }] })
      .mockResolvedValueOnce({ rows: [] }); // issueRefreshToken INSERT
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@test.com', password: 'correctpassword'
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.expiresIn).toBe(3600);
    expect(res.body.user.role).toBe('runner');
    expect(res.body.user.stravaConnected).toBe(false);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@test.com', password: 'password123'
    });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 if refresh token missing', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Refresh token required');
  });

  it('returns 401 if refresh token not found in db', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid-token' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired refresh token');
  });

  it('returns 401 if refresh token is expired', async () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    mockPool.mockResolvedValueOnce({ rows: [{
      user_id: 'user-1', expires_at: pastDate, email: 'test@test.com', role: 'runner'
    }]});
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'expired-token' });
    expect(res.status).toBe(401);
  });

  it('returns new access token for valid refresh token', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    mockPool.mockResolvedValueOnce({ rows: [{
      user_id: 'user-1', expires_at: futureDate, email: 'test@test.com', role: 'runner'
    }]});
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'valid-token' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.expiresIn).toBe(3600);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'some-token' });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 204 with no body when no refresh token supplied', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(204);
  });

  it('deletes refresh token and returns 204', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/logout').send({ refreshToken: 'some-token' });
    expect(res.status).toBe(204);
    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM refresh_tokens'),
      expect.any(Array)
    );
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/auth/logout').send({ refreshToken: 'some-token' });
    expect(res.status).toBe(500);
  });
});

// ── Forgot Password ────────────────────────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 if email is missing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email required');
  });

  it('returns 200 for existing email and inserts a reset token', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ id: 'user-1' }] }) // SELECT user
      .mockResolvedValueOnce({ rows: [] });                  // INSERT token
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'user@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link has been sent/i);
    expect(mockPool).toHaveBeenCalledTimes(2);
    expect(mockPool).toHaveBeenNthCalledWith(2,
      expect.stringContaining('INSERT INTO password_reset_tokens'),
      expect.any(Array)
    );
  });

  it('returns 200 for non-existent email (no information leakage)', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] }); // user not found
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link has been sent/i);
    // Should NOT have inserted a token
    expect(mockPool).toHaveBeenCalledTimes(1);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'user@test.com' });
    expect(res.status).toBe(500);
  });
});

// ── Reset Password ─────────────────────────────────────────────────────────────

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 if token is missing', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ newPassword: 'newpassword123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Token and new password required');
  });

  it('returns 400 if newPassword is missing', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'some-token' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Token and new password required');
  });

  it('returns 400 if new password is too short', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'some-token', newPassword: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Password must be/);
  });

  it('returns 400 if new password exceeds max length', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'some-token', newPassword: 'a'.repeat(129)
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Password must be/);
  });

  it('returns 400 if token is invalid or expired (no DB row)', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'invalid-token', newPassword: 'newpassword123'
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid or expired reset token');
  });

  it('updates password and marks token as used on success', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }] }) // SELECT token
      .mockResolvedValueOnce({ rows: [] })                        // UPDATE password
      .mockResolvedValueOnce({ rows: [] });                       // UPDATE token used=true
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'valid-reset-token', newPassword: 'newpassword123'
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password updated successfully');
    expect(mockPool).toHaveBeenCalledTimes(3);
    expect(mockPool).toHaveBeenNthCalledWith(2,
      expect.stringContaining('UPDATE users SET password_hash'),
      expect.any(Array)
    );
    expect(mockPool).toHaveBeenNthCalledWith(3,
      expect.stringContaining('UPDATE password_reset_tokens SET used = true'),
      expect.any(Array)
    );
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'some-token', newPassword: 'newpassword123'
    });
    expect(res.status).toBe(500);
  });
});
