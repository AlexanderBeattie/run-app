<!-- Generated: 2026-03-29 | Files scanned: 14 | Token estimate: ~400 -->

# KLUB Architecture Codemap

**Last Updated:** 2026-03-29
**Entry Points:** `backend/src/index.ts` | `frontend/src/main.ts`

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Client Browser (PWA)                      │
│  Angular 17 | Signals | Standalone Components | Google Maps │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       │
┌──────────────────────▼──────────────────────────────────────┐
│         Node/Express API (port 3000)                        │
│  [CORS] → Routes → Auth Middleware → Database Pool          │
└──────┬───────────────┬──────────────────────────────────────┘
       │ TCP/SSL        │ HTTPS (OAuth redirect)
┌──────▼──────┐  ┌──────▼──────────────┐
│ PostgreSQL  │  │  Strava API          │
│ (port 5432) │  │  OAuth 2.0 + REST    │
└─────────────┘  └─────────────────────┘
```

## Monorepo Structure

```
klub/
├── frontend/              Angular 17 PWA app
├── backend/               Express API
├── e2e/                   Playwright E2E tests
├── tasks/                 Progress tracking
├── .env                   Environment secrets (gitignored)
├── generate-env.js        Pre-build env → environment.ts
├── playwright.config.ts   E2E test configuration
├── package.json           Root workspace config
└── docs/CODEMAPS/         This documentation
```

**Commands:**
- `npm run dev` — Start both frontend + backend concurrently
- `npm run build:frontend` — Generate env, build Angular
- `npm run build:backend` — TypeScript compile
- `npm test` — Jest coverage on both
- `npm run test:e2e` — Playwright E2E suite

## Data Flow

### 1. User Registration/Login
```
RegisterComponent (frontend)
  → AuthService.register(displayName, email, password, role)
    → POST /api/auth/register
      → auth.routes.ts: bcrypt.hash(password, 12)
      → INSERT users table
      → jwt.sign(1h) + refresh token (30d, hashed in DB)
      → Response: {token, refreshToken, user{id,displayName,email,role}}
  → localStorage: klub_token, klub_user, klub_refresh_token
  → AuthService.currentUser signal updates
  → authGuard allows navigation
```

### 2. Run Discovery & Join
```
HomeComponent (feed)
  → RunsService.loadRuns(filters)
    → GET /api/runs?search=...&pace=...&date=...
      → runs.routes.ts: Dynamic WHERE clause builder
      → SELECT r.* LEFT JOIN run_attendees
      → COALESCE json_agg attendees
  → RunsService.runs signal stores data
  → RunCardComponent renders with join button
  → toggleJoin(runId) → POST /api/runs/:id/join
    → requireAuth middleware validates JWT
    → INSERT/DELETE run_attendees
    → RunsService updates local state
```

### 3. Club Creation & Run Attachment
```
CreateClubComponent (organizer)
  → ClubService.createClub({name, description, city, pace, tags})
    → POST /api/clubs
      → clubs.routes.ts: INSERT clubs, auto-join owner as 'owner'
  → CreateRunComponent (wizard flow)
    → POST /api/runs with clubId
      → runs.routes.ts: Verify user is club owner/organizer
      → INSERT run_events with club_id, club_name
```

### 4. Strava OAuth Integration
```
RunnerProfileComponent
  → StravaService.initiateOAuth()
    → GET /api/strava (backend)
      → Generates state token, redirects to Strava OAuth URL
  → Strava callback → GET /api/strava/callback
      → Exchange code for access/refresh tokens
      → UPDATE users SET strava_* columns
      → Redirect frontend with success
  → StravaService.getActivities()
    → GET /api/users/strava/activities (requireAuth)
      → Proxies to Strava API using stored access token
```

## Middleware Stack (Backend)

**Order in index.ts:**
```
cors({origin: [localhost, CORS_ORIGIN]})
express.json()
↓
/api/auth        ← No auth needed
/api/runs        ← GET public, POST/PATCH/DELETE requireAuth
/api/clubs       ← GET public, POST requireAuth
/api/users       ← GET public, strava/activities requireAuth
/api/geocode     ← No auth needed
/api/strava      ← No auth needed (OAuth flow)
/api/health      ← Health check
```

**Auth Middleware (auth.middleware.ts):**
- Extract Bearer token from Authorization header
- Verify JWT against process.env.JWT_SECRET
- On success: req.user = {id, email, role}
- On failure: 401 Unauthorized

**Rate Limiting (rate-limit.middleware.ts):**
- Login: 5 requests / 15 min
- Register: 3 requests / 1 hour
- Geocode: separate limit
- General API: 100 requests / 15 min

## Key Dependencies

**Backend:**
- `express@4.18.2` — HTTP server
- `pg@8.11.0` — PostgreSQL driver (with SSL support)
- `bcryptjs@2.4.3` — Password hashing
- `jsonwebtoken@9.0.0` — JWT generation/verification
- `express-rate-limit@8.3.1` — Rate limiting

**Frontend:**
- `@angular/core@17.3.12` — DI, signals, lifecycle
- `@angular/router@17.3.12` — Lazy routing
- `@angular/service-worker@17.3.12` — PWA offline support
- `rxjs@7.8.0` — Observable streams

**External Services:**
- Google Maps JS API (frontend map rendering)
- Google Geocoding API (server-side address lookup)
- Strava API (OAuth + activity data)

## Deployment Targets

| Layer      | Service   | Notes                                |
|------------|-----------|--------------------------------------|
| Frontend   | Netlify   | Static build, env injected pre-build |
| Backend    | Render    | Node.js, auto-reload on push         |
| Database   | Render    | PostgreSQL managed, SSL enabled      |

## Related Codemaps
- [backend.md](backend.md) — All API routes & implementation
- [frontend.md](frontend.md) — Route tree & component hierarchy
- [data.md](data.md) — Table schemas & relationships
- [dependencies.md](dependencies.md) — npm packages & env vars
