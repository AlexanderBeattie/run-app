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

const mockClub = {
  id: 'club-1', name: 'Test Club', description: 'A test club',
  owner_id: 'user-123', city: 'London', pace: 'moderate',
  tags: ['road'], member_count: 5, next_run_date: null, created_at: new Date().toISOString()
};

// ─── GET /api/clubs ───────────────────────────────────────────────────────────

describe('GET /api/clubs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns list of clubs', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockClub] });
    const res = await request(app).get('/api/clubs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Test Club');
  });

  it('returns empty array when no clubs exist', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/clubs');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/clubs');
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/clubs/mine ──────────────────────────────────────────────────────

describe('GET /api/clubs/mine', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/clubs/mine');
    expect(res.status).toBe(401);
  });

  it('returns clubs the user is a member of', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockClub] });
    const res = await request(app)
      .get('/api/clubs/mine')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('Test Club');
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/clubs/mine')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/clubs/owned ─────────────────────────────────────────────────────

describe('GET /api/clubs/owned', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/clubs/owned');
    expect(res.status).toBe(401);
  });

  it('returns clubs owned by the user', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockClub] });
    const res = await request(app)
      .get('/api/clubs/owned')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].owner_id).toBe('user-123');
  });

  it('returns empty array when user owns no clubs', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .get('/api/clubs/owned')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/clubs/owned')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/clubs ──────────────────────────────────────────────────────────

describe('POST /api/clubs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/clubs').send({ name: 'Test Club' });
    expect(res.status).toBe(401);
  });

  it('returns 400 without club name', async () => {
    const res = await request(app)
      .post('/api/clubs')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('creates a club and auto-joins owner', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [mockClub] })   // INSERT club
      .mockResolvedValueOnce({ rows: [] });            // INSERT club_member
    const res = await request(app)
      .post('/api/clubs')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'Test Club', description: 'A test club' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Club');
    expect(mockPool).toHaveBeenCalledTimes(2);
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

// ─── GET /api/clubs/:id ───────────────────────────────────────────────────────

describe('GET /api/clubs/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 for unknown club', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/clubs/unknown-id');
    expect(res.status).toBe(404);
  });

  it('returns club data', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockClub] });
    const res = await request(app).get('/api/clubs/club-1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Club');
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/clubs/club-1');
    expect(res.status).toBe(500);
  });
});

// ─── PATCH /api/clubs/:id ─────────────────────────────────────────────────────

describe('PATCH /api/clubs/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).patch('/api/clubs/club-1').send({ name: 'Updated' });
    expect(res.status).toBe(401);
  });

  it('returns 404 for unknown club', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .patch('/api/clubs/unknown-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'Updated' });
    expect(res.status).toBe(404);
  });

  it('returns 403 if not owner', async () => {
    mockPool.mockResolvedValueOnce({ rows: [{ owner_id: 'other-user' }] });
    const res = await request(app)
      .patch('/api/clubs/club-1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'Updated' });
    expect(res.status).toBe(403);
  });

  it('updates club if owner', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ owner_id: 'user-123' }] })
      .mockResolvedValueOnce({ rows: [{ ...mockClub, name: 'Updated Club' }] });
    const res = await request(app)
      .patch('/api/clubs/club-1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'Updated Club' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Club');
  });
});

// ─── GET /api/clubs/:id/runs ──────────────────────────────────────────────────

describe('GET /api/clubs/:id/runs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns active runs for a club', async () => {
    const mockRun = { id: 'run-1', title: 'Morning Run', attendees: [] };
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app).get('/api/clubs/club-1/runs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Morning Run');
  });

  it('returns empty array when club has no runs', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/clubs/club-1/runs');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/clubs/club-1/runs');
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/clubs/:id/members ───────────────────────────────────────────────

describe('GET /api/clubs/:id/members', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns members for a club', async () => {
    const mockMember = { id: 'user-123', display_name: 'Alex B', role: 'owner', joined_at: new Date().toISOString() };
    mockPool.mockResolvedValueOnce({ rows: [mockMember] });
    const res = await request(app).get('/api/clubs/club-1/members');
    expect(res.status).toBe(200);
    expect(res.body[0].display_name).toBe('Alex B');
    expect(res.body[0].role).toBe('owner');
  });

  it('returns empty array when club has no members', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/clubs/club-1/members');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/clubs/club-1/members');
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/clubs/:id/join ─────────────────────────────────────────────────

describe('POST /api/clubs/:id/join', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/clubs/club-1/join');
    expect(res.status).toBe(401);
  });

  it('returns 404 when club not found', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post('/api/clubs/unknown-id/join')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(404);
  });

  it('joins a club when not a member', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ owner_id: 'other-user' }] })  // club exists
      .mockResolvedValueOnce({ rows: [] })                              // not a member
      .mockResolvedValueOnce({ rows: [] });                             // INSERT
    const res = await request(app)
      .post('/api/clubs/club-1/join')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body.joined).toBe(true);
  });

  it('leaves a club when already a member', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ owner_id: 'other-user' }] })  // club exists
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] })                     // already a member
      .mockResolvedValueOnce({ rows: [] });                             // DELETE
    const res = await request(app)
      .post('/api/clubs/club-1/join')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body.joined).toBe(false);
  });

  it('prevents owner from leaving their own club', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ owner_id: 'user-123' }] })  // owner_id matches user
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] });                  // is a member
    const res = await request(app)
      .post('/api/clubs/club-1/join')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/owner cannot leave/i);
  });
});
