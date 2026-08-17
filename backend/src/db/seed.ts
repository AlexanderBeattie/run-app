/**
 * KLUB — Database Seed Script
 * Populates the database with a large, varied set of generated data so the
 * app feels alive: users, clubs, memberships, future + past runs, attendees,
 * Strava-verified paces, and run chat.
 *
 * Usage:
 *   npm run db:seed              (from repo root or backend/)
 *
 * All test accounts use password: Klub1234!
 * Stable logins: sarah@example.com (organiser), emma@example.com (runner)
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

// ── Deterministic RNG so re-seeding gives comparable data ──────────────────
let rngState = 20260815;
function rand(): number {
  rngState |= 0; rngState = (rngState + 0x6D2B79F5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number): number => min + Math.floor(rand() * (max - min + 1));
const chance = (p: number): boolean => rand() < p;
function sample<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  }
  return out;
}

// ── Data pools ─────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  'Aisha', 'Alfie', 'Amara', 'Andreas', 'Aoife', 'Callum', 'Carmen', 'Chidi',
  'Daniyar', 'Dario', 'Eilidh', 'Elena', 'Ewan', 'Fatima', 'Fergus', 'Freya',
  'Gabriel', 'Hana', 'Harris', 'Ines', 'Isla', 'Jakub', 'Jing', 'Kirsty',
  'Lachlan', 'Leire', 'Lewis', 'Lucia', 'Magnus', 'Mairi', 'Marek', 'Mei',
  'Morag', 'Nadia', 'Niamh', 'Oskar', 'Rania', 'Rhona', 'Ross', 'Ruaridh',
  'Sana', 'Seren', 'Struan', 'Tariq', 'Thea', 'Yusuf', 'Zofia', 'Zoe',
];
const LAST_NAMES = [
  'Abara', 'Anderson', 'Baird', 'Bakker', 'Boyle', 'Cameron', 'Campbell',
  'Costa', 'Docherty', 'Donnelly', 'Duffy', 'Ferguson', 'Fraser', 'Gallagher',
  'Garcia', 'Gilmour', 'Hassan', 'Henderson', 'Hunter', 'Ivanova', 'Kelly',
  'Khan', 'Kowalski', 'Lindsay', 'MacLeod', 'Maxwell', 'McAllister', 'McEwan',
  'Mitchell', 'Munro', 'Murray', 'Nakamura', 'Nowak', "O'Neill", 'Osei',
  'Paterson', 'Reid', 'Robertson', 'Silva', 'Sinclair', 'Stewart', 'Wallace',
];

interface SeedLocation { name: string; address: string; lat: number; lng: number }
const GLASGOW_LOCATIONS: SeedLocation[] = [
  { name: 'Kelvingrove Park',    address: 'Kelvingrove Park, Glasgow G3 7QL',                    lat: 55.8694, lng: -4.2888 },
  { name: 'George Square',       address: 'George Square, Glasgow G2 1DU',                       lat: 55.8617, lng: -4.2519 },
  { name: 'Glasgow Green',       address: 'Glasgow Green, Glasgow G40 1AT',                      lat: 55.8484, lng: -4.2371 },
  { name: 'Pollok Country Park', address: 'Pollok Country Park, 2060 Pollokshaws Rd, G43 1AT',   lat: 55.8243, lng: -4.3124 },
  { name: 'Mugdock Country Park',address: 'Mugdock Country Park, Milngavie G62 8EL',             lat: 55.9745, lng: -4.3202 },
  { name: 'Cathkin Braes',       address: 'Cathkin Braes Country Park, Glasgow G45 9SW',         lat: 55.7919, lng: -4.2103 },
  { name: 'Milngavie Station',   address: 'Milngavie Train Station, Glasgow G62 8HH',            lat: 55.9419, lng: -4.3143 },
  { name: 'Clydebank Riverside', address: 'Clydebank Shopping Centre, Glasgow G81 1BF',          lat: 55.8993, lng: -4.4097 },
  { name: 'Botanic Gardens',     address: 'Glasgow Botanic Gardens, 730 Great Western Rd, G12 0UE', lat: 55.8786, lng: -4.2900 },
  { name: "Queen's Park",       address: "Queen's Park, 520 Langside Rd, Glasgow G42 9QL",     lat: 55.8355, lng: -4.2679 },
  { name: 'Riverside Museum',    address: 'Riverside Museum, 100 Pointhouse Rd, Glasgow G3 8RS', lat: 55.8654, lng: -4.3060 },
  { name: 'Alexandra Park',      address: 'Alexandra Park, Alexandra Parade, Glasgow G31 3BQ',   lat: 55.8688, lng: -4.2115 },
  { name: 'Bellahouston Park',   address: 'Bellahouston Park, Glasgow G52 1EQ',                  lat: 55.8418, lng: -4.3266 },
  { name: 'Strathclyde Park',    address: 'Strathclyde Country Park, Motherwell ML1 3ED',        lat: 55.7972, lng: -4.0287 },
  { name: 'Ruchill Park',        address: 'Ruchill Park, Bilsland Dr, Glasgow G20 9NB',          lat: 55.8858, lng: -4.2686 },
  { name: 'Victoria Park',       address: 'Victoria Park, Glasgow G14 9NW',                      lat: 55.8768, lng: -4.3324 },
];
const EDINBURGH_LOCATIONS: SeedLocation[] = [
  { name: 'The Meadows',        address: 'The Meadows, Melville Dr, Edinburgh EH9 9EX',          lat: 55.9407, lng: -3.1930 },
  { name: 'Holyrood Park',      address: "Holyrood Park, Queen's Dr, Edinburgh EH8 8HG",        lat: 55.9451, lng: -3.1618 },
  { name: 'Portobello Beach',   address: 'Portobello Promenade, Edinburgh EH15 1HG',             lat: 55.9531, lng: -3.1147 },
  { name: 'Water of Leith',     address: 'Water of Leith Walkway, Stockbridge, Edinburgh EH4 1',  lat: 55.9579, lng: -3.2190 },
];

type Pace = 'easy' | 'social' | 'moderate' | 'tempo' | 'fast';
type RunType = 'club_run' | 'parkrun_style' | 'one_off_race' | 'training_group' | 'trail_run';

interface SeedClub {
  name: string; description: string; city: 'Glasgow' | 'Edinburgh';
  pace: Pace; tags: string[]; color: string;
}
const CLUBS: SeedClub[] = [
  { name: 'West End Wanderers',   city: 'Glasgow',   pace: 'social',   color: '#1D9E75', tags: ['social', 'beginner-friendly', 'west-end'], description: "Glasgow's friendliest running crew. Kelvingrove every Saturday — all paces welcome, coffee at the café after." },
  { name: 'Southside Striders',   city: 'Glasgow',   pace: 'easy',     color: '#3B82F6', tags: ['scenic', 'social', 'southside'], description: 'Weekly runs across the Southside. Pollok Park, Cathkin Braes, and everything in between. Pub stop mandatory.' },
  { name: 'Clyde Pacers',         city: 'Glasgow',   pace: 'tempo',    color: '#EF4444', tags: ['tempo', 'riverside', 'structured'], description: 'Structured tempo and threshold sessions along the Clyde walkway. Bring a watch, leave your excuses.' },
  { name: 'Dear Green Joggers',   city: 'Glasgow',   pace: 'easy',     color: '#10B981', tags: ['beginner-friendly', 'couch-to-5k', 'inclusive'], description: 'Zero-judgement beginners group. Walk-run intervals, big cheers, and nobody gets left behind. Ever.' },
  { name: 'Munro Baggers RC',     city: 'Glasgow',   pace: 'moderate', color: '#F59E0B', tags: ['trail', 'hills', 'adventure'], description: 'Trail and hill specialists. Weekend missions to the Campsies and beyond, midweek stair reps to earn them.' },
  { name: 'Night Owls Running',   city: 'Glasgow',   pace: 'moderate', color: '#6366F1', tags: ['evening', 'city', 'headtorch'], description: 'For people whose day ends at 9pm. City night runs, reflective gear required, chips optional but traditional.' },
  { name: 'Partick Thistle Trotters', city: 'Glasgow', pace: 'social', color: '#EC4899', tags: ['social', 'football', 'banter'], description: 'Match-day shakeouts and midweek trots around Firhill and the West End. Jags scarf optional.' },
  { name: 'Sub-40 Syndicate',     city: 'Glasgow',   pace: 'fast',     color: '#DC2626', tags: ['fast', 'racing', 'track'], description: "Chasing fast 10Ks. Track Tuesdays, race-pace Thursdays. If you have to ask the pace, this probably isn't the one." },
  { name: 'Trail Sisters Scotland', city: 'Glasgow', pace: 'moderate', color: '#8B5CF6', tags: ['women', 'trail', 'community'], description: "Women's trail collective. Skills, confidence, and mud in equal measure. All abilities, brilliant vibes." },
  { name: 'Kelvin Canicross Crew', city: 'Glasgow',  pace: 'easy',     color: '#0EA5E9', tags: ['dog-friendly', 'parkland', 'social'], description: 'Run with your dog! Harness-and-bungee runs along the Kelvin. Non-dog humans welcome to borrow one.' },
  { name: 'Meadows Milers',       city: 'Edinburgh', pace: 'social',   color: '#14B8A6', tags: ['social', 'student-friendly', 'meadows'], description: "Edinburgh's most relaxed mile-repeaters. Meadows loops, Arthur's Seat when we're feeling brave." },
  { name: 'Porty Beach Runners',  city: 'Edinburgh', pace: 'easy',     color: '#F97316', tags: ['beach', 'scenic', 'sunrise'], description: 'Sunrise runs on Portobello prom. Sea swims after for the brave, bacon rolls for the sensible.' },
  { name: 'Auld Reekie Racers',   city: 'Edinburgh', pace: 'fast',     color: '#B91C1C', tags: ['racing', 'hills', 'competitive'], description: "Hill reps on Arthur's Seat and race-sharp sessions. We collect PBs and questionable weather stories." },
  { name: 'Leith Links Lunchers', city: 'Edinburgh', pace: 'moderate', color: '#4F46E5', tags: ['lunchtime', 'office-escape', 'city'], description: 'Lunchtime escapes down the Water of Leith. 45 minutes, back at your desk before anyone notices.' },
];

const RUN_TITLES: Record<RunType, string[]> = {
  club_run: ['Saturday Social', 'Sunday Long Run', 'Midweek Miles', 'Recovery Loop', 'Coffee Run', 'Bridges Loop', 'Riverside Cruise', 'The Classic Route'],
  parkrun_style: ['Timed 5K', 'Parkrun Warm-Up', 'Pop-Up 5K', 'Freedom 5K'],
  one_off_race: ['Summer 10K Showdown', 'Twilight Mile', 'Charity Chase 5K', 'Hill Climb Championship'],
  training_group: ['Hill Reps Session', 'Track Intervals', 'Tempo Thursday', 'Pyramid Session', 'Fartlek Friday'],
  trail_run: ['Trail Adventure', 'Mud & Miles', 'Singletrack Session', 'Forest Loop', 'Headtorch Trail Night'],
};
const RUN_NOTES = [
  'All paces welcome — we regroup at every corner. Look for the flag.',
  'Route recce done this week: one muddy section, trail shoes recommended.',
  'Coffee and cake after at the usual spot. First-timers get theirs free.',
  'Bring water — no fountains on this route. Toilets at the start only.',
  "We'll split into two pace groups at the halfway point.",
  'Buggy-friendly route, fully on paths. Dogs on leads welcome.',
  'Hi-vis or lights required — marshals at the big junctions.',
  "Bag drop available at the start. Don't bring valuables.",
  'New members: arrive 10 minutes early for a quick route briefing.',
  "Weather call by 7am on the day in the club chat if it's wild.",
  'Post-run stretching session led by our resident physio, totally optional.',
  'PB course! Flat, fast, and only two corners. Bring your watch.',
];
const TAGS_BY_TYPE: Record<RunType, string[][]> = {
  club_run: [['social', 'city'], ['scenic', 'riverside'], ['easy', 'coffee'], ['5k', 'social'], ['10k', 'steady']],
  parkrun_style: [['timed', 'flat', 'all-abilities'], ['5k', 'flat'], ['timed', 'parkland']],
  one_off_race: [['race', 'timed'], ['race', '10k'], ['race', 'charity']],
  training_group: [['hills', 'challenging'], ['track', 'intervals'], ['tempo', 'structured'], ['elevation', 'hard']],
  trail_run: [['trail', 'muddy'], ['trail', 'scenic', 'hills'], ['trail', 'headtorch'], ['trail', 'forest']],
};
const CHAT_MESSAGES = [
  'Anyone fancy sharing a lift from the West End?',
  "What's the weather looking like for this one?",
  "First time with the club — what's the pace really like? 😅",
  'Route looks class, been meaning to try this one for ages',
  "I'll bring the jelly babies again since they went down well",
  'Is there parking near the start?',
  "Running this as a shakeout before Sunday's race, taking it easy",
  'Can confirm the café at the end does incredible rolls',
  "Might be 5 mins late, don't leave without me!",
  'Trail shoes or road shoes for this route?',
  'Bringing two newbies from work, be nice 😄',
  'That hill at the end is a crime and whoever planned it knows it',
  'Count me in, missed the last one and regretted it',
  'Anyone doing the longer loop after?',
  "Last week's photos are in the club chat — some crackers in there",
  'Is the 6:30 start confirmed? Says 7 in my calendar',
];
const PACES: Pace[] = ['easy', 'social', 'moderate', 'tempo', 'fast'];
const RUN_TYPES: RunType[] = ['club_run', 'club_run', 'club_run', 'parkrun_style', 'training_group', 'trail_run', 'one_off_race'];

// jitter a location slightly so markers don't stack exactly
const jitter = (v: number): number => v + (rand() - 0.5) * 0.004;

interface SeedUser { id: string; name: string; email: string; role: 'runner' | 'organizer' }

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting seed...\n');
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    await client.query('BEGIN');

    await client.query(`
      TRUNCATE
        run_comments, strava_webhooks,
        run_attendees, run_events,
        club_members, clubs,
        refresh_tokens, password_reset_tokens,
        users
      RESTART IDENTITY CASCADE
    `);
    console.log('  ✓ Existing data cleared');

    // ── Users ────────────────────────────────────────────────────────────────
    // Stable, documented test accounts first, then a generated crowd.
    const users: SeedUser[] = [
      { id: randomUUID(), name: 'Sarah Chen',   email: 'sarah@example.com', role: 'organizer' },
      { id: randomUUID(), name: 'James Okafor', email: 'james@example.com', role: 'organizer' },
      { id: randomUUID(), name: 'Emma Walsh',   email: 'emma@example.com',  role: 'runner' },
      { id: randomUUID(), name: 'Tom Briggs',   email: 'tom@example.com',   role: 'runner' },
      { id: randomUUID(), name: 'Priya Sharma', email: 'priya@example.com', role: 'runner' },
    ];
    const usedNames = new Set<string>();
    while (users.length < 42) {
      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      if (usedNames.has(name)) continue;
      usedNames.add(name);
      const emailLocal = name.toLowerCase().replace(/[^a-z ]/g, '').replace(/ /g, '.');
      users.push({
        id: randomUUID(),
        name,
        email: `${emailLocal}@example.com`,
        role: chance(0.25) ? 'organizer' : 'runner',
      });
    }
    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, display_name, email, password_hash, role, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW() - ($6 || ' days')::interval)`,
        [u.id, u.name, u.email, passwordHash, u.role, int(2, 180)]
      );
    }
    const organizers = users.filter(u => u.role === 'organizer');
    console.log(`  ✓ Users inserted (${users.length}, ${organizers.length} organisers)`);

    // ── Clubs ────────────────────────────────────────────────────────────────
    const clubIds: { id: string; club: SeedClub; ownerId: string }[] = [];
    const ownerPool = sample(organizers, Math.min(organizers.length, CLUBS.length));
    for (let i = 0; i < CLUBS.length; i++) {
      const club = CLUBS[i];
      const owner = ownerPool[i % ownerPool.length];
      const id = randomUUID();
      clubIds.push({ id, club, ownerId: owner.id });
      await client.query(
        `INSERT INTO clubs (id, name, description, owner_id, city, pace, tags, color, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - ($9 || ' days')::interval)`,
        [id, club.name, club.description, owner.id,
         club.city, club.pace, club.tags, club.color, int(30, 400)]
      );
    }
    console.log(`  ✓ Clubs inserted (${clubIds.length})`);

    // ── Club members ─────────────────────────────────────────────────────────
    let membershipCount = 0;
    const membersByClub = new Map<string, string[]>();
    for (const { id, ownerId } of clubIds) {
      const members = new Set<string>([ownerId]);
      for (const u of sample(users, int(6, 18))) members.add(u.id);
      membersByClub.set(id, [...members]);
      for (const userId of members) {
        await client.query(
          `INSERT INTO club_members (club_id, user_id, role, joined_at)
           VALUES ($1, $2, $3, NOW() - ($4 || ' days')::interval)
           ON CONFLICT DO NOTHING`,
          [id, userId, userId === ownerId ? 'owner' : 'member', int(1, 200)]
        );
        membershipCount++;
      }
      await client.query('UPDATE clubs SET member_count = $2 WHERE id = $1', [id, members.size]);
    }
    console.log(`  ✓ Club memberships inserted (${membershipCount})`);

    // ── Runs (future + past) ─────────────────────────────────────────────────
    const runIds: { id: string; clubId: string | null; future: boolean }[] = [];
    let futureRuns = 0;
    let pastRuns = 0;

    const insertRun = async (
      clubId: string | null, clubName: string, city: 'Glasgow' | 'Edinburgh',
      clubPace: Pace, createdBy: string, future: boolean
    ): Promise<string> => {
      const locations = city === 'Edinburgh' ? EDINBURGH_LOCATIONS : GLASGOW_LOCATIONS;
      const start = pick(locations);
      const isLoop = chance(0.4);
      const end = isLoop ? start : pick(locations.filter(l => l !== start));
      const runType = pick(RUN_TYPES);
      const pace = chance(0.6) ? clubPace : pick(PACES);
      const distance = runType === 'parkrun_style' ? 5
        : runType === 'trail_run' ? int(6, 18)
        : runType === 'one_off_race' ? pick([5, 10, 21.1])
        : int(4, 16);
      const minsPerKm = { easy: 7, social: 7.5, moderate: 6, tempo: 5, fast: 4.5 }[pace];
      const id = randomUUID();
      const daysOffset = future ? int(1, 21) : -int(2, 45);
      const hour = pick([6, 7, 8, 9, 10, 12, 18, 19]);
      const title = `${start.name} ${pick(RUN_TITLES[runType])}`;

      await client.query(
        `INSERT INTO run_events (
           id, club_id, club_name, title,
           start_lat, start_lng, end_lat, end_lng, start_address, end_address,
           event_date, distance_km, estimated_minutes, max_attendees,
           notes, status, pace, tags, run_type, created_by, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                   date_trunc('day', NOW()) + make_interval(days => $11::int, hours => $12::int),
                   $13,$14,$15,$16,$17,$18,$19,$20,$21,
                   NOW() - make_interval(days => $22::int))`,
        [id, clubId, clubName, title,
         jitter(start.lat), jitter(start.lng), jitter(end.lat), jitter(end.lng),
         start.address, end.address,
         daysOffset, hour,
         distance, Math.round(distance * minsPerKm),
         chance(0.7) ? int(10, 60) : null,
         pick(RUN_NOTES),
         future ? 'active' : 'completed',
         pace, pick(TAGS_BY_TYPE[runType]), runType, createdBy,
         future ? int(1, 14) : Math.abs(daysOffset) + int(1, 10)]
      );
      runIds.push({ id, clubId, future });
      if (future) futureRuns++; else pastRuns++;
      return id;
    };

    for (const { id: clubId, club, ownerId } of clubIds) {
      const nFuture = int(3, 6);
      const nPast = int(1, 3);
      for (let i = 0; i < nFuture; i++) await insertRun(clubId, club.name, club.city, club.pace, ownerId, true);
      for (let i = 0; i < nPast; i++) await insertRun(clubId, club.name, club.city, club.pace, ownerId, false);
    }
    // A few independent (clubless) runs
    for (let i = 0; i < 5; i++) {
      await insertRun(null, 'Independent Run', chance(0.75) ? 'Glasgow' : 'Edinburgh', pick(PACES), pick(organizers).id, true);
    }
    console.log(`  ✓ Run events inserted (${futureRuns} upcoming, ${pastRuns} completed)`);

    // ── Attendees (+ some Strava-verified past efforts) ──────────────────────
    let attendeeCount = 0;
    let stravaLinked = 0;
    for (const run of runIds) {
      const clubMembers = run.clubId ? membersByClub.get(run.clubId) ?? [] : [];
      const outsiders = sample(users, int(0, 4)).map(u => u.id);
      const attendees = new Set<string>([...sample(clubMembers, int(2, Math.max(2, clubMembers.length - 2))), ...outsiders]);
      for (const userId of attendees) {
        const verified = !run.future && chance(0.3);
        await client.query(
          `INSERT INTO run_attendees (run_id, user_id, joined_at,
             strava_activity_id, strava_distance, strava_moving_time, strava_average_speed)
           VALUES ($1, $2, NOW() - ($3 || ' days')::interval, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
          [run.id, userId, int(1, 20),
           verified ? int(10_000_000_000, 11_000_000_000) : null,
           verified ? int(4000, 21000) : null,
           verified ? int(1500, 7200) : null,
           verified ? 2 + rand() * 2.5 : null]
        );
        attendeeCount++;
        if (verified) stravaLinked++;
      }
    }
    console.log(`  ✓ Run attendees inserted (${attendeeCount}, ${stravaLinked} Strava-verified)`);

    // ── Run chat ─────────────────────────────────────────────────────────────
    let commentCount = 0;
    for (const run of runIds) {
      if (!chance(0.65)) continue;
      const { rows } = await client.query<{ user_id: string }>(
        'SELECT user_id FROM run_attendees WHERE run_id = $1', [run.id]
      );
      if (rows.length === 0) continue;
      const n = int(2, Math.min(8, rows.length * 2));
      for (let i = 0; i < n; i++) {
        await client.query(
          `INSERT INTO run_comments (run_id, user_id, content, created_at)
           VALUES ($1, $2, $3, NOW() - ($4 || ' hours')::interval)`,
          [run.id, pick(rows).user_id, pick(CHAT_MESSAGES), int(1, 96)]
        );
        commentCount++;
      }
    }
    console.log(`  ✓ Run comments inserted (${commentCount})`);

    await client.query('COMMIT');

    console.log('\n✅ Seed complete!\n');
    console.log('Stable test accounts (password: Klub1234!):');
    console.log('  sarah@example.com  — organiser');
    console.log('  james@example.com  — organiser');
    console.log('  emma@example.com   — runner');
    console.log('  tom@example.com    — runner');
    console.log('  priya@example.com  — runner');
    console.log('\nAll generated users share the same password (firstname.lastname@example.com).');
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
