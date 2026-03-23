<!-- Generated: 2026-03-22 | Files scanned: 3 | Token estimate: ~280 -->

# Dependencies & Configuration Codemap

**Last Updated:** 2026-03-22
**Sources:** `package.json` (all 3) | `.env` (root, gitignored)

## Environment Variables

**Root .env** (gitignored, required for both frontend & backend)

| Variable | Used By | Example | Purpose |
|----------|---------|---------|---------|
| GOOGLE_MAPS_API_KEY | frontend env.ts | AIzaSyA... | Browser-facing, for Google Maps JS API |
| PORT | backend index.ts | 3000 | Express server port |
| DATABASE_URL | backend db/index.ts | postgresql://user:pass@host:5432/db | PostgreSQL connection |
| JWT_SECRET | backend auth/routes | (any string) | Signing & verification of JWTs |
| JWT_EXPIRES_IN | backend auth/routes | 7d | Token lifetime (applied to all JWTs) |
| CORS_ORIGIN | backend index.ts | https://frontend.netlify.com | Production frontend origin for CORS |
| GOOGLE_SERVER_API_KEY | backend geocode/routes.ts | (API key) | Server-side Google Geocoding proxy |

**Generated at build time:**
- `frontend/src/environments/environment.ts` — Built from root .env via `generate-env.js` pre-build script

## Backend Dependencies

**Source:** `/Users/alexbeattie/Downloads/klub/backend/package.json`

### Production (runtime)

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | HTTP server framework |
| pg | ^8.11.0 | PostgreSQL driver (with SSL support) |
| bcryptjs | ^2.4.3 | Password hashing (12 salt rounds) |
| jsonwebtoken | ^9.0.0 | JWT generation & verification |
| cors | ^2.8.5 | CORS middleware (allows localhost:4200 + CORS_ORIGIN) |
| dotenv | ^16.0.3 | Load .env into process.env |

**Total: 6 core dependencies**

### Development (dev tools)

