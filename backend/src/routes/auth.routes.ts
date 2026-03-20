import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { displayName, email, password, role } = req.body;
  if (!displayName || !email || !password || !role) { res.status(400).json({ error: 'All fields required' }); return; }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) { res.status(409).json({ error: 'Email already registered' }); return; }
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query('INSERT INTO users (display_name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, display_name, email, role', [displayName, email, hash, role]);
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' } as any);
    res.status(201).json({ token, user: { id: user.id, displayName: user.display_name, email: user.email, role: user.role } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: 'Email and password required' }); return; }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' } as any);
    res.json({ token, user: { id: user.id, displayName: user.display_name, email: user.email, role: user.role } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

export default router;