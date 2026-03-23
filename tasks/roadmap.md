# KLUB — Roadmap (post-launch phases)

> This file is intentionally NOT loaded each session. Reference it when planning Phase 5+.
> Active sprint lives in `tasks/todo.md`.

---

## Phase 5: Supabase Migration (post-launch)

> Each task below is a dedicated session. Supabase migration is EPIC scope — budget ~250k+ tokens total.

> **Session: phase5-db-migrate [~40k]** | Context: read `backend/src/db/schema.sql` + `migration-001.sql` + `migration-002.sql` + `db/index.ts` only
- [ ] Migrate PostgreSQL → Supabase (export + import schema + data) [~40k]

> **Session: phase5-auth [~60k]** | Context: read `auth.middleware.ts` + `auth.routes.ts` + `app.config.ts` + `auth.service.ts` only
- [ ] Swap JWT/bcrypt auth → Supabase Auth (handles refresh tokens, magic link, OAuth) [~60k]

> **Session: phase5-rls [~30k]** | Context: read `schema.sql` only
- [ ] Add Row Level Security (RLS) policies to replace backend ownership checks [~30k]

> **Session: phase5-storage [~40k]** | Context: read `clubs.routes.ts` + `ClubProfileComponent` only
- [ ] Use Supabase Storage for club logo uploads [~40k]

> **Session: phase5-realtime [~30k]** | Context: read `OrganiserHomeComponent` only
- [ ] Subscribe to run_attendees inserts for real-time signup counts on organiser dashboard [~30k]

> **Session: phase5-migrations [~15k]** | Context: read `package.json` scripts only
- [ ] Replace manual migrations with Supabase migration tooling [~15k]

---

## Phase 5b: Discovery Feed Infrastructure

> Features BLOCKED on infrastructure prerequisites — do not start until unblocked.

> **Session: phase5b-gpx [~80k]** | **BLOCKED on Phase 5 Supabase Storage**
- [ ] GPX route upload — `gpx_url TEXT` + `static_map_url TEXT` on `run_events`; `POST /api/runs/:id/gpx` multipart upload to Supabase bucket, static map via Google Maps Static API [~80k]

> **Session: phase5b-photos [~60k]** | **BLOCKED on Phase 5 Supabase Storage**
- [ ] Post-run photo recaps — `run_photos` table; `POST /api/runs/:id/photos`; photo gallery on run detail after `event_date` [~60k]

> **Session: phase5b-push [~70k]** | **BLOCKED on VAPID infrastructure**
- [ ] PWA push notifications — VAPID key pair, `web-push` npm package; `POST /api/push/subscribe`; standards-based (not Firebase FCM) [~70k]

---

## Phase 6: Growth Features

### Engagement
> **Session: phase6-organiser-roles [~35k]** | Context: `clubs.routes.ts` + `club_members` schema + `CreateRunComponent`
- [ ] Club organiser roles — non-owner members can post runs under the club [~35k]

> **Session: phase6-email [~30k]** | Context: `clubs.routes.ts` only; new nodemailer/resend integration
- [ ] Email notifications — runner gets email when followed club posts a new run [~30k]

> **Session: phase6-post-run-recap [~40k]** | Context: `OrganiserHomeComponent` + `RunDetailDialogComponent` | Requires Supabase Storage
- [ ] Post-run recap — organiser posts photo + note after run date [~40k]

> **Session: phase6-og-tags [~15k]** | Context: `index.html` + `backend/src/index.ts`
- [ ] Shareable links — `/runs/:id` + `/clubs/:id` with Open Graph meta tags [~15k]

> **Session: phase6-pace-tags [~20k]** | Context: `HomeComponent` + `RunCardComponent` (DB columns already exist)
- [ ] Pace groups / tags on run cards and search filters [~20k]

### Discovery
> **Session: phase6-geo-filter [~25k]** | Context: `HomeComponent` + `runs.routes.ts`
- [ ] "Runs near me" radius filter on home feed [~25k]

> **Session: phase6-club-search [~20k]** | Context: `ClubListComponent` + `clubs.routes.ts`
- [ ] Club search / filter by city, pace, tags [~20k]

> **Session: phase6-featured-clubs [~15k]** | Context: `HomeComponent` only
- [ ] Featured clubs section on home or clubs tab [~15k]

### Social proof
> **Session: phase6-attendance-stats [~15k]** | Context: `ClubProfileComponent` + `clubs.routes.ts`
- [ ] Run attendance count visible on club profile [~15k]
- [ ] "X people going" badge on run cards [~8k]

### Social
> **Session: phase6-follow [~45k]** | Context: `schema.sql` + `RunnerProfileComponent`; new `user_follows` table
- [ ] Social graph / follow friends [~45k]

> **Session: phase6-milestones [~25k]** | Context: `RunnerProfileComponent` + `runs.routes.ts`
- [ ] Milestones & gamification — `runs_joined_count` on users, achievement badges [~25k]

> **Session: phase6-qr [~20k]** | Context: `RunDetailDialogComponent` + `runs.routes.ts`
- [ ] QR code check-ins — `GET /api/runs/:id/qr` returns SVG; organisers only [~20k]

### Algorithmic (DEFER — needs post-launch data)
> **Session: phase6-algo [~50k]** | DEFER — needs 3–6 months post-launch data
- [ ] Algorithmic pace matching — recommend runs from historical pace/distance; pgvector on Supabase [~50k]

### Integrations
> **Session: phase6-strava [~60k]** | Context: `RunDetailDialogComponent` + `RunnerProfileComponent` + `runs.routes.ts`
- [ ] Strava — link run activity to a posted run [~60k]
- [ ] Apple Health / Google Fit — future stretch [~60k estimate, deferred]

---

## Phase 7: Monetisation

> **Session: phase7-freemium [~40k]** | Context: `runs.routes.ts` + `OrganiserHomeComponent`
- [ ] Freemium model — free tier (limited runs/month) + Plus badge [~40k]

> **Session: phase7-stripe [~80k]** | Context: `auth.routes.ts` + users schema + `OrganiserHomeComponent`
- [ ] Stripe integration — organiser subscription billing [~80k]

> **Session: phase7-boosts [~35k]** | Context: `HomeComponent` + `runs.routes.ts` + `MapViewComponent`
- [ ] Featured run boosts — paid placement on home feed / map [~35k]

> **Session: phase7-badge [~15k]** | Context: `ClubProfileComponent` + `clubs.routes.ts`
- [ ] Club verification badge [~15k]

---

## Tooling & Process

> **Session: tooling-sentry [~25k]** | Context: `app.config.ts` + `backend/src/index.ts`
- [ ] Sentry — error monitoring on frontend + backend before public launch [~25k]

> **Session: tooling-analytics [~20k]** | Context: `index.html` + `app.config.ts`
- [ ] Analytics — PostHog or Plausible (privacy-friendly) [~20k]

- [ ] Linear — replace `tasks/todo.md` with proper issue tracking before Phase 6
- [ ] Mobbin — design reference (external tool, no code changes)
