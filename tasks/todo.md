# KLUB — Task Queue

## Status: Phase 3 in progress — UI Polish & Deployment Prep

### What's done
- Phase 1: All tests passing, dev server boots clean
- Phase 2: Full feature set — runs, clubs, maps, geocoding, toasts, nav, ownership enforcement
- Phase 3a: Test coverage (12 suites, 109 tests, all green)
- Phase 3b: Form validation (inline errors on create-run + create-club)
- Phase 3c: Toasts wired to all actions (join/leave, create, cancel, delete)
- Phase 3d: Organiser dashboard redesign (logout via avatar dropdown, Upcoming/Past/Cancelled tabs)

---

## Active Sprint: Phase 3e — UI Polish (remaining)

### Must-have before deployment
- [ ] Mobile responsive audit — test all screens at 320px, fix overflow/wrapping issues
- [ ] Error states — all API-calling screens need a visible error message on failure (not just console)
  - HomeComponent (run feed)
  - ClubListComponent
  - ClubProfileComponent
  - OrganiserHomeComponent
  - RunnerProfileComponent
- [ ] Loading skeletons on club list + club profile (currently blank while loading)
- [ ] "Post as Club" label clarity on create-run — make it clear the run will appear under the club name

### Nice-to-have polish
- [ ] Visual distinction between club runs and independent runs on run cards (e.g. club tag chip)
- [ ] Edit-run page: pre-fill form from existing run data (currently unclear if this works end-to-end)
- [ ] Empty state illustration or icon on home feed when no runs match filters
- [ ] Confirm dialogs → replace browser `confirm()` with in-app modal (better mobile UX)

---

## Phase 3f: Discovery Feed

> Sprint-ready. All items are VIABLE NOW or VIABLE SOON — no new infrastructure required.

### Backend

- [ ] Update `GET /api/runs` SQL to `LEFT JOIN clubs ON run_events.club_id = clubs.id`, return `club_name`, `club_city`, and `club_created_at` in each run row — eliminates N+1 club lookups in `HomeComponent`
- [ ] Add `?trending=1` query param to `GET /api/runs` — sort by `(SELECT COUNT(*) FROM run_attendees WHERE run_id = run_events.id)` DESC, scoped to runs whose `event_date` is within the next 72h
- [ ] Add `GET /api/runs/:id/weather` endpoint — proxy Open-Meteo free API using `start_lat` + `start_lng` from the `run_events` row and the run's `event_date`; return `temperature_2m` + `weathercode`; no API key required

### Home Feed — `HomeComponent`

- [ ] Add horizontal clubs carousel above the run list — call existing `GET /api/clubs`, render as 64px initials circles in an `overflow-x: scroll` flex row; no logo images (initials from `club.name` only)
- [ ] Add "Trending" carousel section — add `trending` boolean to `RunsService.getRuns()` params, pass `?trending=1`, render results in a horizontal-scroll row of `RunCardComponent`
- [ ] Add "Happening This Weekend" carousel — compute the next Saturday and Sunday dates client-side (signal), pass as `?date_from=&date_to=` to a second `RunsService.getRuns()` call; render as horizontal carousel
- [ ] Add category quick-filter pills — render pill buttons: 5K · Trail · Shakeout · Race · Social — each appends the corresponding value to `?tags=` on `GET /api/runs`; active pill tracked in a `signal<string | null>`
- [ ] Add "My Clubs" feed toggle — add radio group "All Runs" / "My Clubs" above feed list; on "My Clubs" selection, fetch `GET /api/clubs/mine`, collect `club_id` array, re-fetch feed with `?club_ids=<ids>`; state in a `signal<'all' | 'mine'>`

### Run Cards — `RunCardComponent`

- [ ] Add facepile — display up to 3 overlapping 28px initials circles from `run.attendees[]`, derived from `attendee.display_name`; if `attendee_count > 3`, show `+N` label; requires attendees included in denormalized runs payload
- [ ] Add dynamic badges — "Filling Fast" if `attendee_count / max_attendees >= 0.8`; "Beginner Friendly" if `pace === 'easy'` or `tags` includes `'beginner'`; "New Club" if `club_created_at` is within 30 days; computed with `computed()` signal
- [ ] Add weather chip — call `GET /api/runs/:id/weather` on card render (with request deduplication), display temperature + WMO weather icon below the distance row; cache result in a component-level `signal`

### Run Detail — `RunDetailDialogComponent`

- [ ] Add Web Share button — call `navigator.share({ title: run.title, text: run.title, url: window.location.origin + '/runs/' + run.id })`; catch `NotSupportedError` and fall back to `navigator.clipboard.writeText(url)` + dispatch a "Link copied" toast via `ToastService`

---

## Phase 4: Deployment Readiness

### PWA
- [ ] Fix ngsw-worker.js 404 (Netlify serving issue)
- [ ] Fix manifest.webmanifest not served correctly
- [ ] KLUB branded icons (192×192, 512×512, maskable variant)
- [ ] Custom install-to-homescreen prompt banner

### Security (blockers before public launch)
- [ ] Google Maps API key: add HTTP referrer restrictions in Google Cloud Console
- [ ] Google Maps API key: restrict to Maps JS API + Geocoding API + Directions API only
- [ ] Backend geocode key: add server IP restriction (Render static IP or proxy)
- [ ] Run migration-001.sql on production database (clubs, club_members, pace/tags columns)
- [ ] Audit CORS_ORIGIN in production env — must be exact Netlify URL, not wildcard

### Maps API cleanup
- [ ] run-organiser-dialog.component.ts: migrate `google.maps.Marker` → `AdvancedMarkerElement`
- [ ] Check DirectionsService for deprecation warnings

