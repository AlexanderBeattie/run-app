<!-- Generated: 2026-03-29 | Files scanned: 3 | Token estimate: ~300 -->

# Dependencies & Configuration Codemap

**Last Updated:** 2026-03-29
**Sources:** `package.json` (all 3) | `.env` (root, gitignored)

## Environment Variables

**Root .env** (gitignored, required for both frontend & backend)

| Variable               | Used By                     | Purpose                                       |
|------------------------|-----------------------------|-----------------------------------------------|
| GOOGLE_MAPS_API_KEY    | frontend environment.ts     | Browser-facing Google Maps JS API             |
| PORT                   | backend index.ts            | Express server port (default 3000)            |
| DATABASE_URL           | backend db/index.ts         | PostgreSQL connection string                  |
| JWT_SECRET             | backend auth.routes.ts      | JWT signing & verification                    |
| JWT_EXPIRES_IN         | backend auth.routes.ts      | JWT lifetime (1h; refresh tokens handle session) |
| CORS_ORIGIN            | backend index.ts            | Production frontend origin for CORS           |
| GOOGLE_SERVER_API_KEY  | backend geocode.routes.ts   | Server-side Google Geocoding (not exposed)    |
| STRAVA_CLIENT_ID       | backend strava.routes.ts    | Strava OAuth app client ID                   |
| STRAVA_CLIENT_SECRET   | backend strava.routes.ts    | Strava OAuth app client secret               |
| STRAVA_REDIRECT_URI    | backend strava.routes.ts    | OAuth callback URL (must match Strava app config) |

**Generated at build time:**
- `frontend/src/environments/environment.ts` — built from root .env via `generate-env.js` pre-build

## Backend Dependencies

**Source:** `backend/package.json`

### Production (runtime)

| Package            | Version   | Purpose                                         |
|--------------------|-----------|-------------------------------------------------|
| express            | ^4.18.2   | HTTP server framework                           |
| pg                 | ^8.11.0   | PostgreSQL driver (SSL support)                 |
| bcryptjs           | ^2.4.3    | Password hashing (12 salt rounds)               |
| jsonwebtoken       | ^9.0.0    | JWT generation & verification                   |
| cors               | ^2.8.5    | CORS middleware                                 |
| dotenv             | ^16.0.3   | Load .env into process.env                     |
| express-rate-limit | ^8.3.1    | Rate limiting (login 5/15m, register 3/h)       |

**Total: 7 core dependencies** (no HTTP client — Node built-ins used for Strava API calls)

### Development

