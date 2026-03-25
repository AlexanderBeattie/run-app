<!-- Generated: 2026-03-23 | Files scanned: 6 | Token estimate: ~380 -->

# Database Schema Codemap

**Last Updated:** 2026-03-23
**Sources:** `backend/src/db/schema.sql` (canonical — all migrations consolidated) | `backend/src/db/migration-001.sql` through `migration-004.sql`

## Tables & Relationships

```
┌──────────────────┐
│     users        │
├──────────────────┤
│ id (UUID) PK     │
│ display_name     │
│ email (unique)   │
│ password_hash    │
│ role             │◄─┐ 'runner' | 'organizer'
│ strava_connected │  │
│ created_at       │  │
└──────────────────┘  │
      ▲               │
      │ owner_id      │
      │               │
   ┌──┴──────────────────┐
   │      clubs          │
   ├─────────────────────┤
   │ id (UUID) PK        │
   │ name                │
   │ description         │
   │ owner_id (FK→users) │
   │ city                │  ┌──────────────────────┐
   │ pace                │  │   club_members       │
   │ tags (array)        │  ├──────────────────────┤
   │ logo_url            │  │ club_id (FK) ◄──────┤
   │ member_count (cache)│◄─┤ user_id (FK) ┐      │
   │ created_at          │  │ role         │      │
   └─────────────────────┘  │ joined_at    │      │
      ▲                     └──────────────┼──────┘
      │ club_id (nullable)                │
      │                          ┌────────┘
   ┌──┴──────────────────┐      │
   │   run_events        │      │
   ├─────────────────────┤      │
   │ id (UUID) PK        │      │
   │ club_id (FK, NULL)  │      │
   │ club_name           │      │
   │ title               │      │
   │ start_lat, start_lng│      │
   │ end_lat, end_lng    │      │
   │ start_address       │      │
   │ end_address         │      │
   │ event_date          │      │
   │ distance_km         │      │
   │ estimated_minutes   │      │
   │ max_attendees       │      │
   │ notes               │      │
   │ status              │      │
   │ pace, tags (array)  │      │
   │ created_by (FK)─────┼──────┘
   │ created_at          │
   └──────────────────────┘
       ▲ ├─ run_id (FK)
       │ │
       │ ┌────────────────────────┐
       │ │   run_attendees        │
       │ ├────────────────────────┤
       │ │ run_id (FK) ◄──────────┤
       │ │ user_id (FK) ──────────┼──► users(id)
       │ │ joined_at              │
       │ │ PK: (run_id, user_id)  │
       │ └────────────────────────┘
       │
       └──────────────────────────────► created_by (FK→users)
```

## Table Definitions

### users (schema.sql:3–12)

| Column           | Type          | Constraints                     | Notes                |
|------------------|---------------|---------------------------------|----------------------|
| id               | UUID          | PK, DEFAULT uuid_generate_v4()  |                      |
| display_name     | VARCHAR(100)  | NOT NULL                        | User's visible name  |
| email            | VARCHAR(255)  | UNIQUE NOT NULL                 |                      |
| password_hash    | VARCHAR(255)  | NOT NULL                        | bcryptjs hashed      |
| role             | VARCHAR(20)   | NOT NULL, DEFAULT 'runner'      | CHECK: runner\|organizer |
| strava_connected | BOOLEAN       | DEFAULT false                   | Future feature       |
| created_at       | TIMESTAMP     | DEFAULT NOW()                   |                      |

**Indexes:** Primary key on id, unique on email (implicit)

### clubs (schema.sql:14–21, migration-001.sql:13–17)

