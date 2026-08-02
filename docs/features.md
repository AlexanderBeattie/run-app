# KLUB Features Inventory

**Last Updated:** 2026-03-29
**Phase:** 6a — Strava Integration Sprint

---

## How to Read This Document

| Column | Description |
|--------|-------------|
| **Status** | `Stable` = shipped & tested · `In-Progress` = continuation item or known blocker pending |
| **Effort** | `S` = small (1–2 files) · `M` = medium (3–5 files, some integration) · `L` = large (6+ files, cross-cutting) |
| **Blocking Dependencies** | Only shown for In-Progress features |
| **Related Endpoints** | Links to `docs/CODEMAPS/backend.md` route tree |

---

## 1. Authentication & Security

| Feature | Status | Effort | Related Endpoints |
|---------|--------|--------|-------------------|
| User registration (email + password) | Stable | M | `POST /api/auth/register` |
| User login | Stable | S | `POST /api/auth/login` |
| Logout (server-side token revocation) | Stable | S | `POST /api/auth/logout` |
| JWT access token (1h expiry) | Stable | M | All authenticated endpoints |
| Refresh token (30-day, hashed in DB) | Stable | M | `POST /api/auth/refresh` |
| Proactive token refresh (60 s buffer, HTTP interceptor) | Stable | M | `POST /api/auth/refresh` |
| 401 auto-logout (interceptor redirect to `/login`) | Stable | S | — |
| Forgot-password flow (email reset link) | Stable | M | `POST /api/auth/forgot-password` |
| Reset-password flow (token consumed, one-time) | Stable | M | `POST /api/auth/reset-password` |
| Role-based routing (runner vs organizer) | Stable | S | — (guard-only, no API call) |
| `authGuard` — blocks unauthenticated access | Stable | S | — |
| `organizerGuard` — blocks runner-role from organizer routes | Stable | S | — |
| Rate limiting — login (5 / 15 min) | Stable | S | `POST /api/auth/login` |
| Rate limiting — register (3 / hour) | Stable | S | `POST /api/auth/register` |
| Rate limiting — general API (100 / 15 min) | Stable | S | All routes |

---

## 2. Run Discovery & Browsing

| Feature | Status | Effort | Related Endpoints |
|---------|--------|--------|-------------------|
| Home feed — paginated run list | Stable | L | `GET /api/runs` |
| Full-text search (title, club name, address) | Stable | M | `GET /api/runs?search=` |
| Filter by pace | Stable | S | `GET /api/runs?pace=` |
| Filter by distance (min km) | Stable | S | `GET /api/runs?distance_min=` |
| Filter by date (today / tomorrow / this week) | Stable | S | `GET /api/runs?date=` |
| Filter by city | Stable | S | `GET /api/runs?city=` |
| Filter by club | Stable | S | `GET /api/runs?club_id=` |
| Filter by run type (club_run, parkrun, trail, etc.) | Stable | S | `GET /api/runs?run_type=` |
| Filter by tags | Stable | S | `GET /api/runs?tags=` |
| Trending runs (next 72 h, ranked by attendee count) | Stable | S | `GET /api/runs?trending=1` |
| Home feed filter pills (UI) | Stable | M | `GET /api/runs` |
| Clickable tag chips on home feed (client-side tag filter) | Stable | S | — (frontend-only) |
| Featured clubs section (home) | Stable | M | `GET /api/clubs` |
| Run detail dialog (bottom sheet) | Stable | M | `GET /api/runs/:id` |
| Weather forecast on run detail | Stable | M | `GET /api/runs/:id/weather` |
| Attendee list on run detail | Stable | S | `GET /api/runs/:id/attendees` |
| Clickable attendee avatars → runner profile modal | Stable | M | `GET /api/users/:id/profile` |
| Kit checklist on run detail | Stable | S | — (frontend-only) |
| "Next run by this club" footer on run detail | Stable | S | `GET /api/clubs/:id/runs` |
| "Open in Maps" link from run detail | Stable | S | — (frontend deep-link) |

---

## 3. Map View

| Feature | Status | Effort | Related Endpoints |
|---------|--------|--------|-------------------|
| Interactive Google Maps view of all runs | Stable | L | `GET /api/runs` |
| Marker clustering (Google MarkerClusterer) | Stable | M | — |
| Click marker → run detail dialog | Stable | S | `GET /api/runs/:id` |
| Geolocation (current position via `navigator.geolocation`) | Stable | S | — |
| Geo-filter — distance sorting from user location (Haversine) | Stable | M | `GET /api/runs` |
| Server-side geocoding proxy (address → lat/lng) | Stable | S | `GET /api/geocode?address=` |

---

## 4. Run Participation

