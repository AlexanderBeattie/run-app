# KLUB — Roadmap (post-launch phases)

> This file is intentionally NOT loaded each session. Reference it when planning Phase 5+.
> Active sprint lives in `tasks/todo.md`.

---

## Token estimate tracking

Format: `[~Xk est]` → updated to `[~Xk est / ~Yk actual]` when a session completes.
Purpose: calibrate future estimates.

| Session | Estimated | Actual | Delta |
|---------|-----------|--------|-------|
| phase3f (discovery feed frontend) | ~80k | — | — |
| phase-A1 (run_type end-to-end) | ~10k | — | — |
| phase4-security (backend + frontend) | ~60k | — | — |
| phase4-password-reset | ~30k | — | — |
| *(add row when each session completes)* | | | |

---

## Shipped (ahead of schedule)

- [x] **phase6-run-type** — `run_type` enum on run_events (club_run / parkrun_style / one_off_race / training_group / trail_run), badge on RunCard, filter pill on HomeComponent, migration-004.sql *(shipped as Phase A1)*

---

## Phase 5: Supabase Migration (post-launch)

> Each task below is a dedicated session. Supabase migration is EPIC scope — budget ~250k+ tokens total.
> Do not start until the app is live and stable on the current stack.

> **Session: phase5-db-migrate [~40k]**
> Context: `backend/src/db/schema.sql` + `db/index.ts` + `seed.ts`
> Note: schema.sql is canonical — all migrations 001–004 included. Use for fresh Supabase project setup.
- [ ] Migrate PostgreSQL → Supabase (export schema via schema.sql, import data, update DATABASE_URL)

> **Session: phase5-auth [~60k]**
> Context: `auth.middleware.ts` + `auth.routes.ts` + `app.config.ts` + `auth.service.ts`
- [ ] Swap JWT/bcrypt auth → Supabase Auth (handles refresh tokens, magic link, OAuth out of the box)

> **Session: phase5-rls [~30k]**
> Context: `schema.sql` only
- [ ] Add Row Level Security (RLS) policies to replace backend ownership checks

> **Session: phase5-storage [~40k]**
> Context: `clubs.routes.ts` + `club-profile.component.ts`
- [ ] Club logo uploads via Supabase Storage (currently no upload UI exists)

> **Session: phase5-realtime [~30k]**
> Context: `organiser-home.component.ts`
- [ ] Real-time signup counts on organiser dashboard via Supabase run_attendees subscription

> **Session: phase5-migrations [~15k]**
> Context: `package.json` scripts + `backend/src/db/`
- [ ] Replace manual SQL migration files with Supabase migration tooling

---

## Phase 5b: Discovery Feed Infrastructure

> Features blocked on infrastructure prerequisites — do not start until unblocked.

> **Session: phase5b-gpx [~80k]** | BLOCKED on phase5-storage (Supabase Storage)
> Context: `runs.routes.ts` + `create-run.component.ts` + `run-detail-dialog.component.ts`
- [ ] GPX route upload — `gpx_url TEXT` + `static_map_url TEXT` on run_events; `POST /api/runs/:id/gpx` multipart upload to Supabase bucket; static map preview via Google Maps Static API

> **Session: phase5b-photos [~60k]** | BLOCKED on phase5-storage (Supabase Storage)
> Context: `runs.routes.ts` + `run-detail-dialog.component.ts`
- [ ] Post-run photo recaps — new `run_photos` table; `POST /api/runs/:id/photos`; photo gallery on run detail shown after event_date

> **Session: phase5b-push [~70k]** | BLOCKED on VAPID infrastructure
> Context: `backend/src/index.ts` + `ngsw-config.json`
- [ ] PWA push notifications — VAPID key pair, `web-push` npm package, `POST /api/push/subscribe`; standards-based (not Firebase FCM)

> **Session: phase5b-offline [~18k]**
> Context: `ngsw-config.json` + `app.routes.ts`
- [ ] Offline run browsing — cache joined runs on login, "Saved runs" tab visible offline, queue join actions for sync on reconnect

---

## Phase 6: Growth Features

### Engagement

> **Session: phase6-onboarding [~12k]**
> Context: `docs/CODEMAPS/frontend.md` + `runs.routes.ts` + `tasks/lessons.md`
- [ ] Onboarding flow — 3-screen skippable wizard (welcome → pace preference → distance), pre-filters discovery feed on completion

> **Session: phase6-organiser-roles [~35k]**
> Context: `clubs.routes.ts` + `club_members` schema + `create-run.component.ts`
- [ ] Club organiser roles — non-owner members with `organizer` role can post runs under the club (backend permission + frontend UI)