| Package | Version | Purpose |
|---------|---------|---------|
| jest | ^29.7.0 | Test runner |
| ts-jest | ^29.4.6 | TypeScript transpiler for Jest |
| nodemon | ^3.0.1 | Auto-reload on file changes (`npm run dev`) |
| ts-node | ^10.9.1 | TypeScript execution (used by nodemon) |
| supertest | ^7.2.2 | HTTP mocking for tests |
| @types/* | (various) | TypeScript definitions for runtime packages |

**Test command:** `jest --coverage` (covers src/, excludes db/schema.sql)

## Frontend Dependencies

**Source:** `/Users/alexbeattie/Downloads/klub/frontend/package.json`

### Production (runtime)

| Package | Version | Purpose |
|---------|---------|---------|
| @angular/core | ^17.3.12 | DI, signals, component decorators |
| @angular/common | ^17.3.12 | Common directives, pipes |
| @angular/router | ^17.3.12 | Lazy route loading, navigation |
| @angular/forms | ^17.3.12 | Template-driven & reactive forms |
| @angular/platform-browser | ^17.3.12 | DOM rendering, bootstrapping |
| @angular/platform-browser-dynamic | ^17.3.12 | Runtime compilation (used by ng serve) |
| @angular/service-worker | ^17.3.12 | PWA offline support (ngsw-worker.js) |
| @angular/animations | ^17.3.12 | Animation engine |
| rxjs | ~7.8.0 | Observable streams (controlled at root) |
| tslib | ^2.3.0 | Angular runtime helpers |
| zone.js | ~0.14.3 | Zone management (async tracking) |

**Total: 11 core dependencies**

### Development (dev tools)

| Package | Version | Purpose |
|---------|---------|---------|
| @angular/cli | ^17.3.17 | Build & serve tooling |
| @angular-devkit/build-angular | ^17.3.17 | Angular builder |
| @angular/compiler-cli | ^17.3.12 | Offline template compiler |
| jest | ^29.7.0 | Test runner |
| jest-preset-angular | ^14.4.0 | Angular test configuration |
| jest-environment-jsdom | ^29.7.0 | DOM environment for tests |
| ts-jest | (no explicit version, pulls from root) | TypeScript support in Jest |
| @types/* | (various) | TypeScript definitions |

**Test command:** `jest --coverage` (Jest configured in package.json)

## Root Monorepo Configuration

**Source:** `/Users/alexbeattie/Downloads/klub/package.json`

```json
{
  "workspaces": ["frontend", "backend"],
  "overrides": { "rxjs": "~7.8.0" },
  "scripts": {
    "dev": "concurrently 'npm run dev:frontend' 'npm run dev:backend'",
    "test": "concurrently 'npm run test:frontend' 'npm run test:backend'"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "dotenv": "^16.0.3",
    "typescript": "5.4.5" (pinned)
  }
}
```

**rxjs override:** Ensures single version across workspaces (prevents peer dep conflicts)
**concurrently:** Runs frontend + backend in parallel for `dev` and `test`
**TypeScript:** Pinned to 5.4.5 (not ^) for reproducible builds

## Build Process

### Frontend Build: `npm run build:frontend`

```bash
1. node generate-env.js
   ├── Read root .env
   ├── Template environment.ts with GOOGLE_MAPS_API_KEY + apiUrl
   └── Write frontend/src/environments/environment.ts
2. ng build
   ├── Compile Angular standalone components
   ├── Minify, tree-shake dead code
   ├── Output: frontend/dist/
   └── Emit ngsw-worker.js (PWA manifest)
3. Deploy: Netlify auto-deploys frontend/dist/
```

### Backend Build: `npm run build:backend`

```bash
1. tsc (TypeScript compiler)
   ├── Read backend/tsconfig.json
   ├── Output: backend/dist/*.js
   └── No minification (Node serves as-is)
2. Deploy: Render auto-starts backend/dist/index.js
```

## Testing Configuration

### Backend (Jest)

```json
{
  "jest": {
    "testEnvironment": "node",
    "transform": { "^.+\\.ts$": ["ts-jest", {"tsconfig": "tsconfig.test.json"}] },
    "collectCoverageFrom": ["src/**/*.ts", "!src/db/schema.sql"]
  }
}
```

**Coverage target:** 80%+ (typical target, not enforced)
**Test discovery:** `src/**/*.test.ts` and `src/**/*.spec.ts`

### Frontend (Jest)

**Configuration in package.json (via jest-preset-angular):**
- Preset: `jest-preset-angular@14.4.0` (pinned exactly)
- Environment: `jsdom` (browser DOM simulation)
- Setup: `setup-jest.ts` (manual TestBed initialization, not preset setup)
- TS transform: `ts-jest` with `tsconfig.spec.json`

**Key details:**
- `tsconfig.spec.json` types: `["jest"]` (NOT jasmine)
- `setup-jest.ts` does NOT import jest-preset-angular/setup-jest
- Does NOT use `setupFilesAfterFramework` key
- All versions @ 29.x (jest, jest-environment-jsdom, @types/jest)

## Version Pinning Strategy

| Package | Strategy | Reason |
|---------|----------|--------|
| typescript | Pinned (5.4.5) | Breaking TS versions → build issues |
| jest | ^29.7.0 | 29.x stable, avoid major bump |
| jest-preset-angular | ^14.4.0 | Tied to Angular 17.x |
| @angular/* | ^17.3.x | Minor updates safe, major = rewrite |
| rxjs | ~7.8.0 | Peer dependency control (overridden at root) |
| Node.js target | (inferred) | backend/tsconfig.json likely targets ES2020 |

## External Services

### Google APIs (via environment.ts + server proxy)

**Frontend:**
- Google Maps JS API — renders map, geolocation
- API Key: GOOGLE_MAPS_API_KEY in environment.ts (browser-exposed, restricted by referrer)

**Backend:**
- Google Geocoding API — reverse/forward geocode addresses
- API Key: GOOGLE_SERVER_API_KEY in .env (server-side, not exposed)
- Endpoint: `GET /api/geocode?address=` (frontend calls this, not Google directly)

### Data Persistence

**Database:** PostgreSQL (Render managed)
- Connection: DATABASE_URL (parsed by pg driver)
- SSL: Enabled by default for remote connections
- Migrations: Manual SQL files (no ORM, raw pg queries)

## Script Commands Reference

**Root:**
```bash
npm run dev              # Start frontend (4200) + backend (3000)
npm run build:frontend   # Gen env + Angular build
npm run build:backend    # TypeScript compile
npm run test            # Jest on both workspaces
npm run test:backend    # Jest backend only
npm run test:frontend   # Jest frontend only
```

**Workspace-specific (e.g., `npm run dev --workspace=backend`):**
- frontend: `start` (ng serve), `build`, `watch`, `test`, `test:watch`
- backend: `dev` (nodemon), `build`, `start` (node dist/), `test`, `test:watch`

## Related Codemaps
- [architecture.md](architecture.md) — Deployment targets (Netlify, Render)
- [backend.md](backend.md) — Environment usage (JWT_SECRET, DATABASE_URL)
- [frontend.md](frontend.md) — Environment usage (apiUrl, googleMapsApiKey)
