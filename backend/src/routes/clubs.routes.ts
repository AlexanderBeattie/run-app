import { Router, Response, Request } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  try {
    const result = await pool.query('INSERT INTO clubs (name, description, owner_id) VALUES ($1,$2,$3) RETURNING *', [name, description, req.user!.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM clubs WHERE id=$1', [req.params.id]);
    if (!result.rows.length) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

export default router;