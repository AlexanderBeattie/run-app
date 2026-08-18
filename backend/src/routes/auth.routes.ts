import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_MIN = 8;
const PW_MAX = 128;

function signAccess(payload: { id: string; email: string; role: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' } as any);
}

async function issueRefreshToken(userId: string): Promise<string> {
  const raw = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hash, expiresAt],
  );
  return raw;
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const { displayName, email, password } = req.body;

  if (!displayName || !email || !password) {
    res.status(400).json({ error: 'All fields required' });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  if (typeof password !== 'string' || password.length < PW_MIN || password.length > PW_MAX) {
    res.status(400).json({ error: `Password must be ${PW_MIN}–${PW_MAX} characters` });
    return;
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const role = 'runner'; // never trust client-supplied role
    const result = await pool.query(
      'INSERT INTO users (display_name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, display_name, email, role',
      [displayName, email, hash, role],
    );
    const user = result.rows[0];
    const token = signAccess({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({
      token,
      expiresIn: 3600,
      user: { id: user.id, displayName: user.display_name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  try {
    // Explicit columns — never SELECT *
    const result = await pool.query(
      'SELECT id, display_name, email, password_hash, role, strava_athlete_id FROM users WHERE email = $1',
      [email],
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signAccess({ id: user.id, email: user.email, role: user.role });
    const refreshToken = await issueRefreshToken(user.id);

    res.json({
      token,
      refreshToken,
      expiresIn: 3600,
      user: { id: user.id, displayName: user.display_name, email: user.email, role: user.role, stravaConnected: !!user.strava_athlete_id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Refresh ───────────────────────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const result = await pool.query(
      `SELECT rt.user_id, rt.expires_at, u.email, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash],
    );
    const row = result.rows[0];

    if (!row || new Date(row.expires_at) < new Date()) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const token = signAccess({ id: row.user_id, email: row.email, role: row.role });
    res.json({ token, expiresIn: 3600 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(204).send();
    return;
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Forgot Password ────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email required' });
    return;
  }

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, tokenHash, expiresAt],
      );

      // TODO: Send email with reset link. For now, log the token.
      console.log(`[RESET TOKEN] user_id=${user.id} token=${rawToken}`);
    }

    // Always return 200 to avoid leaking whether email exists
    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Reset Password ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token and new password required' });
    return;
  }

  if (typeof newPassword !== 'string' || newPassword.length < PW_MIN || newPassword.length > PW_MAX) {
    res.status(400).json({ error: `Password must be ${PW_MIN}–${PW_MAX} characters` });
    return;
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await pool.query(
      `SELECT user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used = false AND expires_at > NOW()`,
      [tokenHash],
    );
    const row = result.rows[0];

    if (!row) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, row.user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE token_hash = $1', [tokenHash]);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
