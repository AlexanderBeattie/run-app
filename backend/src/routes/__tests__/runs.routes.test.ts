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

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .post('/api/runs/run-1/join')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(500);
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

  it('returns 500 on database error during run creation', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ id: 'club-1', name: 'Test Club' }] }) // ownership check
      .mockRejectedValueOnce(new Error('DB error'));                            // INSERT fails
    const res = await request(app)
      .post('/api/runs')
      .set('Authorization', `Bearer ${validToken}`)
      .send(runPayload);
    expect(res.status).toBe(500);
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

// ─── GET /api/runs — filter queries ───────────────────────────────────────────

describe('GET /api/runs — filters', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters by ?search= term', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app).get('/api/runs?search=park');
    expect(res.status).toBe(200);
    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('ILIKE'),
      expect.arrayContaining(['%park%']),
    );
  });

  it('filters by ?distance_min=', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app).get('/api/runs?distance_min=5');
    expect(res.status).toBe(200);
    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('distance_km >='),
      expect.arrayContaining([5]),
    );
  });

  it('filters by ?date=today', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/runs?date=today');
    expect(res.status).toBe(200);
    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('CURRENT_DATE'),
      [],
    );
  });

  it('filters by ?date=tomorrow', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/runs?date=tomorrow');
    expect(res.status).toBe(200);
    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('CURRENT_DATE + 1'),
      [],
    );
  });

  it('filters by ?date=week', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/runs?date=week');
    expect(res.status).toBe(200);
    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('BETWEEN CURRENT_DATE AND CURRENT_DATE + 7'),
      [],
    );
  });

  it('filters by ?city=', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app).get('/api/runs?city=london');
    expect(res.status).toBe(200);
    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('start_address ILIKE'),
      expect.arrayContaining(['%london%']),
    );
  });

  it('filters by ?club_id=', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app).get('/api/runs?club_id=club-1');
    expect(res.status).toBe(200);
    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('club_id ='),
      expect.arrayContaining(['club-1']),
    );
  });

  it('filters by ?pace=', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app).get('/api/runs?pace=moderate');
    expect(res.status).toBe(200);
    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('r.pace ='),
      expect.arrayContaining(['moderate']),
    );
  });

  it('filters by ?run_type=', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app).get('/api/runs?run_type=trail');
    expect(res.status).toBe(200);
    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('r.run_type ='),
      expect.arrayContaining(['trail']),
    );
  });

  it('sorts by attendee count when ?trending=1', async () => {
    mockPool.mockResolvedValueOnce({ rows: [mockRun] });
    const res = await request(app).get('/api/runs?trending=1');
    expect(res.status).toBe(200);
    expect(mockPool).toHaveBeenCalledWith(
      expect.stringContaining('COUNT(*) FROM run_attendees'),
      [],
    );
  });

  it('returns empty array when no runs match filters', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/runs?search=nonexistent');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─── PATCH /api/runs/:id — missing edge cases ─────────────────────────────────

describe('PATCH /api/runs/:id — 404 and 500', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 if run not found', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .patch('/api/runs/unknown-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(404);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .patch('/api/runs/run-1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(500);
  });

  it('updates all optional fields when all are provided', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ created_by: 'user-123' }] })
      .mockResolvedValueOnce({ rows: [{ ...mockRun, title: 'New Title' }] });
    const res = await request(app)
      .patch('/api/runs/run-1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: 'New Title', startAddress: 'A', endAddress: 'B',
        startLocation: { lat: 51.5, lng: -0.1 }, endLocation: { lat: 51.6, lng: -0.2 },
        date: new Date().toISOString(), distanceKm: 10, estimatedMinutes: 60,
        maxAttendees: 20, notes: 'Bring water', status: 'active',
        pace: 'fast', tags: ['trail'], runType: 'social',
      });
    expect(res.status).toBe(200);
  });

  it('updates run with only title (status absent — covers status ?? null right branch)', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ created_by: 'user-123' }] })
      .mockResolvedValueOnce({ rows: [{ ...mockRun, title: 'Renamed' }] });
    const res = await request(app)
      .patch('/api/runs/run-1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Renamed' });
    expect(res.status).toBe(200);
  });
});

// ─── DELETE /api/runs/:id — missing edge cases ────────────────────────────────

describe('DELETE /api/runs/:id — 404 and 500', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 if run not found', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .delete('/api/runs/unknown-id')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .delete('/api/runs/run-1')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/runs/:id/link-strava ───────────────────────────────────────────

describe('POST /api/runs/:id/link-strava', () => {
  beforeEach(() => jest.clearAllMocks());

  const linkPayload = {
    strava_activity_id: 'strava-act-1',
    strava_distance: 5000,
    strava_moving_time: 1800,
    strava_average_speed: 2.78,
    strava_polyline: 'encodedpoly',
  };

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/runs/run-1/link-strava').send(linkPayload);
    expect(res.status).toBe(401);
  });

  it('returns 400 if strava_activity_id is missing', async () => {
    const res = await request(app)
      .post('/api/runs/run-1/link-strava')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ strava_distance: 5000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('strava_activity_id is required');
  });

  it('returns 403 if user is not an attendee of the run', async () => {
    mockPool.mockResolvedValueOnce({ rows: [] }); // attendee check fails
    const res = await request(app)
      .post('/api/runs/run-1/link-strava')
      .set('Authorization', `Bearer ${validToken}`)
      .send(linkPayload);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('You are not an attendee of this run');
  });

  it('links Strava activity and returns success when user is an attendee', async () => {
    const updatedAttendee = { run_id: 'run-1', user_id: 'user-123', ...linkPayload };
    mockPool
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] })        // attendee check passes
      .mockResolvedValueOnce({ rows: [updatedAttendee] }); // UPDATE run_attendees
    const res = await request(app)
      .post('/api/runs/run-1/link-strava')
      .set('Authorization', `Bearer ${validToken}`)
      .send(linkPayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.strava_activity_id).toBe('strava-act-1');
  });

  it('persists all strava fields to run_attendees', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] })
      .mockResolvedValueOnce({ rows: [{}] });
    await request(app)
      .post('/api/runs/run-1/link-strava')
      .set('Authorization', `Bearer ${validToken}`)
      .send(linkPayload);
    expect(mockPool).toHaveBeenNthCalledWith(2,
      expect.stringContaining('UPDATE run_attendees'),
      ['strava-act-1', 5000, 1800, 2.78, 'encodedpoly', 'run-1', 'user-123'],
    );
  });

  it('returns 500 on database error', async () => {
    mockPool.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .post('/api/runs/run-1/link-strava')
      .set('Authorization', `Bearer ${validToken}`)
      .send(linkPayload);
    expect(res.status).toBe(500);
  });

  it('links Strava activity with only required field (optional fields default to null)', async () => {
    mockPool
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] })
      .mockResolvedValueOnce({ rows: [{ run_id: 'run-1', user_id: 'user-123' }] });
    const res = await request(app)
      .post('/api/runs/run-1/link-strava')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ strava_activity_id: 'act-only' });
    expect(res.status).toBe(200);
    expect(mockPool).toHaveBeenNthCalledWith(2,
      expect.stringContaining('UPDATE run_attendees'),
      ['act-only', null, null, null, null, 'run-1', 'user-123'],
    );
  });
});