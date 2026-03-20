import request from 'supertest';
import express from 'express';
import runsRoutes from '../runs.routes';
import { pool } from '../../db';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';

const app = express();
app.use(express.json());
app.use('/api/runs', runsRoutes);

jest.mock('../../db', () => ({
  pool: { query: jest.fn() }
}));

const mockPool = pool.query as jest.Mock;
const validToken = jwt.sign(
  { id: 'user-123', email: 'test@test.com', role: 'organizer' },
  'test-secret'
);

const mockRun = {
  id: 'run-1', title: 'Test Run', club_name: 'Test Club',
  start_address: 'Start', end_address: 'End',
  event_date: new Date().toISOString(),
  distance_km: '5', estimated_minutes: 30,
  attendees: [], status: 'active'
};

describe('GET /api/runs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns list of active runs', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app).get('/api/runs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Test Run');
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/runs');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/runs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/runs').send({ title: 'Run' });
    expect(res.status).toBe(401);
  });

  it('creates a run with valid token', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app)
      .post('/api/runs')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        clubId: null, clubName: 'Test Club', title: 'Test Run',
        startLocation: { lat: 51.5, lng: -0.1 },
        endLocation: { lat: 51.6, lng: -0.2 },
        startAddress: 'Start', endAddress: 'End',
        date: new Date().toISOString(),
        distanceKm: 5, estimatedMinutes: 30
      });
    expect(res.status).toBe(201);
  });
});

describe('POST /api/runs/:id/join', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/runs/run-1/join');
    expect(res.status).toBe(401);
  });

  it('joins a run successfully', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post('/api/runs/run-1/join')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body.joined).toBe(true);
  });

  it('unjoins if already joined', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post('/api/runs/run-1/join')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body.joined).toBe(false);
  });
});

describe('DELETE /api/runs/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).delete('/api/runs/run-1');
    expect(res.status).toBe(401);
  });

  it('returns 403 if not creator', async () => {
    mockPool.mockResolvedValueOnce({ rows: [{ created_by: 'other-user' }] });
    const res = await request(app)
      .delete('/api/runs/run-1')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(403);
  });

  it('deletes run if creator', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ created_by: 'user-123' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .delete('/api/runs/run-1')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('PATCH /api/runs/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).patch('/api/runs/run-1').send({ status: 'cancelled' });
    expect(res.status).toBe(401);
  });

  it('returns 403 if not creator', async () => {
    mockPool.mockResolvedValueOnce({ rows: [{ created_by: 'other-user' }] });
    const res = await request(app)
      .patch('/api/runs/run-1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(403);
  });

  it('cancels run if creator', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ created_by: 'user-123' }] })
      .mockResolvedValueOnce({ rows: [{ ...mockRun, status: 'cancelled' }] });
    const res = await request(app)
      .patch('/api/runs/run-1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });
});