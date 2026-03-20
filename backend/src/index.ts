import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './db';
import authRoutes from './routes/auth.routes';
import runsRoutes from './routes/runs.routes';
import clubsRoutes from './routes/clubs.routes';

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

app.use('/api/auth', authRoutes);
app.use('/api/runs', runsRoutes);
app.use('/api/clubs', clubsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

async function start() {
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