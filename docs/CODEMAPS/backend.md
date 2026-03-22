<!-- Generated: 2026-03-22 | Files scanned: 8 | Token estimate: ~450 -->

# Backend API Codemap

**Last Updated:** 2026-03-22
**Entry Point:** `/Users/alexbeattie/Downloads/klub/backend/src/index.ts`

## Route Tree

```
/api
├── /auth (auth.routes.ts)
│   ├── POST /register          — Create user, return JWT
│   └── POST /login             — Validate credentials, return JWT
├── /runs (runs.routes.ts)
│   ├── GET /                   — List runs (filters: search, distance_min, date, city, club_id, pace)
│   ├── GET /mine               — Organizer's created runs (requireAuth)
│   ├── GET /joined             — User's joined runs (requireAuth)
│   ├── GET /:id                — Single run detail
│   ├── GET /:id/attendees      — Attendee list
│   ├── GET /:id/weather        — Weather proxy (Open-Meteo, free, no key)
│   ├── POST /                  — Create run (requireAuth, organizer, validates club ownership)
│   ├── PATCH /:id              — Update run (requireAuth, creator only)
│   ├── DELETE /:id             — Delete run (requireAuth, creator only)
│   └── POST /:id/join          — Toggle join/unjoin (requireAuth)
├── /clubs (clubs.routes.ts)
│   ├── GET /                   — List all clubs with member_count + next_run_date
│   ├── GET /mine               — Clubs user is member of (requireAuth)
│   ├── GET /owned              — Clubs user owns (requireAuth, for create-run dropdown)
│   ├── GET /:id                — Club profile
│   ├── GET /:id/runs           — Club's active runs
│   ├── GET /:id/members        — Member list
│   ├── POST /                  — Create club (requireAuth, auto-joins owner as 'owner')
│   ├── PATCH /:id              — Update club (requireAuth, owner only)
│   └── POST /:id/join          — Toggle join/leave (requireAuth, owner can't leave)
└── /geocode (geocode.routes.ts)
    └── GET /?address=          — Proxy to Google Geocoding API (server-side)
```

## Implementation Details

### Authentication Routes (auth.routes.ts)

**POST /api/auth/register**
- Input: {displayName, email, password, role: 'runner'|'organizer'}
- Validates: All fields required, email unique
- Process: bcrypt.hash(password, 12) → INSERT users → jwt.sign(7d)
- Output: {token, user{id,displayName,email,role}}
- Status: 201 Created | 409 Conflict | 400 Bad Request | 500 Server Error

**POST /api/auth/login**
- Input: {email, password}
- Process: SELECT users WHERE email → bcrypt.compare → jwt.sign(7d)
- Output: {token, user{id,displayName,email,role}}
- Status: 200 OK | 401 Unauthorized | 500 Server Error

### Runs Routes (runs.routes.ts)

**GET /api/runs** (public)
- Filters: search (ILIKE title/club_name/start_address), distance_min, date (today|tomorrow|week), city, club_id, pace, trending, tags, club_ids
- `?trending=1`: ORDER BY attendee_count DESC, scoped to event_date within next 72h (aggregation, not correlated subquery)
- Query builder: Dynamic WHERE conditions with parameterized queries
- JOIN: LEFT JOIN clubs c ON run_events.club_id = c.id — returns club_name, club_city, club_created_at in each row
- Aggregation: json_agg(attendees with display_name) grouped by run_id
- Returns: RunEvent[] with attendees[], club_name?, club_city?, club_created_at?

**GET /api/runs/mine** (requireAuth)
- Returns: Runs where created_by = req.user.id

