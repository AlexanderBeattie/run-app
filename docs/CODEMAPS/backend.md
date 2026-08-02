<!-- Generated: 2026-03-29 | Files scanned: 11 | Token estimate: ~540 -->

# Backend API Codemap

**Last Updated:** 2026-03-29
**Entry Point:** `backend/src/index.ts`

## Route Tree

```
/api
├── /auth (auth.routes.ts)
│   ├── POST /register          — Create user, return JWT + refreshToken
│   ├── POST /login             — Validate credentials, return JWT + refreshToken
│   ├── POST /refresh           — Exchange refreshToken for new JWT
│   ├── POST /logout            — Revoke refreshToken (requireAuth)
│   ├── POST /forgot-password   — Email reset link (token hashed, stored in password_reset_tokens)
│   └── POST /reset-password    — Consume reset token, update password hash
├── /runs (runs.routes.ts)
│   ├── GET /                   — List runs (filters: search, distance_min, date, city, club_id, pace, run_type, trending)
│   ├── GET /mine               — Organizer's created runs (requireAuth)
│   ├── GET /joined             — User's joined runs (requireAuth)
│   ├── GET /:id                — Single run detail
│   ├── GET /:id/attendees      — Attendee list
│   ├── GET /:id/weather        — Weather proxy (Open-Meteo, free, no key)
│   ├── POST /                  — Create run (requireAuth, organizer, validates club ownership)
│   ├── PATCH /:id              — Update run (requireAuth, creator only)
│   ├── DELETE /:id             — Delete run (requireAuth, creator only)
│   ├── POST /:id/join          — Toggle join/unjoin (requireAuth)
│   └── POST /:id/link-strava   — Link Strava activity to run attendee record (requireAuth)
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
├── /users (users.routes.ts)
│   ├── GET /:id/profile        — Public user profile with stats
│   └── GET /strava/activities  — Proxy Strava API for authenticated user's activities (requireAuth)
├── /geocode (geocode.routes.ts)
│   └── GET /?address=          — Proxy to Google Geocoding API (server-side)
└── /strava (strava.routes.ts)
    ├── GET /strava             — Initiate Strava OAuth (redirect to Strava auth URL)
    └── GET /strava/callback    — OAuth callback: exchange code → tokens, UPDATE users
```

## Implementation Details

### Authentication Routes (auth.routes.ts ~230 lines)

**POST /api/auth/register**
- Input: {displayName, email, password, role: 'runner'|'organizer'}
- Process: bcrypt.hash(password, 12) → INSERT users → jwt.sign(1h) + refresh token (30d, hashed)
- Output: {token, refreshToken, expiresIn, user{id,displayName,email,role}}
- Status: 201 Created | 409 Conflict | 400 Bad Request

**POST /api/auth/login**
- Input: {email, password}
- Process: SELECT users WHERE email → bcrypt.compare → jwt.sign(1h) + refresh token (30d)
- Output: {token, refreshToken, expiresIn, user{id,displayName,email,role}}

**POST /api/auth/refresh**
- Input: {refreshToken}; hash + compare against refresh_tokens table → new JWT (1h)

**POST /api/auth/forgot-password**
- Rate limited; generates hashed token in password_reset_tokens (1h TTL)
- Does not confirm whether email exists (prevents enumeration)

**POST /api/auth/reset-password**
- Input: {token, password}; validates token not expired/used; updates password_hash; marks used

### Runs Routes (runs.routes.ts ~290 lines)

**GET /api/runs** (public)
- Filters: search (ILIKE title/club_name/start_address), distance_min, date (today|tomorrow|week), city, club_id, pace, run_type, trending, tags
- `?trending=1`: ORDER BY attendee_count DESC, scoped to event_date within next 72h
- Dynamic WHERE builder with parameterized queries
- LEFT JOIN clubs → returns club_name, club_city in each row
- json_agg(attendees with display_name) grouped by run_id

**POST /api/runs/:id/link-strava** (requireAuth)
- Input: {stravaActivityId}
- Fetches Strava activity data via stored user access token
- UPDATE run_attendees SET strava_activity_id, strava_distance, strava_moving_time, strava_average_speed, strava_polyline

