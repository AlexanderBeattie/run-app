import request from 'supertest';
import express from 'express';
import usersRouter from '../users.routes';

jest.mock('../../db', () => ({
  pool: { query: jest.fn() },
}));

import { pool } from '../../db';
const mockQuery = pool.query as jest.Mock;

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
