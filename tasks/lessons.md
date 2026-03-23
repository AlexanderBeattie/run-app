# KLUB — Lessons Learned

## Angular + Jest
- jest-preset-angular must match jest major version (both on 29)
- jest-environment-jsdom must also match (29.x)
- @angular-builders/jest must match Angular major (17.x)
- Do NOT use HttpClientTestingModule — use provideHttpClient() + provideHttpClientTesting()
- Do NOT use RouterTestingModule — use provideRouter([])
- Every spec needs TestBed.resetTestingModule() before TestBed.configureTestingModule()
- setup-jest.ts must NOT import jest-preset-angular/setup-jest (zone.js patching conflict)
- Manual setup: import zone.js, @angular/compiler, call TestBed.initTestEnvironment()
- @types/jasmine conflicts with @types/jest — remove jasmine types entirely
- tsconfig.spec.json types must be ["jest"] not ["jasmine"]
- Frontend jest.config.js uses setupFiles (not setupFilesAfterSetup or setupFilesAfterFramework)
- Do not use any type's where possible

## Angular routing
- Static routes (clubs/create, clubs/create-run) MUST come before parameterised (clubs/:id)
- Angular evaluates routes top-down, first match wins
- Lazy loading: loadComponent: () => import(...).then(m => m.ComponentName)

## Angular standalone patterns
- No NgModules — everything is standalone: true
- provideRouter([]) for test routing
- provideHttpClient() + withInterceptors([...]) in app.config.ts
- inject() function instead of constructor injection

## Monorepo
- npm workspaces hoist dependencies — version conflicts between workspaces cause resolution failures
- Nuclear option: rm -rf node_modules in root + both workspaces, then npm install --legacy-peer-deps from root
- Backend and frontend Jest configs are independent — version mismatches cause jest-util/ts-jest errors
- Root package.json scripts delegate to workspaces: npm run test --workspace=frontend

## Security
- Never trust frontend for ownership/permission checks
- Geocoding proxied through backend — API key in browser fetch URL is visible in network tab
- Google Maps JS API key in environment.ts is inherently exposed — mitigate with HTTP referrer restrictions
- Separate API keys for client-side (referrer restricted) and server-side (IP restricted)
- Backend validates club ownership before attaching runs: fetch club from DB, check owner_id matches user

## Database
- club_members.role supports 'member' | 'organizer' | 'owner' but only 'owner' is enforced currently
- run_events.club_id is nullable — independent runs have null club_id
- Always validate club ownership in backend before attaching runs
- Migrations are manual SQL files (no Prisma/Knex yet) — run with psql

## Deployment
- Frontend: Netlify, build command includes node ../generate-env.js
- Backend: Render, Node service
- environment.ts is gitignored and generated at build time from env vars
- CORS_ORIGIN env var must match production frontend URL
- _redirects file in frontend/public handles SPA routing on Netlify

## Token / session efficiency (CRITICAL — read before starting any session)

**One feature per session.** Implementing multiple components in a single session compounds context cost exponentially. Each file read is carried by every subsequent token. Start a new session after each distinct feature is complete.

**Use subagents for file-heavy work.** Exploring services, reading models, scanning routes — offload this to a subagent. It gets its own context window and returns a summary, not the raw file content. Main context stays clean.

**Targeted edits over full rewrites.** Describe the delta: "add X method to Y component". Never "rewrite the whole component with X added". The model should only generate what changed, not regenerate unchanged lines.

**Trust CLAUDE.md instead of reading files.** API endpoints, service method signatures, model shapes, and file locations are documented in CLAUDE.md. Do not read `runs.service.ts` or `club.service.ts` just to check a method signature — look it up in CLAUDE.md first. Only read the file if CLAUDE.md is ambiguous or silent.

**Angular inline templates inflate cost.** Every component in this project has template + styles inline (200-600 lines). Reading a component to understand it costs 3-5× more than a project with separate .html/.css files. Be selective — only read the file if you need to edit it.

**Compacted sessions have a high baseline.** Resuming from a compacted summary already costs tokens before any work starts. Keep tasks small so the session ends before compaction is needed.

**Rule of thumb:** if a task touches more than 3 files, split it into multiple sessions or delegate file reads to subagents.

## Common issues
- "Cannot configure the test module when already instantiated" → add TestBed.resetTestingModule() in beforeEach
- "Cannot find module jest-preset-angular/setup-jest" → version mismatch or zone.js conflict, use manual setup
- "Cannot find module jest-util" → nuclear reinstall needed (rm -rf all node_modules + package-lock)
- Route matching wrong component → check route ordering (static before param)
- 500 on /api/clubs/create-run → clubs/:id is catching "create-run" as an ID