| Column       | Type          | Constraints           | Notes                |
|--------------|---------------|-----------------------|----------------------|
| id           | UUID          | PK                    |                      |
| name         | VARCHAR(100)  | NOT NULL              |                      |
| description  | TEXT          |                       |                      |
| owner_id     | UUID          | FK→users, CASCADE     | Club creator         |
| city         | VARCHAR(100)  | (migration-001)       | Filtering support    |
| pace         | VARCHAR(20)   | (migration-001)       | e.g., "4:30/km"      |
| tags         | TEXT[]        | DEFAULT '{}' (migration-001) | Array of strings |
| logo_url     | TEXT          | (migration-001)       | Future: club image   |
| member_count | INTEGER       | DEFAULT 0 (schema)    | Cached value         |
| created_at   | TIMESTAMP     | DEFAULT NOW()         |                      |

**Computed fields in API:**
- member_count: SELECT COUNT(*) FROM club_members (query-time)
- next_run_date: SELECT MIN(event_date) FROM run_events (query-time)

### club_members (migration-001.sql:4–11)

| Column   | Type       | Constraints          | Notes              |
|----------|----------|----------------------|--------------------|
| club_id  | UUID     | FK→clubs, CASCADE    | Junction table PK  |
| user_id  | UUID     | FK→users, CASCADE    | Junction table PK  |
| role     | VARCHAR  | DEFAULT 'member'     | 'member'\|'organizer'\|'owner' |
| joined_at| TIMESTAMP| DEFAULT NOW()        |                    |

**Unique constraint:** (club_id, user_id) composite PK
**Usage:** Track club membership, enforce creation permissions via role

### run_events (schema.sql:23–42, migration-001.sql:19–21)

| Column           | Type          | Constraints          | Notes                    |
|------------------|---------------|----------------------|--------------------------|
| id               | UUID          | PK                   |                          |
| club_id          | UUID          | FK→clubs, SET NULL   | Nullable: run can be independent |
| club_name        | VARCHAR(100)  | NOT NULL             | Denormalized for queries |
| title            | VARCHAR(200)  | NOT NULL             |                          |
| start_lat        | DECIMAL(10,8) | NOT NULL             | Precision: 6 decimals    |
| start_lng        | DECIMAL(11,8) | NOT NULL             |                          |
| end_lat          | DECIMAL(10,8) | NOT NULL             |                          |
| end_lng          | DECIMAL(11,8) | NOT NULL             |                          |
| start_address    | TEXT          | NOT NULL             | Reverse geocoded         |
| end_address      | TEXT          | NOT NULL             |                          |
| event_date       | TIMESTAMP     | NOT NULL             | UTC timestamp            |
| distance_km      | DECIMAL(6,2)  | NOT NULL             |                          |
| estimated_minutes| INTEGER       | NOT NULL             | Duration estimate        |
| max_attendees    | INTEGER       | Nullable             | NULL = unlimited         |
| notes            | TEXT          | Nullable             |                          |
| status           | VARCHAR(20)   | DEFAULT 'active'     | 'active'\|'cancelled'    |
| pace             | VARCHAR(20)   | (migration-001)      | e.g., "4:30/km"          |
| tags             | TEXT[]        | DEFAULT '{}' (migration-001) | Array of strings |
| run_type         | VARCHAR(30)   | CHECK constraint (migration-004) | club_run\|parkrun_style\|one_off_race\|training_group\|trail_run |
| created_by       | UUID          | FK→users             | Organizer who created    |
| created_at       | TIMESTAMP     | DEFAULT NOW()        |                          |

**Denormalization:** club_name stored to avoid join in list queries
**Indexes needed:** created_by, club_id, event_date, status (not declared in schema)

### run_attendees (schema.sql:44–48)

| Column  | Type      | Constraints       | Notes            |
|---------|-----------|-------------------|------------------|
| run_id  | UUID      | FK→run_events, CASCADE | Junction PK  |
| user_id | UUID      | FK→users, CASCADE | Junction PK      |
| joined_at| TIMESTAMP| DEFAULT NOW()     |                  |

**Unique constraint:** (run_id, user_id) composite PK
**Usage:** Track who has joined a run (toggleable many-to-many)

## Query Patterns

