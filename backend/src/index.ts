import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './db';
import authRoutes from './routes/auth.routes';
import runsRoutes from './routes/runs.routes';
import clubsRoutes from './routes/clubs.routes';
import geocodeRoutes from './routes/geocode.routes';
import usersRoutes from './routes/users.routes';
import stravaRoutes from './routes/strava.routes';
import { loginLimiter, registerLimiter, geocodeLimiter, apiLimiter } from './middleware/rate-limit.middleware';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:4201',
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Rate limiting — applied before routes
app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/geocode', geocodeLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/runs', runsRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auth', stravaRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Handle payload too large errors
app.use((err: { type?: string; status?: number }, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    res.status(413).json({ error: 'Payload too large. Maximum 5MB allowed.' });
    return;
  }
  next(err);
});

async function start() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    console.error('FATAL: JWT_SECRET must be set and at least 32 characters long');
    process.exit(1);
  }

  if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET || !process.env.STRAVA_REDIRECT_URI) {
    console.error('FATAL: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REDIRECT_URI must be set');
    process.exit(1);
  }

  try {
    await pool.query('SELECT 1');
    console.log('Postgres connected');

    app.listen(PORT, () => {
      console.log(`KLUB API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to Postgres:', err);
    process.exit(1);
  }
}

start();