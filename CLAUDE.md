# Claude Instructions

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

#### Subagent prompt construction — always include a "Read first" block

Subagents inherit CLAUDE.md and global rules but NOT conversation context. Inject the right files or they will make expensive, already-solved mistakes.

| Agent touches | Must include in prompt |
|---|---|
| Any test file | `tasks/lessons.md` — mandatory, prevents Jest/Angular config loops |
| Any feature work | `tasks/todo.md` — sprint context |
| Backend routes or schema | `backend/src/db/schema.sql` |
| New component or route | Frontend file map section from this CLAUDE.md |
| Architectural scope | `docs/CODEMAPS/*.md` if present |

Targeted context beats blanket context. Only inject what's relevant to the task — reading `lessons.md` costs ~3-4k tokens upfront but prevents 20-30k token debugging loops.

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project
- Proactively capture better patterns discovered through research or experience — do not wait for user correction

#### Lesson capture quality gate

Before writing any lesson, it must pass ALL three checks:
1. **Evidence** — observed working in this codebase (tests passed, build succeeded, user confirmed) OR from a citable external source. Never "I think" or "generally recommended"
2. **Specific** — names the exact file, function, or pattern. No vague generalisations
3. **Net new** — not already covered by CLAUDE.md or existing lessons

If any check fails: do not write the lesson. Unverified lessons compound into bad decisions faster than no lessons at all.

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## Project: KLUB — Run Club Discovery Platform

### What it is
Mobile-first PWA for discovering and managing local run clubs. Runners discover and join runs. Organisers post and manage runs with attendee tracking. Clubs are optional — organisers can post independent runs.

### Tech stack
- **Frontend**: Angular 17, standalone components, SCSS, Google Maps JS API, PWA
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, JWT auth, bcrypt
- **Monorepo**: npm workspaces, root package.json with concurrently
- **Testing**: Jest on both frontend and backend
- **Hosting**: Netlify (frontend), Render (backend + PostgreSQL)

### Structure
```
klub/
├── frontend/          ← Angular 17 PWA
├── backend/           ← Node/Express API
├── tasks/             ← todo.md + lessons.md
├── package.json       ← monorepo root
├── .env               ← all secrets (gitignored)
├── generate-env.js    ← generates environment.ts from .env before build
└── .gitignore
```

### Commands
```bash
npm run dev              # start both frontend and backend
npm run test:backend     # jest — 4 suites, 29 tests
npm run test:frontend    # jest — 6 suites, 40 tests
npm run build:frontend   # generates env then ng build
npm run build:backend    # tsc
```

### Database
- **Local**: klubdb / klubuser / klubpass on localhost:5432
- **Schema**: `backend/src/db/schema.sql`
- **Migration**: `backend/src/db/migration-001.sql`
- **Tables**: users, clubs, club_members, run_events, run_attendees
- Migrations are manual SQL files — run with `psql`

### Permissions model
| Action                   | Runner | Organiser | Club Owner |
|--------------------------|--------|-----------|------------|
| Join run                 | ✅     | ✅        | ✅         |
| Create run (independent) | ❌     | ✅        | ✅         |
| Create club              | ❌     | ✅        | ✅         |
| Attach run to club       | ❌     | ❌        | ✅         |

Backend enforces all permissions. Frontend controls visibility only.

### API endpoints
```
# Auth
POST   /api/auth/register
POST   /api/auth/login

# Runs
GET    /api/runs              — ?search=, ?distance_min=, ?date=today|tomorrow|week, ?city=, ?pace=, ?club_id=
GET    /api/runs/mine         — organiser's own runs (auth)
GET    /api/runs/joined       — runner's joined runs (auth)
GET    /api/runs/:id
GET    /api/runs/:id/attendees
POST   /api/runs              — create run (auth, organizer, validates club ownership if clubId provided)
PATCH  /api/runs/:id          — edit/cancel (auth, creator only)
DELETE /api/runs/:id          — delete (auth, creator only)
POST   /api/runs/:id/join     — toggle join/unjoin (auth)

# Clubs
GET    /api/clubs             — list all with member count + next run date
GET    /api/clubs/mine        — clubs user is member of (auth)
GET    /api/clubs/owned       — clubs user owns (auth, for create-run dropdown)
GET    /api/clubs/:id         — club profile
GET    /api/clubs/:id/runs    — club's active runs
GET    /api/clubs/:id/members — member list
POST   /api/clubs             — create club (auth, auto-joins owner)
PATCH  /api/clubs/:id         — update (owner only)
POST   /api/clubs/:id/join    — toggle join/leave (auth, owner can't leave)

# Geocode
GET    /api/geocode?address=  — proxies to Google Geocoding API server-side

# Health
GET    /api/health
```

### Angular patterns — DO NOT DEVIATE
- **Standalone components only** — no NgModules anywhere
- **Signals** for state (`signal()`, `computed()`, `.set()`, `.update()`)
- **`inject()` function** — not constructor injection
- **Lazy loading**: `loadComponent: () => import(...).then(m => m.ComponentName)`
- **Route ordering**: static routes (`clubs/create`, `clubs/create-run`) MUST come before parameterised (`clubs/:id`)
- **Inline templates and styles** in component decorator — no separate .html/.css files

