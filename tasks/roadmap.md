# KLUB — Roadmap

> This file is intentionally NOT loaded each session. Reference it when planning Phase 5+.
> Active sprint lives in `tasks/todo.md`.

---

## Market Context (April 2026)

**Why the timing is right:**
- 2025 was "Year of the Run Club" — Gen Z choosing run clubs over dating apps (Fortune, Oct 2025)
- Strava's club count quadrupled to 1M in 2025; 50M MAU; IPO planned
- Running club participation up 25% over 5 years in the US (Running USA)
- Recreation clubs market: $64.84B globally, growing at 6.8% CAGR

**KLUB's core thesis, validated:**
- Strava (100M users) explicitly cannot schedule group runs or invite club members to events — their #1 user complaint
- No competitor consolidates: local run discovery + event scheduling + social community + organiser tools
- The entire market splits into "fitness tracker" or "race registration" — nobody owns the daily local group run

**What NOT to build:**
- Global activity feed (Strava's moat)
- AI individual training plans (Runna/Strava just acquired this space)
- GPS segment leaderboards (Strava's core IP)

---

## 🟢 Phase 0: The "Ironclad" Baseline (Current Sprint)
*Focus: Resolving known issues, technical debt, and securing the foundation before scaling traffic.*

**Security & Infrastructure**
- [ ] **Role Enforcement:** Update API authorization to respect the `organizer` role in `club_members`, not just `owner`.
- [ ] **Search Optimization:** Add PostgreSQL GIN indexing to replace `ILIKE` for scalable, instant full-text search.
- [ ] **Strava Closure:** Implement "Disconnect Strava" (wipe tokens) and "Auto-suggest matching" logic.
- [ ] **API & Error Hardening:** Restrict Google Maps API key referrers, and implement a global Angular ErrorBoundary to prevent white screens.

**Retention Foundation (New — market insert)**
- [ ] **Week-1 Onboarding Funnel:** Location-aware post-signup flow that gets a new user to their first joined run in <60 seconds. Industry data: users active in week 1 are 80% more likely to stay 6+ months. This is the single highest-leverage retention move available before launch.
- [ ] **Empty State Strategy:** Replace zero-results feed with a "Notify me when a run is posted near [city]" prompt — captures intent instead of bouncing users.

---

## 🟠 Phase 1: The Social Epic (Q2 2026)
*Focus: Turning a search tool into a daily habit by deepening participation and social features.*

**Runner Interaction**
- [ ] **Run Chat:** Threaded comments per run for logistics ("I'm 5 mins late!", "Where exactly are we meeting?"). Market validated — post-run/pre-run coordination is the #1 unmet social need across all major competitors.
- [ ] **Waitlists:** Automated waitlist queue. If a run is full and someone drops out, the next person is auto-promoted. Validated by organiser pain point research.
- [ ] **Saved Runs:** Ability to "Bookmark" a run to track its capacity without officially joining.
- [ ] **Pace-Based Runner Matching (New):** Surface "Runs for you" on the home feed — pace-matched runs based on the user's stated preferred pace (±30 sec/km). This is the most-cited unmet need across App Store reviews and competitor analysis. CorrerJuntos built their differentiation entirely on this. Current pace filter is an event filter; this is person-level discovery.

**Profiles & Identity**
- [ ] **Social Graph:** Follow friends and verified club leaders. Adds a "Mutual Clubs" intersection display on profiles.
- [ ] **Privacy "Ghost Zones":** Allow users to automatically obscure the first/last 500m of their GPS polylines to protect home addresses.
- [ ] **Post-Run Gallery:** Organizers and attendees can upload 3-5 "Recap Photos" to a completed run's page. Emerging trend — no major competitor has implemented post-run social engagement well.

---

## 🔵 Phase 2: The "Pro Organizer" Suite (Q3 2026)
*Focus: Providing advanced tools that make KLUB indispensable for club leaders. This is the monetisation foundation.*

**Event Automation**
- [ ] **Recurring Runs:** RRULE support for creating templated runs (e.g., auto-spawning "Tuesday Track Night"). Massive friction reducer — WhatsApp groups currently do this job for most club organisers.
- [ ] **Club Route Library:** Allow organizers to save and reuse standard GPX routes directly from their club profile.
- [ ] **Digital Waivers:** Add a required liability checkbox flow for users joining specific high-risk or club-mandated runs.

**Management & Analytics**
- [ ] **QR Check-in:** A scanning mode for organizers to instantly verify attendance at the start line. Actively monetised by ClubPal and Teamer — validates willingness to pay.
- [ ] **Organizer Analytics:** Dashboards showing attendance rates, no-show trends, and member retention.
- [ ] **Calendar Sync:** One-tap ICS export ("Add to Apple/Google Calendar").
- [ ] **Event Payment Processing (New):** Allow organisers to charge for specific runs (charity 5Ks, coached sessions). KLUB takes a small platform fee. RunSignUp processes $400M/yr this way for races — the model is proven. Unlocks ticketed events and legitimises clubs as organised entities.

**Monetization Launch**
- [ ] **Club Plans ($39.99–$99.99/mo):** Gated behind Phase 2 features — multi-admin, analytics, payment processing, bulk messaging. This is the primary revenue driver.
- [ ] **KLUB Premium ($9.99/mo):** Individual runner tier — pace matching priority, saved run history, advanced profile stats.

---

## 🟣 Phase 3: The Scaling Epic (Q4 2026)
*Focus: Transitioning to serverless, real-time architecture for massive scale.*

**Supabase Migration**
- [ ] **Real-Time Subscriptions:** Migrate DB to Supabase. Chat messages, waitlist updates, and sign-up counts update instantly via WebSockets without refreshing.
- [ ] **Auth Swap:** Replace custom JWT/bcrypt with Supabase Auth (enabling frictionless Magic Links and native OAuth).
- [ ] **Edge Storage:** Move Base64 image strings from the DB to Supabase Storage Buckets for CDN-backed speed.

**Automated Syncing**
- [ ] **Strava Webhooks:** Activate the webhook listener to sync linked activities silently in the background.
- [ ] **Push Notifications:** VAPID-based browser/mobile notifications for "Run starting in 1 hour" and "Waitlist Promotion."

**Local Leaderboards & Challenges (New)**
- [ ] **Club Challenges:** Weekly/monthly distance or attendance challenges within a club. Market data shows local/peer leaderboards drive higher engagement than global rankings — Strava's version is shallow.
- [ ] **Neighbourhood Leaderboards:** City-scoped run counts visible on the map view — drives FOMO and local discovery.

---

## ⚪ Phase 4: Ecosystem & Monetization (2027)
*Focus: Business sustainability and broader fitness integration.*

**Expansion**
- [ ] **Garmin / Apple Health:** Native integrations for runners outside the Strava ecosystem. Competitive necessity by 2026–2027 per trend data.
- [ ] **Weekly Digest:** Automated SendGrid email: "3 runs happening near you this weekend."

**Monetization**
- [ ] **Verified Club Subscriptions:** Small monthly Stripe fee for clubs to access advanced analytics, bulk-messaging, and "Featured" placement.
- [ ] **Ticketed Events:** Allow organizers to host paid runs (e.g., charity 5Ks) with KLUB taking a small platform fee.
- [ ] **KLUB Plus:** Optional runner subscription for personal training heatmaps, dark mode customizations, and "Pro" profile badges.

---

## ⚠️ Competitive Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Strava ships group run scheduling | Medium — they're aware of the gap; just acquired Runna | High | Speed to market; own the organiser relationship before they move |
| PWA install rate ceiling vs native apps | High — fitness apps lean on App Store distribution | Medium | Monitor install-to-retain ratio; evaluate native wrapper at Phase 3 |
| Network effects require local density | High — a city with 3 runs listed is worthless | High | Launch city strategy; seed with existing run clubs before opening self-serve |
| Freemium conversion stays at 2–3% | Medium — industry norm | Medium | Volume through viral loop matters more than conversion rate at this stage |

---

## 🛠 Tooling & DevOps Strategy
- **Monitoring:** Sentry (Real-time crash reporting for Angular and Node).
- **Analytics:** PostHog (Tracking feature adoption — Map vs. List views, onboarding funnel drop-off, pace match CTR).
- **Workflow:** Migrate task tracking to **Linear** once the contributor count exceeds 2.

---

## Monetization Model Summary

| Tier | Price | Gate |
|---|---|---|
| Free | $0 | Run discovery, RSVP, basic profile |
| KLUB Premium | $9.99/mo | Pace matching priority, run history, advanced stats |
| Club Plan | $39.99–$99.99/mo | Multi-admin, analytics, payment processing, bulk messaging |
| Platform fee | ~5% per ticketed event | Ticketed runs (Phase 4) |

*Sweet spot validated by market: Strava ($11.99/mo individual), RunSignUp (transaction %). Freemium conversion in fitness averages 2–3% — viral free tier is the growth engine, Club Plans are the revenue engine.*
