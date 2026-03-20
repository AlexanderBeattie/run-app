import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT r.*, COALESCE(json_agg(ra.user_id) FILTER (WHERE ra.user_id IS NOT NULL), '[]') AS attendees FROM run_events r LEFT JOIN run_attendees ra ON ra.run_id = r.id WHERE r.status = 'active' GROUP BY r.id ORDER BY r.event_date ASC`);
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
    const result = await pool.query(`SELECT r.*, COALESCE(json_agg(ra2.user_id) FILTER (WHERE ra2.user_id IS NOT NULL), '[]') AS attendees FROM run_events r JOIN run_attendees ra ON ra.run_id = r.id AND ra.user_id = $1 LEFT JOIN run_attendees ra2 ON ra2.run_id = r.id GROUP BY r.id ORDER BY r.event_date ASC`, [req.user!.id]);
    res.json(result.rows);
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
    const result = await pool.query(`SELECT u.id, u.display_name, ra.joined_at FROM run_attendees ra JOIN users u ON u.id = ra.user_id WHERE ra.run_id = $1 ORDER BY ra.joined_at ASC`, [req.params.id]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { clubId, clubName, title, startLocation, endLocation, startAddress, endAddress, date, distanceKm, estimatedMinutes, maxAttendees, notes } = req.body;
  try {
    const result = await pool.query(`INSERT INTO run_events (club_id, club_name, title, start_lat, start_lng, end_lat, end_lng, start_address, end_address, event_date, distance_km, estimated_minutes, max_attendees, notes, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [clubId??null, clubName, title, startLocation.lat, startLocation.lng, endLocation.lat, endLocation.lng, startAddress, endAddress, date, distanceKm, estimatedMinutes, maxAttendees??null, notes??null, req.user!.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, startAddress, endAddress, startLocation, endLocation, date, distanceKm, estimatedMinutes, maxAttendees, notes, status } = req.body;
  try {
    const existing = await pool.query('SELECT created_by FROM run_events WHERE id = $1', [id]);
    if (!existing.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    if (existing.rows[0].created_by !== req.user!.id) { res.status(403).json({ error: 'Forbidden' }); return; }
    const result = await pool.query(`UPDATE run_events SET title=COALESCE($1,title), start_address=COALESCE($2,start_address), end_address=COALESCE($3,end_address), start_lat=COALESCE($4,start_lat), start_lng=COALESCE($5,start_lng), end_lat=COALESCE($6,end_lat), end_lng=COALESCE($7,end_lng), event_date=COALESCE($8,event_date), distance_km=COALESCE($9,distance_km), estimated_minutes=COALESCE($10,estimated_minutes), max_attendees=COALESCE($11,max_attendees), notes=COALESCE($12,notes), status=COALESCE($13,status) WHERE id=$14 RETURNING *`,
      [title??null, startAddress??null, endAddress??null, startLocation?.lat??null, startLocation?.lng??null, endLocation?.lat??null, endLocation?.lng??null, date??null, distanceKm??null, estimatedMinutes??null, maxAttendees??null, notes??null, status??null, id]);
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

export default router;