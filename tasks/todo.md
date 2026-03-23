# KLUB — Task Queue

## Status: Phase 4 — Deployment Readiness

> Full post-launch roadmap → `tasks/roadmap.md` (not loaded automatically)

---

## Active Sprint: Phase 4

### Security (blockers before public launch)
> Context: zero file reads — all external config; trust CLAUDE.md for env var names
- [ ] Google Maps API key: add HTTP referrer restrictions in Google Cloud Console
- [ ] Google Maps API key: restrict to Maps JS + Geocoding + Directions APIs only
- [ ] Backend geocode key: add server IP restriction (Render static IP or proxy)
- [ ] Run migration-001.sql on production database (clubs, club_members, pace/tags columns)
- [ ] Run migration-002.sql on production database (refresh_tokens table)
- [ ] Schedule periodic cleanup of expired refresh tokens on Render (daily cron → `npm run db:cleanup-tokens`)
- [ ] Audit CORS_ORIGIN in production env — must be exact Netlify URL, not wildcard

### PWA
> Context: read `angular.json` + `ngsw-config.json` only
- [ ] Fix ngsw-worker.js 404 (Netlify serving issue)
- [ ] Fix manifest.webmanifest not served correctly
- [ ] KLUB branded icons (192×192, 512×512, maskable variant)
- [ ] Custom install-to-homescreen prompt banner

### Maps API cleanup
> Context: read `run-organiser-dialog.component.ts` + `map-view.component.ts` only
- [ ] run-organiser-dialog.component.ts: migrate `google.maps.Marker` → `AdvancedMarkerElement`
- [ ] Check DirectionsService for deprecation warnings

### Infra checks
> Context: zero file reads — external verification only
- [ ] Verify Render backend auto-deploys from main
- [ ] Verify Netlify build pipeline runs generate-env.js correctly
- [ ] Smoke test all API endpoints against production DB after migration

### Auth (next session — password reset flow)
> Context: read `auth.routes.ts` + `backend/src/db/schema.sql` + `tasks/lessons.md`
- [ ] `POST /api/auth/forgot-password` — generate time-limited reset token, store hashed in DB, send email
- [ ] `POST /api/auth/reset-password` — validate token, update password hash, invalidate token
- [ ] Frontend: ForgotPasswordComponent + ResetPasswordComponent (standalone, lazy loaded)

---

## Completed

- [x] Phase 1–2: full feature set (runs, clubs, maps, geocoding, toasts, nav, ownership)
- [x] Phase 3a: test coverage (12 suites / 109 tests, all green)
- [x] Phase 3b–e: form validation, toasts, organiser dashboard, UI polish
- [x] Phase 3f: discovery feed (backend + frontend — carousels, badges, weather, Web Share)
- [x] Phase 4 security hardening (backend):
  - Rate limiting middleware (login 5/15min, register 3/hr, API 100/15min, AI 10/min)
  - Auth rewrite: password validation (8–128 chars), email validation, role locked to runner on register
  - JWT expiry set to 1h (was 7d)
  - Refresh token system: `refresh_tokens` table (hashed, 30d expiry), `/auth/refresh` + `/auth/logout` endpoints
  - Token revocation on logout (DB delete)
  - migration-002.sql run locally
  - Expired token cleanup: `cleanup-expired-tokens.sql` + `npm run db:cleanup-tokens` script
  - 87 backend tests passing (5 suites)
- [x] Phase 4 security hardening (frontend):
  - AuthService: stores `refreshToken` + `expiresIn`, `isTokenExpired()` with 60s buffer, `refresh()` observable, logout invalidates server-side token
  - JWT interceptor: proactive refresh before expiry, skips `/auth/` routes, force-logout on refresh failure
