import { Router, Response, Request } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
const router = Router();

// List all clubs with member count + next run date
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM club_members cm WHERE cm.club_id = c.id)::int AS member_count,
        (SELECT MIN(r.event_date) FROM run_events r WHERE r.club_id = c.id AND r.status = 'active' AND r.event_date > NOW()) AS next_run_date
      FROM clubs c
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Clubs current user is a member of
router.get('/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM club_members cm2 WHERE cm2.club_id = c.id)::int AS member_count
      FROM clubs c
      JOIN club_members cm ON cm.club_id = c.id
      WHERE cm.user_id = $1
      ORDER BY cm.joined_at DESC
    `, [req.user!.id]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Create club
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, description, city, pace, tags } = req.body;
  if (!name) { res.status(400).json({ error: 'Club name is required' }); return; }
  try {
    const result = await pool.query(
      'INSERT INTO clubs (name, description, owner_id, city, pace, tags) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, description ?? null, req.user!.id, city ?? null, pace ?? null, tags ?? []]
    );
    const club = result.rows[0];
    // Auto-join owner as member
    await pool.query('INSERT INTO club_members (club_id, user_id, role) VALUES ($1,$2,$3)', [club.id, req.user!.id, 'owner']);
    res.status(201).json(club);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Get single club profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM club_members cm WHERE cm.club_id = c.id)::int AS member_count,
        (SELECT COUNT(*) FROM run_events r WHERE r.club_id = c.id AND r.status = 'active')::int AS active_run_count
      FROM clubs c WHERE c.id = $1
    `, [req.params.id]);
    if (!result.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Update club (owner only)
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, city, pace, tags } = req.body;
  try {
    const existing = await pool.query('SELECT owner_id FROM clubs WHERE id = $1', [id]);
    if (!existing.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    if (existing.rows[0].owner_id !== req.user!.id) { res.status(403).json({ error: 'Forbidden' }); return; }
    const result = await pool.query(`
      UPDATE clubs SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        city = COALESCE($3, city),
        pace = COALESCE($4, pace),
        tags = COALESCE($5, tags)
      WHERE id = $6 RETURNING *
    `, [name ?? null, description ?? null, city ?? null, pace ?? null, tags ?? null, id]);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Get club's runs
router.get('/:id/runs', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.*, COALESCE(json_agg(ra.user_id) FILTER (WHERE ra.user_id IS NOT NULL), '[]') AS attendees
      FROM run_events r LEFT JOIN run_attendees ra ON ra.run_id = r.id
      WHERE r.club_id = $1 AND r.status = 'active'
      GROUP BY r.id ORDER BY r.event_date ASC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Get club members
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.display_name, cm.role, cm.joined_at
      FROM club_members cm JOIN users u ON u.id = cm.user_id
      WHERE cm.club_id = $1 ORDER BY cm.joined_at ASC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Toggle join/leave club
router.post('/:id/join', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  try {
    const club = await pool.query('SELECT owner_id FROM clubs WHERE id = $1', [id]);
    if (!club.rows.length) { res.status(404).json({ error: 'Club not found' }); return; }

    const existing = await pool.query('SELECT 1 FROM club_members WHERE club_id=$1 AND user_id=$2', [id, userId]);
    if (existing.rows.length > 0) {
      if (club.rows[0].owner_id === userId) { res.status(400).json({ error: 'Owner cannot leave their club' }); return; }
      await pool.query('DELETE FROM club_members WHERE club_id=$1 AND user_id=$2', [id, userId]);
      res.json({ joined: false });
    } else {
      await pool.query('INSERT INTO club_members (club_id, user_id) VALUES ($1,$2)', [id, userId]);
      res.json({ joined: true });
    }
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

export default router;