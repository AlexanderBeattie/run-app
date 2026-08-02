<!-- Generated: 2026-03-29 | Codemap Index -->

# KLUB Codemap Index

**Last Updated:** 2026-03-29

Welcome to the KLUB codebase documentation. These codemaps provide token-lean, single-source-of-truth architectural guides extracted directly from code.

## What Are Codemaps?

Codemaps are minimal architectural documents that map code structure without becoming outdated. Each file:
- Extracts actual code paths (file:line references)
- Includes ASCII diagrams for visual clarity
- Provides implementation details for critical flows
- Cross-references related documentation
- Stays under 1000 tokens for fast reading

## Files

### 1. [architecture.md](architecture.md) — System Overview
**Entry Points:** `backend/src/index.ts` | `frontend/src/main.ts`

Monorepo structure, HTTP/REST flow, middleware stack, deployment targets.

**Covers:**
- Browser ← HTTP → Node/Express API ← TCP → PostgreSQL
- User authentication, run discovery, club management data flows
- CORS configuration, JWT middleware
- Deployment on Netlify (frontend), Render (backend + DB)

**Read this first** to understand how pieces connect.

---

### 2. [backend.md](backend.md) — API Routes & Implementation
**Entry Point:** `backend/src/index.ts:27–33`

Complete route tree with request/response specs for all endpoints.

**Covers:**
- POST /api/auth/register, /api/auth/login, refresh, forgot/reset-password
- GET /api/runs (with filters + trending), POST /:id/link-strava
- GET /api/clubs, POST /api/clubs/join
- GET /api/users/:id/profile, GET /api/users/strava/activities
- GET /api/strava (OAuth init), GET /api/strava/callback
- GET /api/geocode (Google API proxy)
- Middleware chain, JWT verification, rate limiting, error handling

**Read this to understand API contracts** before calling endpoints from frontend.

---

### 3. [frontend.md](frontend.md) — Routes, Components & Services
**Entry Point:** `frontend/src/app/app.component.ts`

Angular 17 component hierarchy, lazy routes, signals-based state, service APIs.

**Covers:**
- Route tree with guards (authGuard, organizerGuard, lazy loading)
- AppComponent shell → 5 feature modules → 18 components
- Service descriptions (AuthService, RunsService, ClubService)
- HttpInterceptor for JWT attachment and 401 handling
- RunCardComponent (reusable), RunDetailDialogComponent (bottom sheet), BottomNavComponent
- Toast notifications (signal-driven)

**Read this to understand component structure and navigation flows.**

---

### 4. [data.md](data.md) — Database Schema & Queries
**Sources:** `backend/src/db/schema.sql` | `backend/src/db/migration-001.sql`

5-table ER diagram, column definitions, constraints, migration history.

**Covers:**
- users (with role: runner|organizer)
- clubs (with owner_id, city, pace, tags)
- club_members (junction: club ← → user with role enforcement)
- run_events (with optional club_id for independent runs)
- run_attendees (toggle join via composite PK)
- Query patterns: list runs with attendees, verify club ownership, list clubs with metadata
- FK CASCADE, composite PKs, denormalization strategy

**Read this before writing database queries** or understanding permission enforcement.

---

### 5. [dependencies.md](dependencies.md) — Packages & Configuration
**Sources:** `package.json` (all 3) | `.env` (gitignored)

npm dependencies, environment variables, build processes, testing setup.

