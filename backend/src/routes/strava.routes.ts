import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { encrypt } from '../utils/crypto.util';

const router = Router();

// In-memory state store: state token -> { userId, expiresAt }
// Acceptable for single-instance deployment; swap for Redis in distributed setup.
interface StateEntry {
  userId: string;
  expiresAt: number; // ms since epoch
}
const stateStore = new Map<string, StateEntry>();
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function pruneExpiredStates() {
  const now = Date.now();
  for (const [key, entry] of stateStore) {
    if (entry.expiresAt < now) stateStore.delete(key);
  }
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix seconds
  athlete: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
}

interface StravaErrorResponse {
  message: string;
  errors?: Array<{ field: string; code: string }>;
}

// ── GET /api/auth/strava ──────────────────────────────────────────────────────
// Initiates OAuth flow. The frontend passes the JWT as ?token= because this is
// a browser-side redirect (no Authorization header possible).
router.get('/strava', (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Missing token query parameter' });
    return;
  }

  let userId: string;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    userId = payload.id;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  pruneExpiredStates();

  const state = crypto.randomBytes(32).toString('hex');
  stateStore.set(state, { userId, expiresAt: Date.now() + STATE_TTL_MS });

  const backendUrl = process.env.BACKEND_URL ?? `${req.protocol}://${req.get('host')}`;
  const redirectUri = process.env.STRAVA_REDIRECT_URI ?? `${backendUrl}/api/auth/strava/callback`;

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read',
    state,
  });

  res.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
});

// ── GET /api/auth/strava/callback ─────────────────────────────────────────────
// Strava redirects here after user authorises. Exchanges code for tokens and
// saves them to the authenticated user's DB record.
router.get('/strava/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    res.status(400).json({ error: `Strava OAuth error: ${error}` });
    return;
  }

  if (!state || typeof state !== 'string') {
    res.status(400).json({ error: 'Missing state parameter' });
    return;
  }

  pruneExpiredStates();

  const entry = stateStore.get(state);
  if (!entry || entry.expiresAt < Date.now()) {
    stateStore.delete(state);
    res.status(400).json({ error: 'Invalid or expired state token' });
    return;
  }

  const { userId } = entry;
  stateStore.delete(state);

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  // Exchange code for tokens
  let stravaData: StravaTokenResponse;
  try {
    const tokenRes = await fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const body = await tokenRes.json() as StravaTokenResponse | StravaErrorResponse;

    if (!tokenRes.ok) {
      const err = body as StravaErrorResponse;
      console.error('Strava token exchange failed:', err);
      res.status(502).json({ error: 'Strava token exchange failed', detail: err.message });
      return;
    }

    stravaData = body as StravaTokenResponse;
  } catch (err) {
    console.error('Strava API unreachable:', err);
    res.status(502).json({ error: 'Could not reach Strava API' });
    return;
  }

  // Persist tokens to user record
  try {
    await pool.query(
      `UPDATE users SET
         strava_athlete_id      = $1,
         strava_access_token    = $2,
         strava_refresh_token   = $3,
         strava_token_expires_at = $4
       WHERE id = $5`,
      [
        stravaData.athlete.id,
        encrypt(stravaData.access_token),
        encrypt(stravaData.refresh_token),
        stravaData.expires_at,
        userId,
      ],
    );
  } catch (err) {
    console.error('Failed to save Strava tokens:', err);
    res.status(500).json({ error: 'Failed to save Strava tokens' });
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4201';
  res.redirect(`${frontendUrl}/profile?strava=connected`);
});

export default router;