### Test patterns — DO NOT DEVIATE
These patterns were debugged extensively. Do not change test infrastructure without reading `tasks/lessons.md` first.

**Frontend (Jest + jest-preset-angular@14 + Angular 17):**
- `setup-jest.ts` does manual `TestBed.initTestEnvironment()` — does NOT import `jest-preset-angular/setup-jest`
- Every spec: `TestBed.resetTestingModule()` BEFORE `TestBed.configureTestingModule()`
- Use `provideHttpClient()` + `provideHttpClientTesting()` — NOT `HttpClientTestingModule`
- Use `provideRouter([])` — NOT `RouterTestingModule`
- `tsconfig.spec.json` types: `["jest"]` — NOT `["jasmine"]`
- `jest.config.js` uses `setupFiles` key — NOT `setupFilesAfterSetup` or `setupFilesAfterFramework`
- All versions pinned to 29.x: jest, jest-environment-jsdom, @types/jest, ts-jest

**Backend (Jest + ts-jest@29):**
- `tsconfig.test.json` extends `tsconfig.json`, adds `"jest"` to types, includes test files
- `package.json` jest config uses `transform` with `ts-jest` pointing to `tsconfig.test.json`
- Tests mock `../../db` with `jest.mock()` and use supertest

### Frontend file map
```
src/app/
├── app.component.ts          — shell with bottom nav + toast outlet
├── app.config.ts              — providers: router, httpClient, service worker
├── app.routes.ts              — lazy loaded routes with guards
├── core/
│   ├── guards/                — authGuard, organizerGuard (functional CanActivateFn)
│   ├── interceptors/          — jwtInterceptor (attaches Bearer token)
│   ├── models/                — RunEvent, KlubUser, Club, ClubMember, CreateRunPayload
│   └── services/              — AuthService, RunsService, ClubService, GeocodingService
├── features/
│   ├── auth/                  — LoginComponent, RegisterComponent
│   ├── clubs/                 — ClubListComponent, ClubProfileComponent, CreateClubComponent,
│   │                            CreateRunComponent, EditRunComponent, OrganiserHomeComponent,
│   │                            RunOrganiserDialogComponent
│   ├── home/                  — HomeComponent (feed with search + filters)
│   ├── map/                   — MapViewComponent (Google Maps + geolocation)
│   └── profile/               — RunnerProfileComponent
└── shared/
    ├── components/
    │   ├── bottom-nav/        — 4-tab nav (Home, Map, Clubs, Profile/Dashboard)
    │   ├── run-card/          — reusable run card
    │   ├── run-detail-dialog/ — bottom sheet run detail
    │   └── toast/             — notification toasts
    └── services/
        └── toast.service.ts   — signal-based toast state
```

### Backend file map
```
src/
├── index.ts                   — Express app, CORS, route mounting, health check
├── db/
│   ├── index.ts               — pg Pool with SSL toggle
│   ├── schema.sql             — initial schema (4 tables)
│   └── migration-001.sql      — club_members, pace/tags columns
├── middleware/
│   └── auth.middleware.ts     — JWT verification, sets req.user
├── routes/
│   ├── auth.routes.ts         — register + login
│   ├── clubs.routes.ts        — full club CRUD + membership
│   ├── geocode.routes.ts      — Google Geocoding proxy
│   └── runs.routes.ts         — CRUD + filters + join toggle
└── types/
    └── index.ts               — AuthRequest interface
```

### Brand
- Primary green: `#1D9E75`
- Light green: `#E1F5EE`
- Dark green: `#0F6E56`
- Near-black: `#0D0D0D`
- Surface: `#F7F7F5`
- Font: Inter
- Tagline: "Outrun the algorithm."

### Style rules
- UK English throughout
- Direct, clear — no filler or fluff
- Complete working files in cases of multiple changes throughout same file — never partial snippets
- Separate code blocks per file when showing multiple files

### Environment variables (root .env)
```
GOOGLE_MAPS_API_KEY=
PORT=3000
DATABASE_URL=postgresql://klubuser:klubpass@localhost:5432/klubdb
JWT_SECRET=
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:4200
```

### Known issues
1. PWA service worker: intermittent 404 on ngsw-worker.js
2. PWA manifest: occasionally not served correctly on Netlify
3. Google Maps: using deprecated `Marker` API — should migrate to `AdvancedMarkerElement`
4. Backend clubs.routes tests: still testing old 3-endpoint version, need updating
5. Production DB: migration-001.sql may not have been run yet
6. No error boundary on frontend — unhandled API errors show in console only
7. club_members.role supports 'member' | 'organizer' | 'owner' but only 'owner' enforced

### Current phase
See `tasks/todo.md` for active sprint and task queue.
See `tasks/lessons.md` for patterns, gotchas, and mistakes to avoid.

### Session history
Full Phase 1 + 2 debugging happened in a claude.ai chat session (22 March 2026). Every Jest/Angular configuration gotcha is documented in `tasks/lessons.md`. Do NOT attempt to change jest config, `setup-jest.ts`, `tsconfig.spec.json`, or any test infrastructure without reading `tasks/lessons.md` first.