> **Session: phase6-email [~30k]**
> Context: `clubs.routes.ts` only; new nodemailer/resend integration
- [ ] Email notifications — runner gets email when a followed club posts a new run

> **Session: phase6-post-run-recap [~40k]** | BLOCKED on phase5-storage (Supabase Storage)
> Context: `organiser-home.component.ts` + `run-detail-dialog.component.ts`
- [ ] Post-run recap — organiser posts photo + note after run date; visible on run detail

> **Session: phase6-og-tags [~15k]**
> Context: `frontend/src/index.html` + `backend/src/index.ts`
- [ ] Shareable links — `/runs/:id` + `/clubs/:id` with Open Graph meta tags for social previews

> **Session: phase6-pace-tags [~20k]**
> Context: `home.component.ts` + `run-card.component.ts`
> Note: `pace` and `tags` columns already exist on run_events and clubs — display only
- [ ] Pace group + tag display on run cards and search filter UI

> **Session: phase6-recurring-runs [~50k]**
> Context: `runs.routes.ts` + `schema.sql` + `create-run.component.ts`
- [ ] Recurring run templates — `recurrence_rule` TEXT (RRULE format) on run_events, cron job spawns instances, organiser toggle on create form

> **Session: phase6-waitlist [~35k]**
> Context: `runs.routes.ts` + `schema.sql` + `run-detail-dialog.component.ts`
- [ ] Attendee waitlist — `waitlist_position` on run_attendees, auto-promote + notify on cancellation (max_attendees already exists on run_events)

> **Session: phase6-organiser-stats [~20k]**
> Context: `organiser-home.component.ts` + `runs.routes.ts`
- [ ] Organiser quick-stats — attendance rate, no-show trend per run, displayed on organiser dashboard

> **Session: phase6-next-run-nudge [~10k]**
> Context: `run-detail-dialog.component.ts` + `runs.routes.ts`
- [ ] "Next run by same club" nudge — show next scheduled club run at the bottom of run detail sheet

> **Session: phase6-meeting-point [~12k]**
> Context: `run-detail-dialog.component.ts` + `create-run.component.ts` + `runs.routes.ts`
- [ ] Enhanced meeting point — "Open in Apple/Google Maps" deep-link on run detail; optional post-run café location field on create

> **Session: phase6-kit-checklist [~15k]**
> Context: `create-run.component.ts` + `run-detail-dialog.component.ts`
- [ ] Kit checklist — optional gear requirements on run creation (trail shoes / water / headtorch), displayed on run detail

> **Session: phase6-email-digest [~30k]**
> Context: `clubs.routes.ts` + `runs.routes.ts`; new nodemailer/resend integration
- [ ] Weekly email digest — "3 new runs near you this week", Friday 6pm send, user opt-out preference

> **Session: phase6-inclusive-groups [~20k]**
> Context: `docs/CODEMAPS/data.md` + `club-profile.component.ts` + `clubs.routes.ts`
- [ ] Inclusive group settings — "Who can join" per club (open / women-only / invitation-only); private runs hidden from discovery feed

### Discovery

> **Session: phase6-geo-filter [~25k]**
> Context: `home.component.ts` + `runs.routes.ts`
- [ ] "Runs near me" radius filter on home feed (geolocation + PostGIS or Haversine)

> **Session: phase6-club-search [~20k]**
> Context: `club-list.component.ts` + `clubs.routes.ts`
- [ ] Club search and filter by city, pace, tags

> **Session: phase6-featured-clubs [~15k]**
> Context: `home.component.ts`
- [ ] Featured clubs section on home or clubs tab

> **Session: phase6-ics-export [~15k]**
> Context: `run-detail-dialog.component.ts` + `runs.routes.ts`
- [ ] Calendar sync — `GET /api/runs/:id/calendar` returns ICS file; "Add to Calendar" button on run detail

### Social Proof

> **Session: phase6-attendance-stats [~20k]**
> Context: `club-profile.component.ts` + `run-card.component.ts` + `clubs.routes.ts`
- [ ] Run attendance count visible on club profile
- [ ] "X people going" live badge on run cards

> **Session: phase6-completion-rate [~10k]**
> Context: `run-card.component.ts` + `runs.routes.ts` + `organiser-home.component.ts`
- [ ] Run completion rate — backend calculates attended/RSVPed %, displayed on run cards and organiser dashboard

