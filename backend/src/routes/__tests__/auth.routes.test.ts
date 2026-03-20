import request from 'supertest';
import express from 'express';
import authRoutes from '../auth.routes';
import { pool } from '../../db';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '7d';

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

  it('returns 409 if email already registered', async () => {
    mockPool.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Test', email: 'test@test.com', password: 'password123', role: 'runner'
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already registered');
  });

  it('returns 201 and token on success', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'new-id', display_name: 'Test', email: 'test@test.com', role: 'runner' }] });
    const res = await request(app).post('/api/auth/register').send({
      displayName: 'Test', email: 'test@test.com', password: 'password123', role: 'runner'
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@test.com');
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
});