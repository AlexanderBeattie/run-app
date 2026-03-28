/**
 * KLUB — Database Seed Script
 * Populates the database with realistic test data (Glasgow-based run clubs).
 *
 * Usage:
 *   npm run db:seed              (from backend/)
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
    const westEndId  = randomUUID();
    const southsideId = randomUUID();

    await client.query(`
      INSERT INTO clubs (id, name, description, owner_id, city, pace, tags, member_count) VALUES
        (
          $1,
          'West End Wanderers',
          'Glasgow''s friendliest running crew. We meet at Kelvingrove Park every Saturday — all paces welcome, coffee at the café after.',
          $3, 'Glasgow', 'social',
          ARRAY['social', 'beginner-friendly', 'west-end'],
          14
        ),
        (
          $2,
          'Southside Striders',
          'Weekly runs across the Southside. Pollok Park, Cathkin Braes, and everything in between. Pub stop mandatory.',
          $4, 'Glasgow', 'easy',
          ARRAY['scenic', 'social', 'southside'],
          9
        )
    `, [westEndId, southsideId, sarahId, jamesId]);
    console.log('  ✓ Clubs inserted (2)');

    // ── Club Members ──────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO club_members (club_id, user_id, role) VALUES
        ($1, $3, 'owner'),
        ($1, $4, 'member'),
        ($1, $5, 'member'),
        ($2, $6, 'owner'),
        ($2, $7, 'member')
    `, [westEndId, southsideId, sarahId, emmaId, tomId, jamesId, priyaId]);
    console.log('  ✓ Club members inserted (5)');

    // ── Run Events ────────────────────────────────────────────────────────────
    // Varied Glasgow coordinates to showcase route art direction differences:
    //   George Square:       55.8617, -4.2519
    //   Kelvingrove Park:    55.8694, -4.2888  (NW of centre)
    //   Glasgow Green:       55.8484, -4.2371  (SE of centre)
    //   Pollok Country Park: 55.8243, -4.3124  (south)
    //   Mugdock Country Park:55.9745, -4.3202  (far north)
    //   Cathkin Braes:       55.7919, -4.2103  (far south)
    //   Milngavie:           55.9419, -4.3143  (north)
    //   Clydebank:           55.8993, -4.4097  (NW)

    const run1Id = randomUUID(); // Kelvingrove loop — flat line (loop)
    const run2Id = randomUUID(); // George Sq → Mugdock — strong north (line goes up)
    const run3Id = randomUUID(); // Kelvingrove → Glasgow Green — eastward, slight south
    const run4Id = randomUUID(); // Pollok Park trail — slight south loop
    const run5Id = randomUUID(); // George Sq → Cathkin Braes — strong south (line goes down)
    const run6Id = randomUUID(); // Milngavie → Mugdock → back — moderate north
    const run7Id = randomUUID(); // George Sq → Clydebank — northwest, moderate north

    await client.query(`
      INSERT INTO run_events (
        id, club_id, club_name, title,
        start_lat, start_lng, end_lat, end_lng,
        start_address, end_address,
        event_date, distance_km, estimated_minutes,
        max_attendees, notes, pace, tags, run_type, created_by
      ) VALUES
        (
          $1, $8, 'West End Wanderers', 'Kelvingrove Saturday Social',
          55.86940000, -4.28880000, 55.86940000, -4.28880000,
          'Kelvingrove Park, Glasgow G3 7QL',
          'Kelvingrove Park, Glasgow G3 7QL',
          NOW() + INTERVAL '1 day' + TIME '09:00:00',
          5.00, 30, 25,
          'Loop around the park — two laps then coffee at the museum café. Look for the green flag.',
          'social', ARRAY['social', 'beginner-friendly', 'parkland'], 'club_run', $10
        ),
        (
          $2, $8, 'West End Wanderers', 'Mugdock Trail Challenge',
          55.86170000, -4.25190000, 55.97450000, -4.32020000,
          'George Square, Glasgow G2 1DU',
          'Mugdock Country Park, Milngavie G62 8EL',
          NOW() + INTERVAL '3 days' + TIME '07:30:00',
          18.00, 110, 15,
          'Epic point-to-point north out of the city to Mugdock. Trail shoes essential past Milngavie. Train back from Milngavie station.',
          'moderate', ARRAY['trail', 'point-to-point', 'epic'], 'trail_run', $10
        ),
        (
          $3, $8, 'West End Wanderers', 'West to East Easy Run',
          55.86940000, -4.28880000, 55.84840000, -4.23710000,
          'Kelvingrove Park, Glasgow G3 7QL',
          'Glasgow Green, Glasgow G40 1AT',
          NOW() + INTERVAL '5 days' + TIME '08:00:00',
          7.00, 42, 20,
          'Kelvingrove to Glasgow Green via the city centre. Flat route, good for an easy long run day.',
          'easy', ARRAY['easy', 'scenic', 'city'], 'club_run', $10
        ),
        (
          $4, $9, 'Southside Striders', 'Pollok Park Trail Run',
          55.82430000, -4.31240000, 55.82430000, -4.31240000,
          'Pollok Country Park, 2060 Pollokshaws Rd, Glasgow G43 1AT',
          'Pollok Country Park, 2060 Pollokshaws Rd, Glasgow G43 1AT',
          NOW() + INTERVAL '4 days' + TIME '08:30:00',
          8.00, 52, 20,
          'Trail loop through Pollok — highland cattle on the route, watch your step. Dogs welcome.',
          'easy', ARRAY['trail', 'dog-friendly', 'muddy'], 'trail_run', $11
        ),
        (
          $5, $9, 'Southside Striders', 'Cathkin Braes Hill Reps',
          55.86170000, -4.25190000, 55.79190000, -4.21030000,
          'George Square, Glasgow G2 1DU',
          'Cathkin Braes Country Park, Glasgow G45 9SW',
          NOW() + INTERVAL '6 days' + TIME '07:00:00',
          12.00, 80, 12,
          'South out of the city climbing to Cathkin Braes — stunning views of the Campsies on a clear day. Tough finish.',
          'fast', ARRAY['hills', 'views', 'challenging'], 'training_group', $11
        ),
        (
          $6, NULL, 'Independent Run', 'Milngavie Parkrun-Style 5K',
          55.94190000, -4.31430000, 55.94190000, -4.31430000,
          'Milngavie Train Station, Glasgow G62 8HH',
          'Milngavie Train Station, Glasgow G62 8HH',
          NOW() + INTERVAL '2 days' + TIME '09:00:00',
          5.00, 28, 60,
          'Free timed 5K on the West Highland Way approach trail. Flat and fast. All abilities welcome.',
          'social', ARRAY['timed', 'flat', 'all-abilities'], 'parkrun_style', $10
        ),
        (
          $7, $9, 'Southside Striders', 'Clydebank Riverside Run',
          55.86170000, -4.25190000, 55.89930000, -4.40970000,
          'George Square, Glasgow G2 1DU',
          'Clydebank Shopping Centre, Glasgow G81 1BF',
          NOW() + INTERVAL '10 days' + TIME '18:30:00',
          10.00, 58, 18,
          'Evening run northwest along the Clyde to Clydebank. Flat towpath all the way. Bus back from Clydebank.',
          'tempo', ARRAY['evening', 'riverside', 'social'], 'club_run', $11
        )
    `, [run1Id, run2Id, run3Id, run4Id, run5Id, run6Id, run7Id, westEndId, southsideId, sarahId, jamesId]);
    console.log('  ✓ Run events inserted (7)');

    // ── Run Attendees ─────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO run_attendees (run_id, user_id) VALUES
        ($1, $8), ($1, $9), ($1, $10),
        ($2, $8),
        ($3, $8), ($3, $9),
        ($4, $9), ($4, $10),
        ($5, $8), ($5, $9), ($5, $10),
        ($6, $8), ($6, $9), ($6, $10),
        ($7, $8), ($7, $9)
    `, [run1Id, run2Id, run3Id, run4Id, run5Id, run6Id, run7Id, emmaId, tomId, priyaId]);
    console.log('  ✓ Run attendees inserted');

    await client.query('COMMIT');

    console.log('\n✅ Seed complete!\n');
    console.log('Test accounts (password: Klub1234!):');
    console.log('  sarah@example.com  — organiser, West End Wanderers');
    console.log('  james@example.com  — organiser, Southside Striders');
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