| Package    | Version   | Purpose                         |
|------------|-----------|---------------------------------|
| jest       | ^29.7.0   | Test runner                     |
| ts-jest    | ^29.4.6   | TypeScript transpiler for Jest  |
| nodemon    | ^3.0.1    | Auto-reload on file changes     |
| ts-node    | ^10.9.1   | TypeScript execution (nodemon)  |
| supertest  | ^7.2.2    | HTTP mocking for route tests    |
| @types/*   | (various) | TypeScript definitions          |

## Frontend Dependencies

**Source:** `frontend/package.json`

### Production (runtime)

| Package                          | Version   | Purpose                          |
|----------------------------------|-----------|----------------------------------|
| @angular/core                    | ^17.3.12  | DI, signals, component decorators|
| @angular/common                  | ^17.3.12  | Common directives, pipes         |
| @angular/router                  | ^17.3.12  | Lazy route loading               |
| @angular/forms                   | ^17.3.12  | Template & reactive forms        |
| @angular/platform-browser        | ^17.3.12  | DOM rendering, bootstrapping     |
| @angular/platform-browser-dynamic| ^17.3.12  | Runtime compilation (ng serve)   |
| @angular/service-worker          | ^17.3.12  | PWA offline support              |
| @angular/animations              | ^17.3.12  | Animation engine                 |
| rxjs                             | ~7.8.0    | Observable streams               |
| tslib                            | ^2.3.0    | Angular runtime helpers          |
| zone.js                          | ~0.14.3   | Async tracking                   |

### Development

| Package                  | Version   | Purpose                          |
|--------------------------|-----------|----------------------------------|
| @angular/cli             | ^17.3.17  | Build & serve tooling            |
| @angular-devkit/build-angular | ^17.3.17 | Angular builder               |
| @angular/compiler-cli    | ^17.3.12  | Offline template compiler        |
| jest                     | ^29.7.0   | Test runner                      |
| jest-preset-angular      | ^14.4.0   | Angular test configuration       |
| jest-environment-jsdom   | ^29.7.0   | DOM environment for tests        |
| @types/*                 | (various) | TypeScript definitions           |

## Root Monorepo Configuration

**Source:** `package.json`

```json
{
  "workspaces": ["frontend", "backend"],
  "overrides": { "rxjs": "~7.8.0" },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "dotenv": "^16.0.3",
    "typescript": "5.4.5",
    "@playwright/test": "^1.44.0"
  }
}
```

**rxjs override:** Single version across workspaces (prevents peer dep conflicts)
**TypeScript:** Pinned 5.4.5 (not ^) for reproducible builds
**@playwright/test:** E2E testing via `npm run test:e2e`

## Build Process

### Frontend: `npm run build:frontend`
```
1. node generate-env.js → writes frontend/src/environments/environment.ts
2. ng build → compile, minify, tree-shake → frontend/dist/
3. Emits ngsw-worker.js (PWA manifest)
4. Deploy: Netlify auto-deploys frontend/dist/
```

### Backend: `npm run build:backend`
```
1. tsc → backend/dist/*.js
2. Deploy: Render starts backend/dist/index.js
```

## Testing Configuration

### Backend (Jest)
```json
{
  "testEnvironment": "node",
  "transform": { "^.+\\.ts$": ["ts-jest", {"tsconfig": "tsconfig.test.json"}] },
  "collectCoverageFrom": ["src/**/*.ts", "!src/db/schema.sql"]
}
```

### Frontend (Jest)
- Preset: `jest-preset-angular@14.4.0`
- Environment: `jsdom`
- Setup: `setup-jest.ts` (manual TestBed init — does NOT import preset setup)
- `tsconfig.spec.json` types: `["jest"]` NOT jasmine
- **Critical:** `TestBed.resetTestingModule()` before each `configureTestingModule()`
- **Critical:** Use `provideHttpClient()` + `provideHttpClientTesting()` (NOT HttpClientTestingModule)
- **Critical:** Use `provideRouter([])` (NOT RouterTestingModule)

### E2E (Playwright)
- Config: `playwright.config.ts` (root)
- Tests: `e2e/` directory
- Commands: `test:e2e`, `test:e2e:mobile`, `test:e2e:debug`, `test:e2e:headed`

## External Services

| Service            | Used By       | Auth Method           | Notes                              |
|--------------------|---------------|-----------------------|------------------------------------|
| Google Maps JS API | Frontend      | API key (browser)     | Restricted by HTTP referrer        |
| Google Geocoding   | Backend proxy | API key (server)      | GOOGLE_SERVER_API_KEY, not exposed |
| Strava OAuth 2.0   | Backend       | Client ID + Secret    | State token in process memory      |
| Strava REST API    | Backend proxy | User's access token   | GET /api/users/strava/activities   |
| PostgreSQL         | Backend       | DATABASE_URL          | Render managed, SSL enabled        |

## Script Commands Reference

```bash
npm run dev              # Start frontend (4201) + backend (3000) concurrently
npm run build:frontend   # Gen env + Angular build
npm run build:backend    # TypeScript compile
npm run test             # Jest on both workspaces
npm run test:backend     # Jest backend only
npm run test:frontend    # Jest frontend only
npm run test:e2e         # Playwright E2E suite
npm run test:e2e:mobile  # Playwright mobile viewport
npm run test:e2e:debug   # Playwright debug mode
```

## Version Pinning Strategy

| Package             | Strategy   | Reason                               |
|---------------------|------------|--------------------------------------|
| typescript          | 5.4.5 exact| Breaking TS versions → build issues  |
| jest                | ^29.7.0    | 29.x stable, avoid major bump        |
| jest-preset-angular | ^14.4.0    | Tied to Angular 17.x                 |
| @angular/*          | ^17.3.x    | Minor safe, major = rewrite          |
| rxjs                | ~7.8.0     | Peer dep control (overridden at root)|

## Related Codemaps
- [architecture.md](architecture.md) — Deployment targets
- [backend.md](backend.md) — Environment usage (JWT_SECRET, STRAVA_*, DATABASE_URL)
- [frontend.md](frontend.md) — Environment usage (apiUrl, googleMapsApiKey)
