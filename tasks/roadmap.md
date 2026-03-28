# KLUB — Roadmap (post-launch phases)

> This file is intentionally NOT loaded each session. Reference it when planning Phase 5+.
> Active sprint lives in `tasks/todo.md`.
> **Note:** Phase 5 (Supabase Migration) and heavy backend infra are intentionally deferred until the Phase 4d UX Polish sprint is fully completed.

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
| phase4c (Visual Enhancement) | ~50k | ~30k | -20k |

---

## Phase 4 Backlog — Deployment Readiness (pre-launch)

> Do these before going public.

### Security
- [ ] Google Maps API key: add HTTP referrer restrictions in Google Cloud Console
- [ ] Google Maps API key: restrict to Maps JS + Geocoding + Directions APIs only
- [ ] Backend geocode key: add server IP restriction (Render static IP or proxy)
- [ ] Audit CORS_ORIGIN in production env — must be exact Netlify URL, not wildcard

### DB Migrations (production)
> `schema.sql` is canonical for fresh installs. Run individual migration files against existing prod DB.
- [ ] Run migration-001.sql to 004.sql on production DB
- [ ] Schedule periodic cleanup of expired refresh tokens on Render (daily cron → `npm run db:cleanup-tokens`)

### PWA
- [ ] Fix ngsw-worker.js 404 (Netlify serving issue)
- [ ] Fix manifest.webmanifest MIME type not served correctly on Netlify
- [ ] KLUB branded icons (192×192, 512×512, maskable variant)
- [ ] Custom install-to-homescreen prompt banner

### Infra
- [ ] Verify Render backend auto-deploys from main
- [ ] Verify Netlify build pipeline runs generate-env.js correctly
- [ ] Smoke test all API endpoints against production DB after migrations

---

## Phase 5: Supabase Migration (post-launch)

> EPIC scope — budget ~250k+ tokens total.

- [ ] **phase5-db-migrate:** Migrate PostgreSQL → Supabase (export schema via schema.sql, import data)
- [ ] **phase5-auth:** Swap JWT/bcrypt auth → Supabase Auth (handles refresh tokens, magic link, OAuth)
- [ ] **phase5-rls:** Add Row Level Security (RLS) policies to replace backend ownership checks
- [ ] **phase5-storage:** Club logo uploads via Supabase Storage
- [ ] **phase5-realtime:** Real-time signup counts on organiser dashboard via Supabase subscription
- [ ] **phase5-migrations:** Replace manual SQL migration files with Supabase migration tooling

---

## Phase 5b: Discovery Feed Infrastructure

- [ ] **phase5b-gpx:** GPX route upload — `gpx_url TEXT` on run_events; static map preview via Google Maps Static API
- [ ] **phase5b-photos:** Post-run photo recaps — new `run_photos` table
- [ ] **phase5b-push:** PWA push notifications — VAPID key pair, `web-push` npm package
- [ ] **phase5b-offline:** Offline run browsing — cache joined runs on login, "Saved runs" tab visible offline

---

## Phase 6: Growth Features (Backend & Social)

- [ ] **phase6-organiser-roles:** Non-owner members with `organizer` role can post runs
- [ ] **phase6-email:** Email notifications when followed club posts a run
- [ ] **phase6-post-run-recap:** Organiser posts photo + note after run date
- [ ] **phase6-og-tags:** Open Graph meta tags for `/runs/:id` social previews
- [ ] **phase6-recurring-runs:** RRULE format recurring templates, cron job spawn instances
- [ ] **phase6-waitlist:** Attendee waitlist on run_attendees, auto-promote on cancellation
- [ ] **phase6-organiser-stats:** Attendance rate, no-show trend per run
- [ ] **phase6-email-digest:** Weekly email digest ("3 new runs near you")
- [ ] **phase6-inclusive-groups:** "Who can join" per club (open / women-only / invitation-only)
- [ ] **phase6-ics-export:** Calendar sync — `GET /api/runs/:id/calendar` returns ICS file
- [ ] **phase6-profile-visibility:** Private/friends/public toggle
- [ ] **phase6-block-report:** Block runner, report run functions
- [ ] **phase6-follow:** Social graph / follow friends
- [ ] **phase6-milestones:** Gamification (runs_joined_count, badges)
- [ ] **phase6-qr:** QR code check-ins for organisers
- [ ] **phase6-algo:** Pace-based algorithmic run recommendations
- [ ] **phase6-strava:** Strava integration for stats
- [ ] **phase6-apple-google-fit:** Apple Health / Google Fit integration

---

## Phase 7: Monetisation

- [ ] **phase7-freemium:** Free tier (limited runs/month) + KLUB Plus badge
- [ ] **phase7-stripe:** Stripe integration for organiser subscriptions
- [ ] **phase7-boosts:** Paid placement on home feed and map view

---

## Tooling & Process

- [ ] **tooling-sentry:** Sentry error monitoring on frontend + backend
- [ ] **tooling-analytics:** PostHog or Plausible
- [ ] **tooling-linear:** Migrate task tracking from todo.md → Linear