**POST /api/runs/** (requireAuth, organizer)
- Input: {clubId?, title, startLocation, endLocation, startAddress, endAddress, date, distanceKm, estimatedMinutes, maxAttendees?, notes?, pace?, tags?}
- Validates club ownership: If clubId provided, verify user is club owner or organizer member
- INSERT run_events returns full row
- Status: 201 Created | 403 Forbidden | 500 Error

**PATCH /api/runs/:id** (requireAuth, creator)
- Verify created_by = req.user.id
- Partial updates: COALESCE($param, column) for each field
- Returns: Updated run_events row

**POST /api/runs/:id/join** (requireAuth)
- Toggle: INSERT run_attendees if not exists, DELETE if exists
- Returns: {joined: boolean}

**GET /api/runs/:id/weather** (public)
- Fetches run row: SELECT start_lat, start_lng, event_date FROM run_events WHERE id=$1
- Proxies Open-Meteo free API (no API key required): hourly temperature_2m + weathercode
- Params: latitude, longitude, hourly=temperature_2m,weathercode, start/end date from event_date
- Extracts hour index from event_date to return single-hour values
- Returns: {temperature_2m: number, weathercode: number} or {error}
- Added: Phase 3f backend

### Clubs Routes (clubs.routes.ts)

**GET /api/clubs** (public)
- Subqueries: member_count (COUNT), next_run_date (MIN event_date)
- Orders: created_at DESC
- Returns: Club[] with computed fields

**GET /api/clubs/owned** (requireAuth)
- WHERE owner_id = req.user.id
- Used by CreateRunComponent dropdown

**POST /api/clubs/** (requireAuth)
- Input: {name, description?, city?, pace?, tags?}
- Process: INSERT clubs → auto-INSERT club_members (role='owner')
- Status: 201 Created | 400 Bad Request (name required)

**PATCH /api/clubs/:id** (requireAuth, owner)
- Verify owner_id = req.user.id
- Partial updates

**POST /api/clubs/:id/join** (requireAuth)
- Toggle: INSERT club_members if not exists, DELETE if exists
- Prevents owner from leaving (role='owner')
- Returns: {joined: boolean}

### Geocoding Routes (geocode.routes.ts)

**GET /api/geocode?address=** (public)
- Proxies to Google Geocoding API server-side
- Uses GOOGLE_SERVER_API_KEY env var (not browser-exposed)
- Input: address query parameter
- Output: {lat, lng, formatted_address} or {lat: null, lng: null, status}

## Middleware Chain

```
index.ts:21–33
├── cors({origin: [localhost, CORS_ORIGIN]})
├── express.json()
└── Router mounting:
    ├── /api/auth (no auth required)
    ├── /api/runs (routes handle requireAuth per endpoint)
    ├── /api/clubs (routes handle requireAuth per endpoint)
    ├── /api/geocode (no auth required)
    └── /api/health (GET → {status, timestamp})
```

**Auth Middleware (auth.middleware.ts)**
- Applied selectively via `requireAuth` in routes
- Extracts Bearer token from Authorization header
- Verifies JWT against process.env.JWT_SECRET
- Sets req.user on success, returns 401 on failure

## Database Connection

**index.ts:42–54**
```
import { pool } from './db'
pool.query('SELECT 1')  ← Health check on startup
app.listen(PORT)
```

**db/index.ts** (not shown, inferred)
- Creates pg.Pool instance
- Reads DATABASE_URL env var
- Enables SSL for production connections

## File Sizes & Organization

| File                          | Lines | Purpose                  |
|-------------------------------|-------|--------------------------|
| src/index.ts                  | 56    | App setup, route mounting|
| src/routes/auth.routes.ts     | 33    | Register, login          |
| src/routes/runs.routes.ts     | ~280  | All run CRUD + join + weather proxy |
| src/routes/clubs.routes.ts    | ~150  | All club CRUD + join     |
| src/routes/geocode.routes.ts  | 26    | Google Geocoding proxy   |
| src/middleware/auth.middleware.ts | 11 | JWT verification         |

## Error Handling

All routes follow pattern:
```
try {
  // query
  res.status(201|200|400|403|404).json({...})
} catch (err) {
  console.error(err)
  res.status(500).json({error: 'Server error'})
}
```

No custom error boundaries. Validation errors: 400. Auth errors: 401/403. Not found: 404.

## Related Codemaps
- [architecture.md](architecture.md) — Data flow, deployment
- [data.md](data.md) — Database schema & queries
- [dependencies.md](dependencies.md) — npm packages, env vars
