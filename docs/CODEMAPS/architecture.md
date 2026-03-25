<!-- Generated: 2026-03-22 | Files scanned: 12 | Token estimate: ~380 -->

# KLUB Architecture Codemap

**Last Updated:** 2026-03-22
**Entry Points:** `/Users/alexbeattie/Downloads/klub/backend/src/index.ts` | `/Users/alexbeattie/Downloads/klub/frontend/src/main.ts`

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
└──────────────────────┬──────────────────────────────────────┘
                       │ TCP/SSL
┌──────────────────────▼──────────────────────────────────────┐
│   PostgreSQL (port 5432)                                    │
│   users | clubs | club_members | run_events | run_attendees│
└─────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
klub/
├── frontend/              Angular 17 PWA app
├── backend/               Express API
├── tasks/                 Progress tracking
├── .env                   Environment secrets (gitignored)
├── generate-env.js        Pre-build env → environment.ts
├── package.json           Root workspace config
└── docs/CODEMAPS/         This documentation
```

**Commands:**
- `npm run dev` — Start both frontend + backend concurrently
- `npm run build:frontend` — Generate env, build Angular
- `npm run build:backend` — TypeScript compile
- `npm test` — Jest coverage on both

## Data Flow

### 1. User Registration/Login
```
RegisterComponent (frontend)
  → AuthService.register(displayName, email, password, role)
    → POST /api/auth/register
      → auth.routes.ts: bcrypt.hash(password, 12)
      → INSERT users table
      → JWT sign (7d expiry)
      → Response: {token, user{id,displayName,email,role}}
  → localStorage: klub_token, klub_user
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
      → INSERT club_members (role='owner')
  → OrganiserHomeComponent shows owned clubs
  → CreateRunComponent: select clubId from dropdown
    → POST /api/runs with clubId
      → runs.routes.ts: Verify user is club owner/organizer
      → Enforce: only 'owner' role in club_members can create runs
      → INSERT run_events with club_id, club_name
```

## Middleware Stack (Backend)

**Order in index.ts:27–33:**
```
express.json()                    ← Parse request body
cors({origin: [localhost, CORS_ORIGIN]})
↓
/api/auth                         ← No auth needed
/api/runs                         ← GET public, POST requireAuth
/api/clubs                        ← GET public, POST requireAuth
/api/geocode                      ← No auth needed
/api/health                       ← Health check
```

**Auth Middleware (auth.middleware.ts:4–10):**
- Extract Bearer token from Authorization header
- Verify JWT signature against process.env.JWT_SECRET
- On success: req.user = {id, email, role}
- On failure: 401 Unauthorized

## Key Dependencies

**Backend:**
- `express@4.18.2` — HTTP server
- `pg@8.11.0` — PostgreSQL driver (with SSL support)
- `bcryptjs@2.4.3` — Password hashing
- `jsonwebtoken@9.0.0` — JWT generation/verification
- `cors@2.8.5` — Cross-origin requests

**Frontend:**
- `@angular/core@17.3.12` — DI, signals, lifecycle
- `@angular/router@17.3.12` — Lazy routing
- `@angular/service-worker@17.3.12` — PWA offline support
- `rxjs@7.8.0` — Observable streams

## Deployment Targets

| Layer      | Service   | Notes                               |
|------------|-----------|-------------------------------------|
| Frontend   | Netlify   | Static build, env injected pre-build|
| Backend    | Render    | Node.js, auto-reload on push       |
| Database   | Render    | PostgreSQL managed, SSL enabled    |

## Related Codemaps
- [backend.md](backend.md) — All API routes & implementation
- [frontend.md](frontend.md) — Route tree & component hierarchy
- [data.md](data.md) — Table schemas & relationships
- [dependencies.md](dependencies.md) — npm packages & env vars
