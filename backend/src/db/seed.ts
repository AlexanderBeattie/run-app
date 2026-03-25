/**
 * KLUB — Database Seed Script
 * Populates the database with realistic test data (London-based run clubs).
 *
 * Usage:
 *   npm run db:seed              (from repo root or backend/)
 *
 * All test accounts use password: Klub1234!
 *
 * WARNING: This TRUNCATES all existing data before inserting.
 *          Do NOT run against production.
 */

import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const DEFAULT_PASSWORD = 'Klub1234!';
const SALT_ROUNDS = 10;

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting seed...\n');

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    await client.query('BEGIN');

    // ── Truncate ──────────────────────────────────────────────────────────────
    await client.query(`
      TRUNCATE
        run_attendees, run_events,
        club_members, clubs,
        refresh_tokens, password_reset_tokens,
        users
      RESTART IDENTITY CASCADE
    `);
    console.log('  ✓ Existing data cleared');

    // ── Users ─────────────────────────────────────────────────────────────────
    const sarahId = randomUUID(); // organiser
    const jamesId = randomUUID(); // organiser
    const emmaId  = randomUUID(); // runner
    const tomId   = randomUUID(); // runner
    const priyaId = randomUUID(); // runner

    await client.query(`
      INSERT INTO users (id, display_name, email, password_hash, role) VALUES
        ($1, 'Sarah Chen',    'sarah@example.com', $6, 'organizer'),
        ($2, 'James Okafor', 'james@example.com', $6, 'organizer'),
        ($3, 'Emma Walsh',   'emma@example.com',  $6, 'runner'),
        ($4, 'Tom Briggs',   'tom@example.com',   $6, 'runner'),
        ($5, 'Priya Sharma', 'priya@example.com', $6, 'runner')
    `, [sarahId, jamesId, emmaId, tomId, priyaId, passwordHash]);
    console.log('  ✓ Users inserted (5)');

    // ── Clubs ─────────────────────────────────────────────────────────────────
    const hackneyId   = randomUUID();
    const southBankId = randomUUID();

    await client.query(`
      INSERT INTO clubs (id, name, description, owner_id, city, pace, tags, member_count) VALUES
        (
          $1,
          'Hackney Harriers',
          'East London''s friendliest running crew. We meet at Victoria Park every Saturday — all paces welcome, coffee and bagels after.',
          $3, 'London', '5:30',
          ARRAY['social', 'beginner-friendly', 'east-london'],
          12
        ),
        (
          $2,
          'South Bank Striders',
          'Weekly runs along the Thames with views to match. Waterloo start, finish wherever the mood takes us. Coffee mandatory.',
          $4, 'London', '5:00',
          ARRAY['scenic', 'social', 'central-london'],
          8
        )
    `, [hackneyId, southBankId, sarahId, jamesId]);
    console.log('  ✓ Clubs inserted (2)');

    // ── Club Members ──────────────────────────────────────────────────────────
    // $1=hackneyId $2=southBankId $3=sarahId $4=emmaId $5=tomId $6=jamesId $7=priyaId
    await client.query(`
      INSERT INTO club_members (club_id, user_id, role) VALUES
        ($1, $3, 'owner'),
        ($1, $4, 'member'),
        ($1, $5, 'member'),
        ($2, $6, 'owner'),
        ($2, $7, 'member')
    `, [hackneyId, southBankId, sarahId, emmaId, tomId, jamesId, priyaId]);
    console.log('  ✓ Club members inserted (5)');

    // ── Run Events ────────────────────────────────────────────────────────────
    // Dates use NOW() + INTERVAL so they're always upcoming.
    // London coordinates: Victoria Park, South Bank, Hackney Marshes, Regent's Park,
    //                     Hyde Park, Tower Bridge, Battersea Power Station.

    const run1Id = randomUUID(); // Victoria Park Morning Run
    const run2Id = randomUUID(); // Thames Path 10K
    const run3Id = randomUUID(); // Hackney Marshes Trail
    const run4Id = randomUUID(); // Regent's Park Tempo
    const run5Id = randomUUID(); // Hyde Park Parkrun-style
    const run6Id = randomUUID(); // East London 10-Miler
    const run7Id = randomUUID(); // South Bank Sunset Run

    // Params: $1–$7 = run IDs, $8=hackneyId, $9=southBankId, $10=sarahId, $11=jamesId
    await client.query(`
      INSERT INTO run_events (
        id, club_id, club_name, title,
        start_lat, start_lng, end_lat, end_lng,
        start_address, end_address,
        event_date, distance_km, estimated_minutes,
        max_attendees, notes, pace, tags, run_type, created_by
      ) VALUES
        (
          $1, $8, 'Hackney Harriers', 'Victoria Park Morning Run',
          51.53620000, -0.03660000, 51.53620000, -0.03660000,
          'Victoria Park Café, Grove Road, London E3 5TG',
          'Victoria Park Café, Grove Road, London E3 5TG',
          NOW() + INTERVAL '1 day' + TIME '08:00:00',
          5.00, 30, 25,
          'Meet outside the café — look for the green KLUB flag. Two laps of the park then coffee.',
          '5:30', ARRAY['social', 'beginner-friendly', 'parkland'], 'club_run', $10
        ),
        (
          $2, $9, 'South Bank Striders', 'Thames Path 10K',
          51.50550000, -0.11450000, 51.50880000, -0.07540000,
          'Waterloo Bridge South Side, London SE1 8XZ',
          'Tower Bridge Road, London SE1 2UP',
          NOW() + INTERVAL '3 days' + TIME '07:30:00',
          10.00, 55, 20,
          'Point-to-point from Waterloo to Tower Bridge along the South Bank. Oyster card needed for the return.',
          '5:00', ARRAY['scenic', 'riverside', 'point-to-point'], 'club_run', $11
        ),
        (
          $3, $8, 'Hackney Harriers', 'Hackney Marshes Trail Blast',
          51.55320000, -0.02710000, 51.55320000, -0.02710000,
          'Hackney Marshes Car Park, Homerton Road, London E9 5PF',
          'Hackney Marshes Car Park, Homerton Road, London E9 5PF',
          NOW() + INTERVAL '7 days' + TIME '08:00:00',
          8.00, 55, 15,
          'Trail shoes recommended — the marshes get muddy. Out-and-back along the Lea Navigation. Dogs welcome.',
          '5:45', ARRAY['trail', 'muddy', 'dog-friendly'], 'trail_run', $10
        ),
        (
          $4, NULL, 'Independent Run', 'Regent''s Park Tempo Session',
          51.53130000, -0.15700000, 51.53130000, -0.15700000,
          'Regent''s Park, Chester Road entrance, London NW1 4NR',
          'Regent''s Park, Chester Road entrance, London NW1 4NR',
          NOW() + INTERVAL '4 days' + TIME '06:45:00',
          6.00, 35, 12,
          '3×2km tempo reps on the inner circle. Structured session — bring a watch. Warm-up and cool-down included.',
          '4:30', ARRAY['tempo', 'structured', 'fast'], 'training_group', $10
        ),
        (
          $5, NULL, 'Independent Run', 'Hyde Park Parkrun-Style 5K',
          51.50740000, -0.16570000, 51.50740000, -0.16570000,
          'Hyde Park, near Bandstand, London W2 2UH',
          'Hyde Park, near Bandstand, London W2 2UH',
          NOW() + INTERVAL '5 days' + TIME '09:00:00',
          5.00, 28, 50,
          'Free, timed, flat 5K loop around the bandstand. Chip timing provided. All abilities welcome — walkers too.',
          '5:30', ARRAY['timed', 'flat', 'all-abilities'], 'parkrun_style', $11
        ),
        (
          $6, $8, 'Hackney Harriers', 'East London 10-Miler',
          51.55320000, -0.02710000, 51.53620000, -0.03660000,
          'Hackney Marshes Car Park, Homerton Road, London E9 5PF',
          'Victoria Park Café, Grove Road, London E3 5TG',
          NOW() + INTERVAL '14 days' + TIME '08:30:00',
          16.09, 95, 60,
          'Annual Hackney Harriers 10-miler. Marshes → Olympic Park → Victoria Park. Medal and t-shirt for all finishers. Water at miles 3, 6, and 9.',
          '5:15', ARRAY['race', 'medal', 'scenic', 'east-london'], 'one_off_race', $10
        ),
        (
          $7, $9, 'South Bank Striders', 'South Bank Sunset Run',
          51.50550000, -0.11450000, 51.48900000, -0.14560000,
          'Waterloo Bridge South Side, London SE1 8XZ',
          'Battersea Power Station, Nine Elms Lane, London SW8 5BP',
          NOW() + INTERVAL '9 days' + TIME '18:30:00',
          7.00, 42, 20,
          'Evening run as the sun sets over the Thames. Waterloo to Battersea via Vauxhall Bridge. Pub stop at The Dovetail after.',
          '5:00', ARRAY['evening', 'scenic', 'social', 'pub-after'], 'club_run', $11
        )
    `, [run1Id, run2Id, run3Id, run4Id, run5Id, run6Id, run7Id, hackneyId, southBankId, sarahId, jamesId]);
    console.log('  ✓ Run events inserted (7)');

    // ── Run Attendees ─────────────────────────────────────────────────────────
    // $1–$7 = run IDs, $8=emmaId, $9=tomId, $10=priyaId
    await client.query(`
      INSERT INTO run_attendees (run_id, user_id) VALUES
        ($1, $8), ($1, $9), ($1, $10),
        ($2, $8), ($2, $10),
        ($3, $9),
        ($4, $9), ($4, $10),
        ($5, $8), ($5, $9), ($5, $10),
        ($6, $8),
        ($7, $8), ($7, $9)
    `, [run1Id, run2Id, run3Id, run4Id, run5Id, run6Id, run7Id, emmaId, tomId, priyaId]);
    console.log('  ✓ Run attendees inserted (14 registrations)');

    await client.query('COMMIT');

    console.log('\n✅ Seed complete!\n');
    console.log('Test accounts (password: Klub1234!):');
    console.log('  sarah@example.com  — organiser, owns Hackney Harriers');
    console.log('  james@example.com  — organiser, owns South Bank Striders');
    console.log('  emma@example.com   — runner');
    console.log('  tom@example.com    — runner');
    console.log('  priya@example.com  — runner');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seed failed — rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
