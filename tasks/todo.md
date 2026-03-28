# KLUB — Task Queue

## Status: Phase 6a — Strava Integration Sprint

> Full post-launch roadmap → `tasks/roadmap.md` (not loaded automatically)

---

## Active Sprint: Phase 6a — Strava Integration

### 1. Database Schema & Migrations
> Context: `backend/src/db/` (new migration file) + `schema.sql`
- [x] Create `migration-005.sql` to add Strava columns to `users`: `strava_athlete_id` (BIGINT), `strava_access_token` (TEXT), `strava_refresh_token` (TEXT), `strava_token_expires_at` (BIGINT).
- [x] Add Strava columns to `run_attendees`: `strava_activity_id` (BIGINT), `strava_distance` (FLOAT), `strava_moving_time` (INT), `strava_average_speed` (FLOAT), `strava_polyline` (TEXT).
- [x] Update `schema.sql` to reflect these new columns.
- [x] **Continuation:** Create a dedicated `strava_webhooks` table to handle future automated activity syncing via Strava's Webhook API.

### 2. OAuth 2.0 Flow (Backend)
> Context: `auth.routes.ts` + `users.routes.ts`
- [x] Add `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` to `.env.example` and backend config.
- [x] Create `GET /api/auth/strava` which redirects the user to Strava's OAuth authorize URL requesting `activity:read` scope.
- [x] Create `GET /api/auth/strava/callback` to handle the return redirect, exchange the `code` for tokens via `POST https://www.strava.com/api/v3/oauth/token`, and save them to the authenticated user's DB record.
- [ ] **Continuation:** Implement a token-refresh middleware that automatically refreshes the `strava_access_token` if `strava_token_expires_at` has passed.

### 3. Connect Strava UI (Frontend)
> Context: `runner-profile.component.ts` (or settings view) + `auth.service.ts`
- [x] Add a "Connect with Strava" button (using official Strava branding/orange `#FC4C02`).
- [x] Wire the button to hit the new `GET /api/auth/strava` endpoint.
- [x] Display a "Connected to Strava" success state if the current user profile has a `strava_athlete_id`.
- [ ] **Continuation:** Add a "Disconnect Strava" button that clears the tokens from the DB and revokes access via Strava's deauthorization endpoint.

### 4. Fetch & Link Activities (Full-Stack)
> Context: `runs.routes.ts` + `run-detail-dialog.component.ts` + new `strava-selector-modal.component.ts`
- [x] **Backend:** Create `GET /api/users/strava/activities` that proxies to `https://www.strava.com/api/v3/athlete/activities?per_page=10` using the user's stored token. Filter for `type === 'Run' || type === 'TrailRun'`.
- [x] **Backend:** Create `POST /api/runs/:id/link-strava` to save the selected `activity_id` and stats (`distance`, `moving_time`, `average_speed`, `map.summary_polyline`) to the user's `run_attendees` row.
- [x] **Frontend:** In `run-detail-dialog`, if the run is in the past and the user attended, show a "Link Strava Run" button.
- [x] **Frontend:** Build a modal that fetches and lists the recent Strava runs. Clicking one saves the link via the new POST endpoint.
- [ ] **Continuation:** Auto-suggest the correct Strava run by comparing the KLUB `event_date` to the Strava `start_date_local`.

### 5. Verified Profile Stats (Frontend)
> Context: `runner-profile-dialog.component.ts` + `users.routes.ts`
- [x] **Backend:** Update the `GET /api/users/:id/profile` endpoint. If the user has linked Strava runs, calculate their true average pace (`(1000 / average_speed) / 60`) from the `run_attendees` data and pass it as `verified_pace`.
- [x] **Frontend:** Update the profile card to display the "Verified Pace" with an orange Strava verification checkmark.
- [x] **Frontend:** In the "Recent Runs" list, add a small Strava icon next to runs that have linked data.
- [ ] **Continuation:** Display the linked Strava polyline snippet as a tiny background graphic on the recent run list items.

---

## Completed

### Phase 4d — High-Impact UX Sprint
- [x] Club Search & Filter (client-side matching name, city, pace, tags)
- [x] Social Proof Badges (live attendee counts, verified club checkmarks)
- [x] Run Detail Upgrades (kit checklists, next run by club footer)
- [x] Post-Run Share Card (Canvas API image generation, Web Share API integration)
- [x] Geo-Filter (navigator.geolocation + Haversine distance sorting)
- [x] Runner Profile Cards (clickable avatars, profile API endpoint, polished modal)

### Phase 4c — Visual Enhancement Sprint
- [x] Pace + tags on create-run form
- [x] Standardise club pace field format to labels
- [x] Pace-aware estimated duration on create-run form
- [x] Pace hint label on create-run form
- [x] Fix map zoom button hidden behind runs drawer
- [x] Verify organiser dashboard active / past run filtering
- [x] Inclusivity and accessibility improvements
- [x] Run card & detail dialog visual polish
- [x] Onboarding flow (3-screen wizard with localStorage)
- [x] "Open in Maps" + meeting point UX
- [x] Home feed filter pills
- [x] Featured clubs section on home

### Phase 4b — Run Card & UX Polish
- [x] Seed data (Glasgow-based runs)
- [x] Route art (dynamic SVG elevation)

### Phase 4 — Deployment Readiness
- [x] Security hardening (backend rate limiting, JWT expiry, refresh tokens)
- [x] Security hardening (frontend AuthService interceptors)
- [x] Password reset (Forgot/Reset password flow)
- [x] Maps API updates (AdvancedMarkerElement)
- [x] DB schema consolidated (schema.sql canonical)
- [x] Seed script initialized

### Phase A1 — Ahead of schedule
- [x] run_type end-to-end (enums, badges, filters)

### Phases 1–3
- [x] Core feature set, maps, geocoding, test coverage, discovery feed.