| Feature | Status | Effort | Related Endpoints |
|---------|--------|--------|-------------------|
| Join a run | Stable | S | `POST /api/runs/:id/join` |
| Unjoin a run (toggle) | Stable | S | `POST /api/runs/:id/join` |
| View joined runs on profile | Stable | M | `GET /api/runs/joined` |
| Social proof badges (live attendee count) | Stable | S | `GET /api/runs` (json_agg) |
| Link Strava activity to a past run | Stable | L | `POST /api/runs/:id/link-strava` |
| "Link Strava Run" button (past runs only, if attended) | Stable | M | `GET /api/users/strava/activities` |
| Strava icon on run card if activity is linked | Stable | S | — (frontend-only) |
| Auto-suggest matching Strava run by date | In-Progress | M | `GET /api/users/strava/activities` · **Blocked by:** matching algorithm not yet implemented |

---

## 5. Run Management (Organizer)

| Feature | Status | Effort | Related Endpoints |
|---------|--------|--------|-------------------|
| Create run — 4-step wizard (details, logistics, schedule, vibe) | Stable | L | `POST /api/runs` |
| Geocode start / end address on blur | Stable | S | `GET /api/geocode?address=` |
| Edit run | Stable | M | `PATCH /api/runs/:id` |
| Delete run | Stable | S | `DELETE /api/runs/:id` |
| Cancel run (status → cancelled) | Stable | S | `PATCH /api/runs/:id` |
| Organizer dashboard — list of my runs (active / past filter) | Stable | M | `GET /api/runs/mine` |
| Organizer dashboard — run card carousel | Stable | M | — |
| View / manage run attendees (dialog) | Stable | M | `GET /api/runs/:id/attendees` |
| Post-run share card (Canvas API + Web Share API) | Stable | M | — (frontend-only) |
| Pace-aware estimated duration on create-run form | Stable | S | — (frontend-only) |
| Run type selection and badge display | Stable | S | `POST /api/runs` · `PATCH /api/runs/:id` |
| Associate run with owned club (dropdown) | Stable | M | `GET /api/clubs/owned` · `POST /api/runs` |

---

## 6. Club Management

| Feature | Status | Effort | Related Endpoints |
|---------|--------|--------|-------------------|
| Browse all clubs | Stable | M | `GET /api/clubs` |
| Client-side club search & filter (name, city, pace, tags) | Stable | M | `GET /api/clubs` |
| Club profile page (info, runs, members) | Stable | M | `GET /api/clubs/:id` · `GET /api/clubs/:id/runs` · `GET /api/clubs/:id/members` |
| Create club (name, description, city, pace, tags) | Stable | M | `POST /api/clubs` |
| Live branding preview on create-club form | Stable | S | — (frontend-only) |
| Edit club | Stable | M | `PATCH /api/clubs/:id` |
| Join a club | Stable | S | `POST /api/clubs/:id/join` |
| Leave a club (toggle — owner cannot leave) | Stable | S | `POST /api/clubs/:id/join` |
| Club member list | Stable | S | `GET /api/clubs/:id/members` |
| Organizer dashboard — list of my clubs | Stable | M | `GET /api/clubs/mine` |
| Social proof — verified club checkmarks | Stable | S | `GET /api/clubs` |
| Club member role (member / organizer / owner) | Stable (partial) | S | — · **Note:** schema supports 3 roles; only `owner` enforced in API authorization |

---

## 7. Social & Profile

| Feature | Status | Effort | Related Endpoints |
|---------|--------|--------|-------------------|
| Runner profile page (own profile) | Stable | M | `GET /api/users/:id/profile` |
| Public runner profile modal (clickable attendee avatars) | Stable | M | `GET /api/users/:id/profile` |
| Display run stats on profile | Stable | M | `GET /api/users/:id/profile` |
| Verified pace (calculated from linked Strava activities) | Stable | M | `GET /api/users/:id/profile` |
| Orange Strava verification checkmark on profile | Stable | S | — (frontend-only) |
| Settings menu (accessible from profile) | Stable | S | — |
| Strava connected status indicator | Stable | S | — (reads `strava_connected` from user object) |
| Polyline graphic on run list items (profile) | Stable | M | — |

---

## 8. Strava Integration

| Feature | Status | Effort | Related Endpoints |
|---------|--------|--------|-------------------|
| "Connect with Strava" button (official branding) | Stable | S | `GET /api/strava` |
| Strava OAuth 2.0 flow (redirect → callback → token storage) | Stable | L | `GET /api/strava` · `GET /api/strava/callback` |
| CSRF protection on OAuth state token | Stable | S | `GET /api/strava` · `GET /api/strava/callback` |
| Fetch user's recent Strava runs (proxy) | Stable | M | `GET /api/users/strava/activities` |
| Strava activity selector modal | Stable | M | `GET /api/users/strava/activities` |
| Link Strava activity → save stats to run record | Stable | M | `POST /api/runs/:id/link-strava` |
| Verified pace calculation from linked activities | Stable | M | `GET /api/users/:id/profile` |
| Automatic Strava access token refresh | Stable | M | `GET /api/users/strava/activities` · `ensureFreshStravaToken()` in users.routes.ts |
| Disconnect Strava (clear tokens + Strava deauth) | In-Progress | M | — · **Blocked by:** no endpoint or UI built yet |
| Strava webhooks (automated activity sync) | In-Progress | L | — · **Blocked by:** `strava_webhooks` table exists (migration-005) but application logic not implemented |

