import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './db';
import authRoutes from './routes/auth.routes';
import runsRoutes from './routes/runs.routes';
import clubsRoutes from './routes/clubs.routes';
import geocodeRoutes from './routes/geocode.routes';
import { loginLimiter, registerLimiter, geocodeLimiter, apiLimiter } from './middleware/rate-limit.middleware';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:4200',
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Rate limiting — applied before routes
app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/geocode', geocodeLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/runs', runsRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/geocode', geocodeRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

async function start() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    console.error('FATAL: JWT_SECRET must be set and at least 32 characters long');
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