### List Runs with Attendees (runs.routes.ts:56–61)
```sql
SELECT r.*,
  COALESCE(json_agg(ra.user_id) FILTER (WHERE ra.user_id IS NOT NULL), '[]') AS attendees
FROM run_events r
LEFT JOIN run_attendees ra ON ra.run_id = r.id
WHERE r.status = 'active' [+ optional filters]
GROUP BY r.id
ORDER BY r.event_date ASC
```

**Note:** Parameterized filters (distance_min, date ranges, city ILIKE, pace)

### Club Ownership Verification (runs.routes.ts:117–130)
```sql
SELECT c.id, c.name
FROM clubs c
LEFT JOIN club_members cm ON cm.club_id = c.id AND cm.user_id = $2
WHERE c.id = $1
  AND (
    c.owner_id = $2
    OR cm.role IN ('owner', 'organizer')
  )
```

**Enforces:** Only club owner or club organizers can create runs for that club

### List Clubs with Metadata (clubs.routes.ts:10–15)
```sql
SELECT c.*,
  (SELECT COUNT(*) FROM club_members cm WHERE cm.club_id = c.id)::int AS member_count,
  (SELECT MIN(r.event_date) FROM run_events r
   WHERE r.club_id = c.id AND r.status = 'active' AND r.event_date > NOW()) AS next_run_date
FROM clubs c
ORDER BY c.created_at DESC
```

## Constraints & Integrity

| Entity | Constraint | Enforcement | Notes |
|--------|-----------|-------------|-------|
| users.role | CHECK (role IN ('runner', 'organizer')) | DB | Enforced at DB level |
| clubs | owner_id references users | FK CASCADE | Delete user → delete clubs |
| run_events | club_id references clubs | FK SET NULL | Delete club → orphan runs |
| club_members | (club_id, user_id) UNIQUE | PK | Prevent duplicate membership |
| run_attendees | (run_id, user_id) UNIQUE | PK | Prevent duplicate joins |

## Auth Tables (Phase 4)

### refresh_tokens
| Column      | Type       | Constraints        | Notes                        |
|-------------|------------|--------------------|------------------------------|
| id          | UUID       | PK                 |                              |
| user_id     | UUID       | FK→users CASCADE   |                              |
| token_hash  | TEXT       | NOT NULL           | bcrypt-hashed refresh token  |
| expires_at  | TIMESTAMP  | NOT NULL           | 30-day expiry                |
| created_at  | TIMESTAMP  | DEFAULT NOW()      |                              |

### password_reset_tokens
| Column      | Type       | Constraints        | Notes                              |
|-------------|------------|--------------------|-------------------------------------|
| id          | UUID       | PK                 |                                     |
| user_id     | UUID       | FK→users CASCADE   |                                     |
| token_hash  | TEXT       | NOT NULL           | bcrypt-hashed reset token           |
| expires_at  | TIMESTAMP  | NOT NULL           | Short-lived (1h)                    |
| used        | BOOLEAN    | DEFAULT false      | One-time use flag                   |
| created_at  | TIMESTAMP  | DEFAULT NOW()      |                                     |

## Migrations

| File | Contents |
|------|----------|
| schema.sql | Canonical — all 4 migrations consolidated. Use for fresh installs. |
| migration-001.sql | club_members table; city/pace/tags/logo_url on clubs; pace/tags on run_events |
| migration-002.sql | refresh_tokens table |
| migration-003.sql | password_reset_tokens table |
| migration-004.sql | run_type VARCHAR(30) on run_events with CHECK constraint |

> Run individual migration files (not schema.sql) against an existing production DB.

## Performance Notes

- **Denormalized club_name** in run_events avoids join in list queries
- **Computed member_count** at query-time (not cached after insert)
- **json_agg(attendees)** expensive for large runs; pagination not implemented
- **11 indexes declared** in schema.sql — event_date, club_id, created_by, status, run_type, user email, club_members, run_attendees
- **ILIKE filters** on title/club_name/start_address covered by indexes

## Related Codemaps
- [backend.md](backend.md) — SQL queries, API implementation
- [architecture.md](architecture.md) — Data flow through app
