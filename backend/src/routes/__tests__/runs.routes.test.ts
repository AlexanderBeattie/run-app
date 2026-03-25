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

// ─── POST /api/runs — club ownership validation ───────────────────────────────

describe('POST /api/runs — club ownership', () => {
  const runPayload = {
    title: 'Club Run', clubId: 'club-1',
    startLocation: { lat: 51.5, lng: -0.1 },
    endLocation: { lat: 51.6, lng: -0.2 },
    startAddress: 'Start', endAddress: 'End',
    date: new Date().toISOString(),
    distanceKm: 5, estimatedMinutes: 30
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns 403 if user does not own or organise the club', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] }); // club ownership check fails
    const res = await request(app)
      .post('/api/runs')
      .set('Authorization', `Bearer ${validToken}`)
      .send(runPayload);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not allowed/i);
  });

  it('creates run under club when user is club owner', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ id: 'club-1', name: 'Test Club' }] })  // club ownership OK
      .mockResolvedValueOnce({ rows: [{ ...mockRun, club_id: 'club-1' }] });    // INSERT run
    const res = await request(app)
      .post('/api/runs')
      .set('Authorization', `Bearer ${validToken}`)
      .send(runPayload);
    expect(res.status).toBe(201);
  });

  it('creates an independent run when no clubId provided', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const { clubId: _omit, ...independentPayload } = runPayload;
    const res = await request(app)
      .post('/api/runs')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ ...independentPayload, clubId: null });
    expect(res.status).toBe(201);
    // No club ownership check should have been made — only one DB call (INSERT)
    expect(mockPool).toHaveBeenCalledTimes(1);
  });
});

// ─── GET /api/runs/mine ───────────────────────────────────────────────────────

describe('GET /api/runs/mine', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/runs/mine');
    expect(res.status).toBe(401);
  });

  it('returns runs created by the user', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app)
      .get('/api/runs/mine')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Test Run');
  });

  it('returns empty array when user has no runs', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get('/api/runs/mine')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/runs/mine')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/runs/joined ─────────────────────────────────────────────────────

describe('GET /api/runs/joined', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/runs/joined');
    expect(res.status).toBe(401);
  });

  it('returns runs the user has joined', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app)
      .get('/api/runs/joined')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Test Run');
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/runs/joined')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/runs/:id ────────────────────────────────────────────────────────

describe('GET /api/runs/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a single run by id', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app).get('/api/runs/run-1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Run');
  });

  it('returns 404 for unknown run', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/runs/unknown-id');
    expect(res.status).toBe(404);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/runs/run-1');
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/runs/:id/attendees ──────────────────────────────────────────────

describe('GET /api/runs/:id/attendees', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns attendees for a run', async () => {
    const mockAttendee = { id: 'user-1', display_name: 'Alex B', joined_at: new Date().toISOString() };
    mockPool.mockResolvedValueOnce({ rows: [mockAttendee] });
    const res = await request(app).get('/api/runs/run-1/attendees');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].display_name).toBe('Alex B');
  });

  it('returns empty array when no attendees', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/runs/run-1/attendees');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/runs/run-1/attendees');
    expect(res.status).toBe(500);
  });
});