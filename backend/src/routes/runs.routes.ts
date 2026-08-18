import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
const router = Router();

// GET /api/runs — with optional filters: ?search=, ?distance_min=, ?date=today|tomorrow|week, ?city=, ?club_id=, ?pace=
router.get('/', async (req: Request, res: Response) => {
  try {
    const conditions: string[] = ["r.status = 'active'", "r.event_date >= CURRENT_TIMESTAMP"];
    const params: any[] = [];
    let idx = 1;

    if (req.query.search) {
      conditions.push(`(r.title ILIKE $${idx} OR r.club_name ILIKE $${idx} OR r.start_address ILIKE $${idx})`);
      params.push(`%${req.query.search}%`);
      idx++;
    }

    if (req.query.distance_min) {
      conditions.push(`r.distance_km >= $${idx}`);
      params.push(parseFloat(req.query.distance_min as string));
      idx++;
    }

    if (req.query.date) {
      const d = req.query.date as string;
      if (d === 'today') {
        conditions.push(`r.event_date::date = CURRENT_DATE`);
      } else if (d === 'tomorrow') {
        conditions.push(`r.event_date::date = CURRENT_DATE + 1`);
      } else if (d === 'week') {
        conditions.push(`r.event_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7`);
      }
    }

    if (req.query.city) {
      conditions.push(`r.start_address ILIKE $${idx}`);
      params.push(`%${req.query.city}%`);
      idx++;
    }

    if (req.query.club_id) {
      conditions.push(`r.club_id = $${idx}`);
      params.push(req.query.club_id);
      idx++;
    }

    if (req.query.pace) {
      conditions.push(`r.pace = $${idx}`);
      params.push(req.query.pace);
      idx++;
    }

    if (req.query.run_type) {
      conditions.push(`r.run_type = $${idx}`);
      params.push(req.query.run_type);
      idx++;
    }

    const where = conditions.join(' AND ');

    // Determine ORDER BY clause based on ?trending=1
    let orderByClause = 'r.event_date ASC';
    if (req.query.trending === '1') {
      conditions.push(`r.event_date > NOW() AND r.event_date <= NOW() + INTERVAL '72 hours'`);
      orderByClause = '(SELECT COUNT(*) FROM run_attendees WHERE run_id = r.id) DESC';
    }

    const result = await pool.query(`
      SELECT r.*,
        c.name AS club_name,
        c.city AS club_city,
        c.created_at AS club_created_at,
        COALESCE(json_agg(ra.user_id) FILTER (WHERE ra.user_id IS NOT NULL), '[]') AS attendees
      FROM run_events r
      LEFT JOIN run_attendees ra ON ra.run_id = r.id
      LEFT JOIN clubs c ON r.club_id = c.id
      WHERE ${where}
      GROUP BY r.id, c.id ORDER BY ${orderByClause}
    `, params);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`SELECT r.*, COALESCE(json_agg(ra.user_id) FILTER (WHERE ra.user_id IS NOT NULL), '[]') AS attendees FROM run_events r LEFT JOIN run_attendees ra ON ra.run_id = r.id WHERE r.created_by = $1 GROUP BY r.id ORDER BY r.event_date ASC`, [req.user!.id]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/joined', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`SELECT r.*, ra.strava_polyline, COALESCE(json_agg(ra2.user_id) FILTER (WHERE ra2.user_id IS NOT NULL), '[]') AS attendees FROM run_events r JOIN run_attendees ra ON ra.run_id = r.id AND ra.user_id = $1 LEFT JOIN run_attendees ra2 ON ra2.run_id = r.id GROUP BY r.id, ra.strava_polyline ORDER BY r.event_date ASC`, [req.user!.id]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

function wmoToWeather(code: number): { icon: string; condition: string } {
  if (code === 0) return { icon: '☀️', condition: 'Clear' };
  if (code <= 3) return { icon: '⛅', condition: 'Partly Cloudy' };
  if (code <= 48) return { icon: '🌫️', condition: 'Foggy' };
  if (code <= 55) return { icon: '🌦️', condition: 'Drizzle' };
  if (code <= 65) return { icon: '🌧️', condition: 'Rain' };
  if (code <= 77) return { icon: '❄️', condition: 'Snow' };
  if (code <= 82) return { icon: '🌧️', condition: 'Showers' };
  if (code <= 86) return { icon: '❄️', condition: 'Snow Showers' };
  return { icon: '⛈️', condition: 'Thunderstorm' };
}

// GET /api/runs/nearby?lat=&lng=&limit=  — ordered by haversine distance
router.get('/nearby', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const limit = Math.min(parseInt((req.query.limit as string) || '3', 10), 20);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: 'Valid lat and lng query params are required' });
    return;
  }

  try {
    const result = await pool.query(`
      SELECT r.*,
        c.name AS club_name,
        c.created_at AS club_created_at,
        COALESCE(json_agg(ra.user_id) FILTER (WHERE ra.user_id IS NOT NULL), '[]') AS attendees,
        (3959 * acos(LEAST(1.0,
          cos(radians($1)) * cos(radians(r.start_lat::float))
            * cos(radians(r.start_lng::float) - radians($2))
          + sin(radians($1)) * sin(radians(r.start_lat::float))
        ))) AS distance_miles
      FROM run_events r
      LEFT JOIN run_attendees ra ON ra.run_id = r.id
      LEFT JOIN clubs c ON r.club_id = c.id
      WHERE r.status = 'active'
        AND r.event_date >= CURRENT_TIMESTAMP
        AND r.start_lat IS NOT NULL
        AND r.start_lng IS NOT NULL
      GROUP BY r.id, c.id
      ORDER BY distance_miles ASC
      LIMIT $3
    `, [lat, lng, limit]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id/weather', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT start_lat, start_lng FROM run_events WHERE id = $1', [req.params.id]);
    if (!result.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    const { start_lat, start_lng } = result.rows[0];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${start_lat}&longitude=${start_lng}&current=temperature_2m,weathercode`;
    const weatherRes = await fetch(url);
    if (!weatherRes.ok) { res.status(502).json({ error: 'Weather service unavailable' }); return; }
    const data: any = await weatherRes.json();
    const temp = Math.round(data.current.temperature_2m);
    const { icon, condition } = wmoToWeather(data.current.weathercode);
    res.json({ temp, condition, icon });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT r.*, COALESCE(json_agg(ra.user_id) FILTER (WHERE ra.user_id IS NOT NULL), '[]') AS attendees FROM run_events r LEFT JOIN run_attendees ra ON ra.run_id = r.id WHERE r.id = $1 GROUP BY r.id`, [req.params.id]);
    if (!result.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id/attendees', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.display_name, ra.joined_at,
        EXISTS(
          SELECT 1 FROM run_attendees ra2
          WHERE ra2.user_id = u.id
            AND ra2.strava_activity_id IS NOT NULL
            AND ra2.strava_average_speed > 0
        ) AS has_verified_pace
       FROM run_attendees ra
       JOIN users u ON u.id = ra.user_id
       WHERE ra.run_id = $1
       ORDER BY ra.joined_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const {
    clubId,
    title,
    startLocation,
    endLocation,
    startAddress,
    endAddress,
    date,
    distanceKm,
    estimatedMinutes,
    maxAttendees,
    notes,
    pace,
    tags,
    runType
  } = req.body;

  try {
    let resolvedClubId: string | null = null;
    let resolvedClubName = 'Independent Run';

    if (clubId) {
      const clubCheck = await pool.query(
        `
        SELECT c.id, c.name
        FROM clubs c
        LEFT JOIN club_members cm
          ON cm.club_id = c.id AND cm.user_id = $2
        WHERE c.id = $1
          AND (
            c.owner_id = $2
            OR cm.role IN ('owner', 'organizer')
          )
        `,
        [clubId, req.user!.id]
      );

      if (!clubCheck.rows.length) {
        res.status(403).json({ error: 'Not allowed to create runs for this club' });
        return;
      }

      resolvedClubId = clubCheck.rows[0].id;
      resolvedClubName = clubCheck.rows[0].name;
    }

    const result = await pool.query(
      `
      INSERT INTO run_events (
        club_id, club_name, title,
        start_lat, start_lng, end_lat, end_lng,
        start_address, end_address, event_date,
        distance_km, estimated_minutes, max_attendees,
        notes, pace, tags, run_type, created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      )
      RETURNING *
      `,
      [
        resolvedClubId,
        resolvedClubName,
        title,
        startLocation.lat,
        startLocation.lng,
        endLocation.lat,
        endLocation.lng,
        startAddress,
        endAddress,
        date,
        distanceKm,
        estimatedMinutes,
        maxAttendees ?? null,
        notes ?? null,
        pace ?? null,
        tags ?? [],
        runType ?? null,
        req.user!.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, startAddress, endAddress, startLocation, endLocation, date, distanceKm, estimatedMinutes, maxAttendees, notes, status, pace, tags, runType } = req.body;
  try {
    const existing = await pool.query('SELECT created_by FROM run_events WHERE id = $1', [id]);
    if (!existing.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    if (existing.rows[0].created_by !== req.user!.id) { res.status(403).json({ error: 'Forbidden' }); return; }
    const result = await pool.query(`UPDATE run_events SET title=COALESCE($1,title), start_address=COALESCE($2,start_address), end_address=COALESCE($3,end_address), start_lat=COALESCE($4,start_lat), start_lng=COALESCE($5,start_lng), end_lat=COALESCE($6,end_lat), end_lng=COALESCE($7,end_lng), event_date=COALESCE($8,event_date), distance_km=COALESCE($9,distance_km), estimated_minutes=COALESCE($10,estimated_minutes), max_attendees=COALESCE($11,max_attendees), notes=COALESCE($12,notes), status=COALESCE($13,status), pace=COALESCE($14,pace), tags=COALESCE($15,tags), run_type=COALESCE($16,run_type) WHERE id=$17 RETURNING *`,
      [title ?? null, startAddress ?? null, endAddress ?? null, startLocation?.lat ?? null, startLocation?.lng ?? null, endLocation?.lat ?? null, endLocation?.lng ?? null, date ?? null, distanceKm ?? null, estimatedMinutes ?? null, maxAttendees ?? null, notes ?? null, status ?? null, pace ?? null, tags ?? null, runType ?? null, id]);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await pool.query('SELECT created_by FROM run_events WHERE id = $1', [id]);
    if (!existing.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    if (existing.rows[0].created_by !== req.user!.id) { res.status(403).json({ error: 'Forbidden' }); return; }
    await pool.query('DELETE FROM run_attendees WHERE run_id = $1', [id]);
    await pool.query('DELETE FROM run_events WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/runs/:id/link-strava — save selected Strava activity to run_attendees
router.post('/:id/link-strava', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { strava_activity_id, strava_distance, strava_moving_time, strava_average_speed, strava_polyline } = req.body;

  if (!strava_activity_id) {
    res.status(400).json({ error: 'strava_activity_id is required' });
    return;
  }

  try {
    const attendeeCheck = await pool.query(
      'SELECT 1 FROM run_attendees WHERE run_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!attendeeCheck.rows.length) {
      res.status(403).json({ error: 'You are not an attendee of this run' });
      return;
    }

    const result = await pool.query(
      `UPDATE run_attendees
       SET strava_activity_id = $1, strava_distance = $2, strava_moving_time = $3,
           strava_average_speed = $4, strava_polyline = $5
       WHERE run_id = $6 AND user_id = $7
       RETURNING *`,
      [
        strava_activity_id,
        strava_distance ?? null,
        strava_moving_time ?? null,
        strava_average_speed ?? null,
        strava_polyline ?? null,
        id,
        userId,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/join', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params; const userId = req.user!.id;
  try {
    const existing = await pool.query('SELECT 1 FROM run_attendees WHERE run_id=$1 AND user_id=$2', [id, userId]);
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM run_attendees WHERE run_id=$1 AND user_id=$2', [id, userId]);
      res.json({ joined: false });
    } else {
      await pool.query('INSERT INTO run_attendees (run_id, user_id) VALUES ($1,$2)', [id, userId]);
      res.json({ joined: true });
    }
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/runs/:id/comments — fetch comments for a run with user details (public read; posting requires auth)
router.get('/:id/comments', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT rc.id, rc.run_id, rc.user_id, rc.content, rc.created_at,
              u.display_name, u.avatar_url
       FROM run_comments rc
       JOIN users u ON rc.user_id = u.id
       WHERE rc.run_id = $1
       ORDER BY rc.created_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/runs/:id/comments — create a new comment on a run
router.post('/:id/comments', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim() === '') {
    res.status(400).json({ error: 'Content is required and must be a non-empty string' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO run_comments (run_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, run_id, user_id, content, created_at`,
      [id, req.user!.id, content.trim()]
    );

    if (!result.rows.length) {
      res.status(500).json({ error: 'Failed to create comment' });
      return;
    }

    const commentId = result.rows[0].id;

    const fullComment = await pool.query(
      `SELECT rc.id, rc.run_id, rc.user_id, rc.content, rc.created_at,
              u.display_name, u.avatar_url
       FROM run_comments rc
       JOIN users u ON rc.user_id = u.id
       WHERE rc.id = $1`,
      [commentId]
    );

    res.status(201).json(fullComment.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
