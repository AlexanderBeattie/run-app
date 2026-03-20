import request from 'supertest';
import express from 'express';
import clubsRoutes from '../clubs.routes';
import { pool } from '../../db';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';

const app = express();
app.use(express.json());
app.use('/api/clubs', clubsRoutes);

jest.mock('../../db', () => ({
  pool: { query: jest.fn() }
}));

const mockPool = pool.query as jest.Mock;
const validToken = jwt.sign(
  { id: 'user-123', email: 'test@test.com', role: 'organizer' },
  'test-secret'
);

describe('POST /api/clubs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/clubs').send({ name: 'Test Club' });
    expect(res.status).toBe(401);
  });

  it('creates a club with valid token', async () => {
    mockPool.mockResolvedValueOnce({ rows: [{ id: 'club-1', name: 'Test Club', owner_id: 'user-123' }] });
    const res = await request(app)
      .post('/api/clubs')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'Test Club', description: 'A test club' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Club');
  });

  it('returns 500 on db error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .post('/api/clubs')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'Test Club' });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/clubs/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 for unknown club', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/clubs/unknown-id');
    expect(res.status).toBe(404);
  });

  it('returns club data', async () => {
    mockPool.mockResolvedValueOnce({ rows: [{ id: 'club-1', name: 'Test Club' }] });
    const res = await request(app).get('/api/clubs/club-1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Club');
  });
});