**Covers:**
- 7 environment variables (GOOGLE_MAPS_API_KEY, DATABASE_URL, JWT_SECRET, CORS_ORIGIN, etc.)
- 6 backend core deps (express, pg, bcryptjs, jsonwebtoken, cors, dotenv)
- 11 frontend core deps (@angular/*@17.3, rxjs, service-worker)
- Root monorepo: npm workspaces, rxjs override, concurrently
- Build pipeline: generate-env.js → ng build (frontend), tsc (backend)
- Jest configuration for both frontend (jsdom) and backend (node)
- External services: Google Maps JS API, Google Geocoding API, PostgreSQL on Render

**Read this for setup commands, environment configuration, and CI/CD context.**

---

## Navigation & Cross-References

Each codemap includes a **Related Codemaps** section with links:

```
architecture.md ──┬─→ backend.md
                  ├─→ frontend.md
                  ├─→ data.md
                  └─→ dependencies.md

backend.md ───────┬─→ architecture.md
                  ├─→ data.md
                  └─→ dependencies.md

frontend.md ──────┬─→ architecture.md
                  ├─→ backend.md
                  └─→ dependencies.md

data.md ──────────┬─→ backend.md
                  └─→ architecture.md

dependencies.md ──┬─→ architecture.md
                  ├─→ backend.md
                  └─→ frontend.md
```

---

## Key Patterns

### Authentication
1. User registers via `/api/auth/register` → bcrypt hash + JWT sign
2. Token stored in localStorage (klub_token, klub_user)
3. jwtInterceptor attaches `Authorization: Bearer {token}` to all requests
4. requireAuth middleware verifies JWT, 401 on failure
5. authGuard/organizerGuard check role before routing

### Run Discovery
1. HomeComponent loads runs via RunsService.loadRuns(filters)
2. GET /api/runs applies dynamic WHERE filters (search, distance_min, date, city, pace, club_id)
3. json_agg aggregates attendee user_ids
4. RunCardComponent renders each run, toggleJoin() sends POST /api/runs/:id/join
5. RunsService updates local signal state

### Club & Run Management
1. CreateClubComponent creates club → auto-joins owner as 'owner' in club_members
2. CreateRunComponent selects clubId from dropdown (ClubService.getMyClubs())
3. POST /api/runs verifies user is club owner or organizer member
4. Backend query checks: club_members.role IN ('owner', 'organizer')
5. OrganiserHomeComponent displays created runs + owned clubs with edit/delete actions

---

## Development Workflow

### Before Coding
1. Read **architecture.md** for system context
2. Find relevant codemaps: backend.md for API, frontend.md for UI, data.md for DB

### Adding a Feature
1. Check **backend.md** for API endpoint (exists? permissions?)
2. Check **data.md** for database changes needed
3. Check **frontend.md** for route/component structure
4. Check **dependencies.md** for new packages required

### Debugging
1. **API issue?** → backend.md (route logic, query patterns)
2. **UI issue?** → frontend.md (component tree, service calls)
3. **Data issue?** → data.md (schema, constraints, FK relationships)
4. **Config issue?** → dependencies.md (env vars, build process)

---

## Environment Setup

Required `.env` variables:

```bash
GOOGLE_MAPS_API_KEY=AIzaSyA...           # Browser Maps JS API
PORT=3000                                 # Express server port
DATABASE_URL=postgresql://user:pass@...   # PostgreSQL connection
JWT_SECRET=your-secret-key               # Token signing key
JWT_EXPIRES_IN=1h                        # JWT lifetime (refresh tokens handle session continuity)
CORS_ORIGIN=http://localhost:4200        # Production frontend origin
GOOGLE_SERVER_API_KEY=AIzaSyA...         # Server-side Geocoding API
```

See [dependencies.md](dependencies.md#environment-variables) for details.

---

## Commands

```bash
# Development
npm run dev              # Start frontend (4200) + backend (3000)
npm run build:frontend   # Generate env + ng build
npm run build:backend    # tsc compile

# Testing
npm test                # Jest on both workspaces
npm run test:backend    # Backend only
npm run test:frontend   # Frontend only
```

---

## Deployment

| Layer    | Platform | Source | Key Steps |
|----------|----------|--------|-----------|
| Frontend | Netlify  | frontend/dist/ | `npm run build:frontend` auto-builds from main |
| Backend  | Render   | backend/dist/  | `npm run build:backend`, env vars injected |
| Database | Render   | PostgreSQL     | Fresh install: `psql < schema.sql`. Existing DB: run migration-001 through 004 individually. |

See [architecture.md](architecture.md#deployment-targets) for more.

---

## Known Issues & Future Work

**Known Issues** (from project CLAUDE.md):
1. PWA service worker: intermittent 404 on ngsw-worker.js
2. PWA manifest: occasionally not served correctly on Netlify
3. Backend clubs.routes tests: still testing old 3-endpoint version
4. No error boundary on frontend
5. club_members.role supports 'member'|'organizer'|'owner' but only 'owner' enforced

**Phase 4 In Progress:** Deployment readiness. See `tasks/todo.md` for active sprint.

---

## Learning Resources

- [tasks/lessons.md](../../tasks/lessons.md) — Debugging notes & patterns from development
- [CLAUDE.md](../../CLAUDE.md) — Project conventions, workflow orchestration
- [Angular 17 Standalone Docs](https://angular.io/guide/standalone-components)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [JWT.io](https://jwt.io/) — Token inspection & debugging

---

## Maintenance

**Update Frequency:**
- Major feature additions: Update all 5 codemaps
- API route changes: Update backend.md + architecture.md
- Component reorganization: Update frontend.md
- Schema changes: Update data.md + architecture.md
- Dependency upgrades: Update dependencies.md

**Freshness Header:**
Each file includes a generated timestamp. If older than 2 weeks + recent code commits, verify contents.

---

Last refreshed by Claude Code on 2026-03-23.

For questions, check existing codemaps first. If not found, follow the pattern in any .md file to add documentation.

**Key Principle:** Documentation that doesn't match reality is worse than no documentation. Always verify code before updating docs.