> **Session: phase6-verification-badge [~10k]**
> Context: `clubs.routes.ts` + `club-profile.component.ts` + `docs/CODEMAPS/data.md`
- [ ] Organiser verification badge — auto-awarded after 10 runs + 90% completion rate + zero reports; shown on club profile and run cards

> **Session: phase6-ratings [~25k]**
> Context: `run-detail-dialog.component.ts` + `runs.routes.ts` + `docs/CODEMAPS/data.md`
- [ ] Organiser star ratings — runner rates run after event_date (1–5 stars + optional comment); aggregate shown on organiser profile

> **Session: phase6-post-run-share [~25k]**
> Context: `run-detail-dialog.component.ts` + `run-card.component.ts`
> Note: Web Share API already wired
- [ ] Post-run share card — canvas-generated image (run name, distance, attendee count, KLUB branding) shared via Web Share API

### Social

> **Session: phase6-profile-visibility [~25k]**
> Context: `docs/CODEMAPS/data.md` + `runner-profile.component.ts` + `runs.routes.ts`
- [ ] Profile visibility controls — private/friends/public toggle (default: friends-only); affects run history, pace, upcoming runs

> **Session: phase6-block-report [~15k]**
> Context: `docs/CODEMAPS/data.md` + `runner-profile.component.ts` + `runs.routes.ts`
- [ ] Block + report — block runner (hides from discovery + attendee lists); report run (flags to admin); new `user_blocks` table

> **Session: phase6-follow [~45k]**
> Context: `schema.sql` + `runner-profile.component.ts`
- [ ] Social graph / follow friends — new `user_follows` table; followed clubs/runners surface in feed

> **Session: phase6-milestones [~25k]**
> Context: `runner-profile.component.ts` + `runs.routes.ts`
- [ ] Milestones and gamification — `runs_joined_count` on users, achievement badges (first run, 10 runs, 50km etc.)

> **Session: phase6-qr [~20k]**
> Context: `run-detail-dialog.component.ts` + `runs.routes.ts`
- [ ] QR code check-ins — `GET /api/runs/:id/qr` returns SVG QR code; organisers only; scan confirms attendance

### Algorithmic

> **Session: phase6-algo [~50k]** | DEFER — needs 3–6 months of post-launch data
> Context: `runs.routes.ts` + `schema.sql`; requires pgvector on Supabase
- [ ] Pace-based run recommendations — embed user run history, recommend runs by similarity

### Integrations

> **Session: phase6-strava [~60k]**
> Context: `run-detail-dialog.component.ts` + `runner-profile.component.ts` + `runs.routes.ts`
- [ ] Strava integration — link a Strava activity to a posted KLUB run; show stats on run detail

> **Session: phase6-apple-google-fit [~60k]** | DEFER
- [ ] Apple Health / Google Fit — stretch goal, deferred post-Strava

---

## Phase 7: Monetisation

> **Session: phase7-freemium [~40k]**
> Context: `runs.routes.ts` + `organiser-home.component.ts`
- [ ] Freemium model — free tier (limited runs/month per organiser) + KLUB Plus badge

> **Session: phase7-stripe [~80k]**
> Context: `auth.routes.ts` + users schema + `organiser-home.component.ts`
- [ ] Stripe integration — organiser subscription billing, webhook handling, subscription status on users table

> **Session: phase7-boosts [~35k]**
> Context: `home.component.ts` + `runs.routes.ts` + `map-view.component.ts`
- [ ] Featured run boosts — paid placement on home feed and map view

---

## Tooling & Process

> **Session: tooling-sentry [~25k]**
> Context: `frontend/src/app/app.config.ts` + `backend/src/index.ts`
- [ ] Sentry error monitoring on frontend + backend (should land before public launch)

> **Session: tooling-analytics [~20k]**
> Context: `frontend/src/index.html` + `frontend/src/app/app.config.ts`
- [ ] Analytics — PostHog or Plausible (privacy-friendly, no cookie banner needed)

> **Session: tooling-a11y [~20k]**
> Context: `app.component.ts` + `run-card.component.ts` + `run-detail-dialog.component.ts`
- [ ] Accessibility audit + fixes — aria-labels on interactive elements, WCAG AA contrast check (primary green is borderline), keyboard nav, large text mode via CSS custom property

> **Session: tooling-linear [~5k]** | Before Phase 6
> Context: `tasks/todo.md` + `tasks/roadmap.md`
- [ ] Migrate task tracking from todo.md → Linear before Phase 6 scope grows too large

- [ ] **Mobbin** — design reference for UI patterns (external tool, no code changes)
