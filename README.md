# KLUB

> Outrun the algorithm.

Mobile-first PWA for discovering and joining local run clubs. Runners find and sign up for runs. Organisers post and manage runs with attendee tracking.

**Stack:** Angular 17 · Node/Express · PostgreSQL · Google Maps JS API · JWT auth · PWA

---

## Features

- **Run feed** — searchable, filterable list of upcoming runs (distance, date, city, pace)
- **Map view** — Google Maps with run markers and geolocation
- **Clubs** — create clubs, join as a member, post runs under a club
- **Organiser dashboard** — manage your runs with Upcoming/Past/Cancelled tabs, attendee lists, cancel/delete
- **Run detail** — map with walking route, attendee count, join/leave toggle
- **Auth** — JWT register/login, role-based access (runner vs organiser)
- **PWA** — installable, service worker, offline shell

---

## Setup

**Prerequisites:** Node 18+, PostgreSQL running locally

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env
# Fill in: GOOGLE_MAPS_API_KEY, JWT_SECRET, DATABASE_URL

# 3. Create database
createdb klubdb
psql klubdb < backend/src/db/schema.sql
psql klubdb < backend/src/db/migration-001.sql

# 4. Start dev servers
npm run dev
# Frontend: http://localhost:4201
# Backend:  http://localhost:3000
```

### Environment variables (`.env`)

```
GOOGLE_MAPS_API_KEY=
PORT=3000
DATABASE_URL=postgresql://klubuser:klubpass@localhost:5432/klubdb
JWT_SECRET=
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:4201
```

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run dev:frontend` | Angular dev server on :4201 |
| `npm run dev:backend` | Node API on :3000 |
| `npm run test:frontend` | Jest — 12 suites, 109 tests |
| `npm run test:backend` | Jest — backend routes + services |
| `npm run build:frontend` | Generates `environment.ts` then `ng build` |
| `npm run build:backend` | TypeScript compile |

---

## Project structure

```
klub/
├── frontend/                  Angular 17 PWA
│   └── src/app/
│       ├── core/              Guards, interceptors, services, models
│       ├── features/          Auth, clubs, home, map, profile
│       └── shared/            Components (run-card, dialogs, nav, toast)
├── backend/                   Node/Express API
│   └── src/
│       ├── db/                Schema, migrations, pg pool
│       ├── middleware/        JWT auth
│       └── routes/            auth, clubs, runs, geocode
├── tasks/                     todo.md, lessons.md
├── .env                       Secrets (gitignored)
├── generate-env.js            Builds environment.ts from .env at build time
└── package.json               Monorepo root (npm workspaces)
```

---

## API

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/runs               ?search= ?distance_min= ?date= ?city= ?pace= ?club_id=
GET    /api/runs/mine          Organiser's runs (auth)
GET    /api/runs/joined        Runner's joined runs (auth)
GET    /api/runs/:id
GET    /api/runs/:id/attendees
POST   /api/runs               Create run (auth, organiser)
PATCH  /api/runs/:id           Edit / cancel (auth, creator)
DELETE /api/runs/:id           Delete (auth, creator)
POST   /api/runs/:id/join      Toggle join/unjoin (auth)

GET    /api/clubs              List all
GET    /api/clubs/mine         Clubs user is member of (auth)
GET    /api/clubs/owned        Clubs user owns, for run creation (auth)
GET    /api/clubs/:id
GET    /api/clubs/:id/runs
GET    /api/clubs/:id/members
POST   /api/clubs              Create club (auth)
PATCH  /api/clubs/:id          Update (owner only)
POST   /api/clubs/:id/join     Toggle join/leave (auth)

GET    /api/geocode?address=   Proxied Google Geocoding (server-side key)
GET    /api/health
```

---

## Permissions

| Action | Runner | Organiser | Club Owner |
|---|---|---|---|
| Join a run | ✅ | ✅ | ✅ |
| Create run (independent) | ❌ | ✅ | ✅ |
| Create club | ❌ | ✅ | ✅ |
| Attach run to club | ❌ | ❌ | ✅ |

Backend enforces all permissions. Frontend controls visibility only.

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Netlify — build cmd: `node ../generate-env.js && ng build` |
| Backend | Render — Node web service |
| Database | Render PostgreSQL |

**Production checklist before launch:** see `tasks/todo.md` → Phase 4.

---

## Testing

```bash
npm run test:frontend   # 12 suites, 109 tests
npm run test:backend    # routes + middleware
```

Tests use Jest on both sides. Frontend uses `jest-preset-angular@14` with manual `TestBed` setup — see `tasks/lessons.md` before changing any test infrastructure.
