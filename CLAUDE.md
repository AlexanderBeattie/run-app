# Project: KLUB — Run Club Discovery Platform

**Stack:** Angular 17 (standalone) · Node/Express · PostgreSQL
**Phase:** Phase 4 — Deployment Readiness (see `tasks/todo.md`)

---

## Orchestration

- Enter plan mode for any task touching 3+ files or crossing frontend/backend boundary
- Delegate to subagents; inject relevant CODEMAPS context explicitly
- Never mark done without running `/verify` or `/tdd`

| Domain | Agent | Context File |
| :--- | :--- | :--- |
| Angular/UI | `typescript-reviewer` | `docs/CODEMAPS/frontend.md` |
| Node/API | `typescript-reviewer` | `docs/CODEMAPS/backend.md` |
| Database | `database-reviewer` | `docs/CODEMAPS/data.md` |
| Testing | `tdd-guide` | `tasks/lessons.md` |
| Full-stack | `/multi-execute` | both frontend + backend |

---

## Hard Rules [DO NOT DEVIATE]

**Frontend**
- Angular 17 standalone only — no NgModules
- Signals for state, `inject()` for DI, inline templates/styles
- Static routes before parameterised routes in router config

**Backend**
- Node / Express / PostgreSQL
- DB migrations: manual SQL files in `backend/src/db/` (numbered migration-00N.sql)
- `schema.sql` is canonical for fresh installs only — never run against existing prod DB

**Testing**
- Jest 29 throughout; see `tasks/lessons.md` for exact setup — do not modify `setup-jest.ts` or `jest.config.js`
- No `HttpClientTestingModule` — use `provideHttpClient()` + `provideHttpClientTesting()`
- No `RouterTestingModule` — use `provideRouter([])`
- Every spec: `TestBed.resetTestingModule()` before `configureTestingModule()`

---

## Key Files

| File | Purpose |
| :--- | :--- |
| `tasks/todo.md` | Absolute source of truth for sprint work |
| `tasks/lessons.md` | Hard-won patterns — read before touching tests or routing |
| `tasks/roadmap.md` | Post-launch roadmap (not auto-loaded) |
| `docs/CODEMAPS/INDEX.md` | Codebase map index |

---

## Continuous Learning

- After fixing a complex bug: run `/learn-eval` and update `tasks/lessons.md`
- After a correction from the user: update `tasks/lessons.md` with the pattern
