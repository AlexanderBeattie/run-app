# KLUB — Task Queue

**Current Focus:** Phase 6a/b — Strava Closure & Social Kickoff
**Sprint Goal:** Finalize the Strava loop and transition KLUB from Utility to Community.

---

## 🚨 Market Research Inserts (April 2026)
*Two gaps identified by competitive analysis that warrant immediate action — see `tasks/roadmap.md` for full context.*

### 0. Week-1 Onboarding Funnel (Highest Retention Leverage)
> Retention data: users active in week 1 are 80% more likely to stay 6+ months. A new user who can't find a run near them in <60 seconds will churn. This is the biggest immediate retention risk.
- [ ] **Location-Aware Welcome:** Post-signup screen that uses geolocation to surface the nearest 3 upcoming runs immediately.
- [ ] **"Your First Run" CTA:** Persistent prompt on home feed for users with 0 joined runs — dismisses permanently once they join one.
- [ ] **Empty State Fix:** Replace empty feed state (no runs in area) with a "Notify me when a run is posted near [city]" subscription prompt.

---

## 🟢 Active Sprint: Strava Completion & Home Polish

### 1. Strava Integration (Closure)
- [ ] **Disconnect Strava:** Create `DELETE /api/auth/strava` (backend) to wipe tokens/athlete_id and a "Disconnect" UI in Runner Settings.
- [ ] **Auto-Suggest Matching:** Implement date-range matching logic in `StravaSelectorModal` to highlight the most likely Strava activity for a KLUB run.
- [ ] **Webhook Infrastructure:** Implement the listener for Strava Webhooks to automatically sync "Linked" activities when they are updated on Strava.

### 2. Home Feed "Pro" Visuals
- [ ] **Route Art Elevation:** Move the `RoutePreviewComponent` onto Home Feed cards. If a run has an associated route, show the SVG "fingerprint" on the card.
- [ ] **Global Search Optimization:** Add a PostgreSQL GIN index to `run_events` (title, description) and `clubs` (name) for faster full-text search.

---

## 🟠 Next Up: The Social Epic (Phase 6b)

### 3. Run Chat (High Priority)
> Market validated: post-run coordination is the #1 unmet social need across all major competitors. Strava clubs are forums; nobody owns in-run logistics chat.
- [ ] **Database:** Create `run_comments` table (id, run_id, user_id, content, created_at).
- [ ] **Backend:** `GET /api/runs/:id/comments` and `POST /api/runs/:id/comments`.
- [ ] **UI:** Chat tab in `RunDetailDialog` with bottom-anchored input bar and signal-based message updates.

### 4. Pace-Based Runner Matching (New — Market Gap)
> The most-cited unmet need across Reddit, App Store reviews, and competitor analysis. Current pace filter is an event filter; users want person-level discovery ("who near me runs at my pace?").
- [ ] **Profile Pace Field:** Add `preferred_pace_min_km` to user profiles (set during onboarding or in settings).
- [ ] **Backend Query:** `GET /api/runs?pace_match=true` — ranks/filters runs where the posted pace overlaps the requesting user's preferred pace (±30 sec/km window).
- [ ] **UI:** "Runs for you" section on Home Feed — a curated row of pace-matched runs above the main feed, distinct from the search filters.

---

## 🛡 Verification & Maintenance
- [ ] **Error Boundaries:** Implement a global Angular ErrorHandler to catch runtime crashes and show a user-friendly Toast.
- [ ] **API Key Hardening:** Restrict Google Maps API keys to production domain referrers in Google Cloud Console.
- [ ] **Cleanup Job:** Schedule a daily cron on Render to delete expired refresh tokens from the DB.

---

## ✅ Recently Completed (The "Unbreakable" Sprint)
- [x] **AES-256 Encryption:** All Strava tokens encrypted at rest in DB.
- [x] **Proactive Refresh:** Automatic Strava token refresh logic (5-min buffer).
- [x] **Advanced Markers:** Full migration to `AdvancedMarkerElement` (2026 Maps API compliant).
- [x] **Image Compression:** Frontend Canvas-based compression to stay under 1GB DB limit.
- [x] **Dormant Data Activation:** Weather Badges, GPS Polylines, and "Spots Left" logic fully wired to UI.
- [x] **Tag Filtering:** Interactive tag pills on Home Feed.
