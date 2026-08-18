<!-- Generated: 2026-03-29 | Files scanned: 9 | Token estimate: ~420 -->

# Database Schema Codemap

**Last Updated:** 2026-03-29
**Sources:** `backend/src/db/schema.sql` (canonical) | migrations 001–005

## Tables & Relationships

```
┌──────────────────────────────┐
│           users              │
├──────────────────────────────┤
│ id (UUID) PK                 │
│ display_name                 │
│ email (unique)               │
│ password_hash                │
│ role (runner|organizer)      │
│ strava_athlete_id (BIGINT)   │◄── Strava integration
│ strava_access_token          │
│ strava_refresh_token         │
│ strava_token_expires_at      │
│ strava_connected (BOOL)      │
│ created_at                   │
└──────────────────────────────┘
      ▲ owner_id
      │
┌─────┴───────────────┐    ┌──────────────────────┐
│       clubs         │    │    club_members       │
├─────────────────────┤    ├──────────────────────┤
│ id (UUID) PK        │◄───┤ club_id (FK)          │
│ name, description   │    │ user_id (FK)          │
│ owner_id (FK→users) │    │ role (member|org|own) │
│ city, pace          │    │ joined_at             │
│ tags (TEXT[])       │    └──────────────────────┘
│ logo_url            │
│ member_count (cache)│
│ created_at          │
└──────────┬──────────┘
           │ club_id (nullable)
┌──────────▼──────────────────────┐
│         run_events              │
├─────────────────────────────────┤
│ id (UUID) PK                    │
│ club_id (FK→clubs, SET NULL)    │
│ club_name (denormalized)        │
│ title                           │
│ start_lat, start_lng            │
│ end_lat, end_lng                │
│ start_address, end_address      │
│ event_date (UTC)                │
│ distance_km, estimated_minutes  │
│ max_attendees (nullable)        │
│ notes, status                   │
│ pace, tags (TEXT[])             │
│ run_type (CHECK constraint)     │
│ created_by (FK→users)          │
│ created_at                      │
└───────────────┬─────────────────┘
                │ run_id
┌───────────────▼─────────────────────────┐
│            run_attendees                │
├─────────────────────────────────────────┤
│ run_id (FK) PK                          │
│ user_id (FK→users) PK                   │
│ joined_at                               │
│ strava_activity_id (BIGINT)             │◄── Strava link
│ strava_distance (FLOAT)                 │
│ strava_moving_time (INTEGER)            │
│ strava_average_speed (FLOAT)            │
│ strava_polyline (TEXT)                  │
└─────────────────────────────────────────┘
```

## Table Definitions

### users (schema.sql)

| Column                  | Type          | Constraints              | Notes                    |
|-------------------------|---------------|--------------------------|--------------------------|
| id                      | UUID          | PK, DEFAULT uuid_generate | |
| display_name            | VARCHAR(100)  | NOT NULL                 |                          |
| email                   | VARCHAR(255)  | UNIQUE NOT NULL          |                          |
| password_hash           | VARCHAR(255)  | NOT NULL                 | bcryptjs, 12 rounds      |
| role                    | VARCHAR(20)   | DEFAULT 'runner'         | CHECK: runner\|organizer |
| strava_athlete_id       | BIGINT        | UNIQUE, nullable         | Set on OAuth connect     |
| strava_access_token     | TEXT          | nullable                 | Short-lived token        |
| strava_refresh_token    | TEXT          | nullable                 | Long-lived refresh       |
| strava_token_expires_at | TIMESTAMP     | nullable                 | Refresh when expired     |
| strava_connected        | BOOLEAN       | DEFAULT false            |                          |
| created_at              | TIMESTAMP     | DEFAULT NOW()            |                          |

### clubs (schema.sql + migration-001)

| Column       | Type         | Notes                                 |
|--------------|--------------|---------------------------------------|
| id           | UUID PK      |                                       |
| name         | VARCHAR(100) | NOT NULL                              |
| description  | TEXT         |                                       |
| owner_id     | UUID FK      | → users CASCADE                       |
| city         | VARCHAR(100) | migration-001                         |
| pace         | VARCHAR(20)  | migration-001                         |
| tags         | TEXT[]       | DEFAULT '{}' migration-001            |
| logo_url     | TEXT         | migration-001                         |
| member_count | INTEGER      | DEFAULT 0 (cached, recomputed at query)|
| created_at   | TIMESTAMP    | DEFAULT NOW()                         |

