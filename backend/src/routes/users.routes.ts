import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth.middleware';
import { AuthRequest } from '../types/index';

const router = Router();

// Public runner profile with aggregated run stats
router.get('/:id/profile', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query(
      `SELECT u.id, u.display_name,
        COUNT(ra.run_id)::int AS total_runs,
        COALESCE(SUM(r.distance_km), 0)::float AS total_distance_km,
        (
          SELECT r2.pace FROM run_attendees ra2
          JOIN run_events r2 ON r2.id = ra2.run_id
          WHERE ra2.user_id = u.id AND r2.pace IS NOT NULL
          GROUP BY r2.pace ORDER BY COUNT(*) DESC LIMIT 1
        ) AS favorite_pace,
        (
          SELECT AVG((1000.0 / NULLIF(ra3.strava_average_speed, 0)) / 60)::float
          FROM run_attendees ra3
          WHERE ra3.user_id = u.id
            AND ra3.strava_activity_id IS NOT NULL
            AND ra3.strava_average_speed > 0
        ) AS verified_pace
       FROM users u
       LEFT JOIN run_attendees ra ON ra.user_id = u.id
       LEFT JOIN run_events r ON r.id = ra.run_id
       WHERE u.id = $1
       GROUP BY u.id, u.display_name`,
      [id]
    );

    if (!userResult.rows.length) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const recentResult = await pool.query(
      `SELECT r.id, r.title, r.club_name, r.distance_km::float AS distance_km,
              r.pace, ra.joined_at AS attended_date, ra.strava_activity_id
       FROM run_attendees ra
       JOIN run_events r ON r.id = ra.run_id
       WHERE ra.user_id = $1
       ORDER BY ra.joined_at DESC
       LIMIT 5`,
      [id]
    );

    res.json({ ...userResult.rows[0], recent_runs: recentResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/strava/activities — proxy recent Strava activities (Run/TrailRun only)
router.get('/strava/activities', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const userResult = await pool.query(
      'SELECT strava_access_token FROM users WHERE id = $1',
      [userId]
    );

    if (!userResult.rows.length || !userResult.rows[0].strava_access_token) {
      res.status(403).json({ error: 'Strava not connected' });
      return;
    }

    const { strava_access_token } = userResult.rows[0];

    let apiRes: globalThis.Response;
    try {
      apiRes = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
        headers: { Authorization: `Bearer ${strava_access_token}` },
      });
    } catch (err) {
      console.error('Strava API unreachable:', err);
      res.status(502).json({ error: 'Could not reach Strava API' });
      return;
    }

    if (!apiRes.ok) {
      if (apiRes.status === 401) {
        res.status(401).json({ error: 'Strava token expired. Please reconnect Strava.' });
        return;
      }
      if (apiRes.status === 429) {
        res.status(429).json({ error: 'Strava rate limit reached. Please try again later.' });
        return;
      }
      res.status(502).json({ error: 'Strava API error' });
      return;
    }

    const activities = await apiRes.json() as any[];

    const filtered = activities
      .filter((a: any) => a.type === 'Run' || a.type === 'TrailRun')
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        distance: a.distance,
        moving_time: a.moving_time,
        average_speed: a.average_speed,
        start_date_local: a.start_date_local,
        polyline: a.map?.summary_polyline ?? null,
        type: a.type,
      }));

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