### Infra checks
- [ ] Verify Render backend auto-deploys from main
- [ ] Verify Netlify build pipeline runs generate-env.js correctly
- [ ] Smoke test all API endpoints against production DB after migration

---

## Phase 5: Supabase Migration (post-launch)

Planned migration for scalability, real-time, and storage:
- [ ] Migrate PostgreSQL → Supabase (export + import schema + data)
- [ ] Swap JWT/bcrypt auth → Supabase Auth (handles refresh tokens, magic link, OAuth)
- [ ] Add Row Level Security (RLS) policies to replace backend ownership checks
- [ ] Use Supabase Storage for club logo uploads
- [ ] Subscribe to run_attendees inserts for real-time signup counts on organiser dashboard
- [ ] Replace manual migrations with Supabase migration tooling

**Note**: This is a significant undertaking — plan a dedicated sprint and test thoroughly before cutting over.

---

## Phase 5b: Discovery Feed Infrastructure

> These features were assessed as REQUIRES INFRASTRUCTURE — each is blocked on a prerequisite. Do not start until the prerequisite is complete.

- [ ] GPX route upload — **Prerequisite: Supabase Storage (Phase 5)**. Add `gpx_url TEXT` and `static_map_url TEXT` columns to `run_events`. Backend: `POST /api/runs/:id/gpx` accepts multipart upload, stores in Supabase bucket, generates static map image via Google Maps Static API, saves URL to DB.
- [ ] Post-run photo recaps — **Prerequisite: Supabase Storage (Phase 5)**. New `run_photos` table (`run_id`, `photo_url`, `caption`, `uploaded_at`). Backend: `POST /api/runs/:id/photos` accepts multipart, stores in Supabase bucket. Frontend: photo gallery on run detail after `event_date` has passed.
- [ ] PWA push notifications — **Prerequisite: Firebase Cloud Messaging integration**. Requires VAPID key pair, `@angular/service-worker` push config, backend `POST /api/push/subscribe` to store `PushSubscription` objects, and `web-push` npm package for server-sent notifications. Current `ngsw` config handles cache only — push is a separate implementation path.

---

## Phase 6: Growth Features

### Engagement (order by impact)
- [ ] Club organiser roles — allow non-owner club members to post runs under the club
- [ ] Email notifications — runner gets email when a club they follow posts a new run
- [ ] Post-run recap — organiser posts a photo + note after the run date has passed
- [ ] Shareable links — `/runs/:id` and `/clubs/:id` with Open Graph meta tags for social sharing
- [ ] Pace groups / tags on run cards and search filters (DB columns already exist, just not surfaced)

### Discovery
- [ ] "Runs near me" radius filter on home feed (use stored geolocation)
- [ ] Club search / filter on club list (by city, pace, tags)
- [ ] Featured clubs section on home or clubs tab

### Social proof
- [ ] Run attendance count visible on club profile (total runners across all runs)
- [ ] "X people going" badge on run cards in feed

### Social (VIABLE SOON — can build without infrastructure)
- [ ] Social graph / follow friends — new `user_follows (follower_id, followee_id, created_at)` table; `GET /api/users/:id/followers` + `POST /api/users/:id/follow`; follow button on club member profiles
- [ ] Milestones & gamification — add `runs_joined_count INT DEFAULT 0` to `users` table (increment on join toggle); display achievement badges on `RunnerProfileComponent` using `computed()` signals (e.g. "Joined 10 runs", "Active in 3 clubs")
- [ ] QR code check-ins — add `npm install qrcode` to backend; `GET /api/runs/:id/qr` returns SVG data URI; display on run detail for organisers; no storage required

### Algorithmic (DEFER — needs post-launch data)
- [ ] Algorithmic pace matching — recommend runs based on user's historical pace + distance preferences; requires 3–6 months of `run_attendees` data before meaningful signal; consider pgvector extension on Supabase

### Integrations
- [ ] Strava — link run activity to a posted run (for post-run recap)
- [ ] Apple Health / Google Fit — future stretch goal

---

## Phase 7: Monetisation

- [ ] Freemium model: free tier (limited runs/month) + Plus badge for organisers
- [ ] Stripe integration — organiser subscription billing
- [ ] Featured run boosts — paid placement on home feed / map
- [ ] Club verification badge

---

## Tooling & Process (add when ready)

- [ ] Linear — replace this file with proper issue tracking before Phase 6
- [ ] Mobbin — design reference for Phase 3e mobile audit
- [ ] Sentry — error monitoring on both frontend and backend before public launch
- [ ] Analytics — PostHog or Plausible for usage data (privacy-friendly)

---

## Completed

- [x] Phase 1: all tests passing, dev server boots clean
- [x] Phase 2a: run search + server-side filters
- [x] Phase 2b: club system (CRUD, membership, ownership)
- [x] Phase 2c: geocoding proxy (backend)
- [x] Phase 2d: map geolocation + locate button
- [x] Phase 2e: toast notifications (signal-based, auto-dismiss)
- [x] Phase 2f: 4-tab bottom nav
- [x] Phase 2g: club ownership enforcement on run creation
- [x] Phase 2h: /api/clubs/owned endpoint for create-run dropdown
- [x] Route ordering fix (static before parameterised)
- [x] .gitignore updated
- [x] Phase 3a: test coverage (12 suites / 109 tests, all green)
- [x] Phase 3b: inline form validation on create-run + create-club
- [x] Phase 3c: toasts on all actions (join/leave, create run, cancel, delete, club join/leave)
- [x] Phase 3d: organiser dashboard — logout via avatar dropdown + Upcoming/Past/Cancelled filter tabs