### club_members (migration-001)
- PK: (club_id, user_id)
- role: 'member' | 'organizer' | 'owner' (DEFAULT 'member')
- joined_at: TIMESTAMP DEFAULT NOW()

### run_events (schema.sql + migration-001 + migration-004)

| Column            | Type          | Notes                                         |
|-------------------|---------------|-----------------------------------------------|
| club_id           | UUID FK       | → clubs SET NULL (run survives club deletion) |
| club_name         | VARCHAR(100)  | Denormalized — avoids join in list queries    |
| run_type          | VARCHAR(30)   | CHECK: club_run\|parkrun_style\|one_off_race\|training_group\|trail_run |
| start/end coords  | DECIMAL(10,8) | 8 decimal precision                           |
| status            | VARCHAR(20)   | DEFAULT 'active' (active\|cancelled)          |
| pace, tags        | TEXT[]        | migration-001                                 |
| created_by        | UUID FK       | → users (no CASCADE — preserve history)       |

### run_attendees (schema.sql + migration-005)
- PK: (run_id, user_id)
- joined_at: TIMESTAMP DEFAULT NOW()
- strava_activity_id: BIGINT (nullable — set when user links Strava activity)
- strava_distance: FLOAT (metres from Strava)
- strava_moving_time: INTEGER (seconds from Strava)
- strava_average_speed: FLOAT (m/s from Strava)
- strava_polyline: TEXT (encoded polyline from Strava)

### Auth Tables (migration-002, migration-003)

**refresh_tokens**
- user_id (FK→users CASCADE), token_hash (TEXT), expires_at (TIMESTAMP 30d)
- Indexes: user_id, token_hash

**password_reset_tokens**
- user_id (FK→users CASCADE), token_hash (TEXT), expires_at (TIMESTAMP 1h), used (BOOLEAN DEFAULT false)
- Indexes: token_hash, user_id

### strava_webhooks (migration-005 — future feature)
- user_id (FK→users), event_type (VARCHAR), payload (JSONB)
- Not yet used in application logic

## Key Query Patterns

### List Runs with Attendees
```sql
SELECT r.*,
  COALESCE(json_agg(ra.user_id) FILTER (WHERE ra.user_id IS NOT NULL), '[]') AS attendees
FROM run_events r
LEFT JOIN run_attendees ra ON ra.run_id = r.id
WHERE r.status = 'active' [+ dynamic filters]
GROUP BY r.id
ORDER BY r.event_date ASC
```

### Club Ownership Verification
```sql
SELECT c.id FROM clubs c
LEFT JOIN club_members cm ON cm.club_id = c.id AND cm.user_id = $2
WHERE c.id = $1 AND (c.owner_id = $2 OR cm.role IN ('owner', 'organizer'))
```

### List Clubs with Metadata
```sql
SELECT c.*,
  (SELECT COUNT(*) FROM club_members cm WHERE cm.club_id = c.id)::int AS member_count,
  (SELECT MIN(r.event_date) FROM run_events r
   WHERE r.club_id = c.id AND r.status = 'active' AND r.event_date > NOW()) AS next_run_date
FROM clubs c ORDER BY c.created_at DESC
```

## Migrations

| File              | Contents                                                          |
|-------------------|-------------------------------------------------------------------|
| schema.sql        | Canonical consolidated schema — use for **fresh installs only**  |
| migration-001.sql | club_members table; city/pace/tags/logo_url on clubs; pace/tags on run_events |
| migration-002.sql | Strava token columns on users table                              |
| migration-003.sql | run_type CHECK constraint on run_events                          |
| migration-004.sql | password_reset_tokens + refresh_tokens tables                    |
| migration-005.sql | Strava columns on run_attendees; strava_webhooks table           |

> Run individual migration files against existing DB. Never run schema.sql against production.

## Performance Notes

- **Denormalized club_name** on run_events avoids join in list queries
- **json_agg(attendees)** expensive for large runs — no pagination yet
- **11 indexes** declared in schema.sql: event_date, club_id, created_by, status, run_type, email, club_members PK, run_attendees PK
- **ILIKE filters** on title/club_name/start_address (full-text index not yet added)
- **Strava tokens** stored in plaintext — consider encrypting at rest

## Related Codemaps
- [backend.md](backend.md) — SQL queries, API implementation
- [architecture.md](architecture.md) — Data flow through app