> **Security note:** Strava OAuth state token is stored in process memory — not suitable for multi-instance deployments.
> Strava access/refresh tokens are stored in plaintext — consider encrypting at rest.

---

## 9. User Experience & UI Infrastructure

| Feature | Status | Effort | Related Endpoints |
|---------|--------|--------|-------------------|
| Signal-driven toast notifications | Stable | S | — |
| Bottom navigation bar (4 tabs, conditionally shown) | Stable | S | — |
| Onboarding wizard (3-screen, localStorage, shown once) | Stable | M | — |
| Confirm / destructive action modal | Stable | S | — |
| Run card component (reusable, home / profile / clubs) | Stable | M | — |
| Spots remaining indicator on run card (X / Y spots filled) | Stable | S | — (frontend-only) |
| Run card carousel (organizer dashboard) | Stable | S | — |
| Lazy-loaded routes (all feature routes) | Stable | S | — |
| Accessibility improvements (ARIA, contrast, keyboard nav) | Stable | M | — |
| Dynamic SVG route art on run cards | Stable | M | — |

---

## 10. Technical Capabilities

| Feature | Status | Effort | Related Endpoints |
|---------|--------|--------|-------------------|
| Angular 17 standalone component architecture | Stable | — | — |
| Signals-based state management | Stable | — | — |
| HTTP interceptor (JWT attach + 401 handling) | Stable | M | All authenticated routes |
| PostgreSQL schema (5 core tables, 6 migrations) | Stable | L | All routes |
| Monorepo with npm workspaces | Stable | S | — |
| Open-Meteo weather proxy (no API key required) | Stable | S | `GET /api/runs/:id/weather` |
| Google Maps JS API integration | Stable | M | — |
| Google Geocoding API (server-side proxy, key not exposed) | Stable | S | `GET /api/geocode?address=` |
| Health check endpoint | Stable | S | `GET /api/health` |
| Frontend build pipeline (`generate-env.js` → `ng build`) | Stable | S | — |
| Jest test suite (backend + frontend) | Stable | M | — |
| Frontend deployment (Netlify) | Stable | S | — |
| Backend deployment (Render) | Stable | S | — |
| PWA service worker (`ngsw-worker.js`) | In-Progress | M | — · **Blocked by:** intermittent 404 on Netlify; manifest occasionally not served correctly |

---

## Known Issues

These affect Stable features but have not yet blocked primary use cases:

| Issue | Affected Feature | Severity |
|-------|-----------------|----------|
| PWA service worker: intermittent 404 on `ngsw-worker.js` | PWA / Offline | Medium |
| PWA manifest not always served on Netlify | PWA / Offline | Medium |
| `club_members.role` supports 3 values but only `owner` is enforced in API authorization | Club member roles | Low |
| Strava OAuth state stored in process memory (not multi-instance safe) | Strava OAuth | Medium |
| Strava tokens stored in plaintext (not encrypted at rest) | Strava Integration | Medium |
| No frontend error boundary (errors bubble to blank screen) | All features | Low |
| `json_agg(attendees)` no pagination — expensive for large runs | Run Attendees | Low |
| `ILIKE` filters lack full-text index | Run Search | Low |

---

## In-Progress Summary

| Feature | Phase | Blocking |
|---------|-------|---------|
| Automatic Strava token refresh | 6a continuation | Token-refresh middleware not built |
| Disconnect Strava button | 6a continuation | No endpoint or UI |
| Auto-suggest Strava run match by date | 6a continuation | Matching algorithm not implemented |
| Strava webhooks (automated sync) | 6a continuation / future | Application logic not implemented |
| PWA service worker stability | Phase 4 / deployment | Netlify config for `ngsw-worker.js` |

---

## Related Codemaps

| Document | Contents |
|----------|---------|
| [docs/CODEMAPS/backend.md](CODEMAPS/backend.md) | All API endpoints with request/response specs |
| [docs/CODEMAPS/frontend.md](CODEMAPS/frontend.md) | Component hierarchy, routes, services |
| [docs/CODEMAPS/data.md](CODEMAPS/data.md) | Database schema, migrations, query patterns |
| [docs/CODEMAPS/architecture.md](CODEMAPS/architecture.md) | System overview, deployment targets |
| [tasks/todo.md](../tasks/todo.md) | Active sprint tasks and completion status |
| [tasks/roadmap.md](../tasks/roadmap.md) | Post-launch planned features (not auto-loaded) |