**GET /:id/weather** (public)
- Proxies Open-Meteo free API (no key); returns {temperature_2m, weathercode} for event hour

### Users Routes (users.routes.ts ~122 lines)

**GET /api/users/:id/profile** (public)
- Returns user's public profile with run stats

**GET /api/users/strava/activities** (requireAuth)
- Proxies to Strava API using user's stored strava_access_token
- Returns user's recent Strava activities for run linking

### Strava Routes (strava.routes.ts ~170 lines)

**GET /api/strava** (no auth)
- Generates state token (stored in memory for CSRF protection)
- Redirects to Strava OAuth authorization URL
- Uses STRAVA_CLIENT_ID, STRAVA_REDIRECT_URI env vars
- **Note:** State stored in process memory — not suitable for multi-instance deployments

**GET /api/strava/callback** (no auth)
- Validates state token to prevent CSRF
- Exchanges code for access_token + refresh_token via Strava token endpoint
- UPDATE users SET strava_athlete_id, strava_access_token, strava_refresh_token, strava_token_expires_at, strava_connected = true
- Redirects frontend with success/error query param

### Clubs Routes (clubs.routes.ts ~156 lines)

**GET /api/clubs** (public)
- Subqueries: member_count (COUNT), next_run_date (MIN event_date)

**POST /api/clubs/** (requireAuth)
- Input: {name, description?, city?, pace?, tags?}
- INSERT clubs → auto-INSERT club_members (role='owner')

**POST /api/clubs/:id/join** (requireAuth)
- Toggle join/leave; prevents owner from leaving

### Geocoding Routes (geocode.routes.ts 26 lines)

**GET /api/geocode?address=**
- Proxies Google Geocoding API server-side (GOOGLE_SERVER_API_KEY)
- Output: {lat, lng, formatted_address}

## Middleware Chain

```
index.ts
├── cors({origin: [localhost, CORS_ORIGIN]})
├── express.json()
└── Router mounting:
    ├── /api/auth         (no global auth)
    ├── /api/runs         (routes handle requireAuth per endpoint)
    ├── /api/clubs        (routes handle requireAuth per endpoint)
    ├── /api/users        (strava/activities requires auth)
    ├── /api/geocode      (no auth)
    ├── /api/strava       (OAuth flow, no auth)
    └── /api/health       (GET → {status, timestamp})
```

**Auth Middleware (auth.middleware.ts 11 lines)**
- Applied selectively via `requireAuth` in each route
- Extracts Bearer token → verifies JWT → sets req.user = {id, email, role}

**Rate Limit Middleware (rate-limit.middleware.ts)**
- login: 5/15m | register: 3/h | geocode: separate | API: 100/15m

## File Sizes & Organization

| File                                   | Lines | Purpose                               |
|----------------------------------------|-------|---------------------------------------|
| src/index.ts                           | 78    | App setup, route mounting             |
| src/routes/auth.routes.ts              | ~230  | Register, login, refresh, logout, password reset |
| src/routes/runs.routes.ts              | ~290  | Run CRUD + join + weather + link-strava |
| src/routes/clubs.routes.ts             | ~156  | Club CRUD + join                      |
| src/routes/users.routes.ts             | ~122  | User profile + Strava activities proxy|
| src/routes/strava.routes.ts            | ~170  | Strava OAuth initiation + callback    |
| src/routes/geocode.routes.ts           | 26    | Google Geocoding proxy                |
| src/middleware/auth.middleware.ts      | 11    | JWT verification                      |
| src/middleware/rate-limit.middleware.ts| ~30   | Express rate limit config             |
| src/db/index.ts                        | ~20   | pg.Pool init, SSL support             |

## Error Handling

All routes follow pattern:
```
try {
  res.status(201|200|400|403|404).json({...})
} catch (err) {
  console.error(err)
  res.status(500).json({error: 'Server error'})
}
```

No custom error boundaries. 400 validation | 401/403 auth | 404 not found | 500 server.

## Related Codemaps
- [architecture.md](architecture.md) — Data flow, deployment
- [data.md](data.md) — Database schema & queries
- [dependencies.md](dependencies.md) — npm packages, env vars
