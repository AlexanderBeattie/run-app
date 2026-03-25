# KLUB — Task Queue

## Status: Phase 4 — Deployment Readiness

> Full post-launch roadmap → `tasks/roadmap.md` (not loaded automatically)

---

## Active Sprint: Phase 4

### Security — blockers before public launch
> Context: zero file reads — all external config; trust CLAUDE.md for env var names
- [ ] Google Maps API key: add HTTP referrer restrictions in Google Cloud Console
- [ ] Google Maps API key: restrict to Maps JS + Geocoding + Directions APIs only
- [ ] Backend geocode key: add server IP restriction (Render static IP or proxy)
- [ ] Run migration-001.sql on production DB (club_members table, clubs pace/tags/city/logo_url columns, run_events pace/tags columns)
- [ ] Run migration-002.sql on production DB (refresh_tokens table)
- [ ] Run migration-003.sql on production DB (password_reset_tokens table)
- [ ] Run migration-004.sql on production DB (run_events run_type column)
- [ ] Schedule periodic cleanup of expired refresh tokens on Render (daily cron → `npm run db:cleanup-tokens`)
- [ ] Audit CORS_ORIGIN in production env — must be exact Netlify URL, not wildcard

> Note: `schema.sql` is now canonical (includes all migrations). Use for fresh installs only — run individual migration files against an existing production DB.

### PWA
> Context: read `angular.json` + `ngsw-config.json` only
- [ ] Fix ngsw-worker.js 404 (Netlify serving issue)
- [ ] Fix manifest.webmanifest MIME type not served correctly on Netlify
- [ ] KLUB branded icons (192×192, 512×512, maskable variant)
- [ ] Custom install-to-homescreen prompt banner

### Infra
> Context: zero file reads — external verification only
- [ ] Verify Render backend auto-deploys from main
- [ ] Verify Netlify build pipeline runs generate-env.js correctly
- [ ] Smoke test all API endpoints against production DB after migrations

---

## Completed

### Phase 4 — Deployment Readiness

- [x] **Security hardening (backend):** rate limiting (login 5/15min, register 3/hr, API 100/15min), password validation (8–128 chars), email validation, role locked to runner on register, JWT expiry 1h (was 7d), refresh token system (`refresh_tokens` table, hashed, 30d expiry), `/auth/refresh` + `/auth/logout` endpoints, token revocation on logout, expired token cleanup script (`npm run db:cleanup-tokens`) — 87 backend tests, 5 suites green
- [x] **Security hardening (frontend):** AuthService stores `refreshToken` + `expiresIn`, `isTokenExpired()` with 60s buffer, `refresh()` observable, logout invalidates server-side token; JWT interceptor — proactive refresh before expiry, skips `/auth/` routes, force-logout on refresh failure
- [x] **Password reset:** `POST /api/auth/forgot-password` + `POST /api/auth/reset-password` (hashed token, time-limited, used flag); ForgotPasswordComponent + ResetPasswordComponent (standalone, lazy loaded); migration-003.sql
- [x] **Maps API:** `google.maps.Marker` → `AdvancedMarkerElement` in run-organiser-dialog; DirectionsService v2 confirmed valid, no deprecation
- [x] **DB schema consolidated:** schema.sql now canonical — all migrations 001–004 included, constraints on role/status/run_type, 11 indexes added
- [x] **Seed script** (`backend/src/db/seed.ts`): 5 users, 2 clubs, 7 runs (all run_types covered), 14 attendee registrations — `npm run db:seed` from root or backend; migrations 003 + 004 applied locally

### Phase A1 — Ahead of schedule

- [x] **run_type end-to-end:** migration-004.sql, backend filter/CRUD, frontend model + service, RunCard chip, CreateRun selector, HomeComponent filter pills — 110 tests green

### Phases 1–3

- [x] **Phase 1–2:** full feature set — runs, clubs, maps, geocoding, toasts, nav, ownership
- [x] **Phase 3a:** test coverage — 12 suites / 109 tests, all green
- [x] **Phase 3b–e:** form validation, toasts, organiser dashboard, UI polish
- [x] **Phase 3f:** discovery feed — carousels, badges, weather, Web Share API
