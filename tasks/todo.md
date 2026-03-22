# KLUB — Task Queue

## Active Sprint: Phase 3 — Polish

### Priority 1: Test coverage for new features
- [x] Backend: test /api/clubs/owned endpoint
- [x] Backend: test POST /api/runs club ownership validation
- [x] Backend: test /api/geocode proxy
- [x] Backend: test expanded clubs routes (list, join, members, club runs)
- [x] Frontend: test ClubService
- [x] Frontend: test ClubListComponent
- [x] Frontend: test ClubProfileComponent
- [x] Frontend: test CreateRunComponent
- [x] Frontend: test OrganiserHomeComponent
- [x] Frontend: test RunnerProfileComponent
- [x] Backend: runs.routes coverage — GET /mine, /joined, /:id, GET attendees, PATCH (55% → 80%+)

### Priority 2: UI polish
- [ ] Mobile responsive audit (320px minimum)
- [ ] Loading skeletons on club list + club profile
- [ ] Error states on all API-calling screens
- [ ] Form validation: inline errors on create-run + create-club
- [ ] Wire toasts to all remaining actions (create run, cancel, delete, club join/leave)
- [ ] "Post as Club" toggle clarity on create-run page
- [ ] Visual distinction between club runs and independent runs on cards

### Priority 3: Maps cleanup
- [ ] Migrate Marker → AdvancedMarkerElement (deprecated warning)
- [ ] Migrate DirectionsService if deprecated

### Priority 4: PWA
- [ ] Fix ngsw-worker.js 404
- [ ] Fix manifest.webmanifest serving
- [ ] KLUB branded icons (192x192, 512x512, maskable)
- [ ] Custom install prompt banner

### Priority 5: Pre-launch security
- [ ] Google Maps API key: HTTP referrer restrictions
- [ ] Google Maps API key: API restrictions (Maps JS, Geocoding, Directions only)
- [ ] Backend geocode key: IP restriction
- [ ] Run migration-001.sql on production database

## Future: Infrastructure & Growth

### Stack migrations
- [ ] Supabase — migrate PostgreSQL + swap JWT/bcrypt auth for Supabase Auth (real-time, RLS, storage for club logos)
- [ ] Linear — replace tasks/todo.md with proper issue tracking before launch
- [ ] Stripe — organiser subscriptions / featured run boosts when monetising

### Tooling (no migration needed, add when ready)
- [ ] Mobbin — design reference for mobile UI polish
- [ ] OpenClaw — marketing when launching

## Backlog
- [ ] Shareable run/club links with Open Graph meta tags
- [ ] Pace groups / tags displayed on run cards and filters
- [ ] Post-run recap (organiser posts photo + note after run date)
- [ ] Email notifications when new runs posted
- [ ] Strava integration
- [ ] Freemium model (plus badge, featured boost)
- [ ] Club organiser roles (allow club organisers to post runs, not just owner)

## Completed
- [x] Phase 1: all tests passing, dev server boots clean
- [x] Phase 2a: run search + server-side filters
- [x] Phase 2b: club system (CRUD, membership, ownership)
- [x] Phase 2c: geocoding proxy (backend)
- [x] Phase 2d: map geolocation + locate button
- [x] Phase 2e: toast notifications
- [x] Phase 2f: 4-tab bottom nav
- [x] Phase 2g: club ownership enforcement on run creation
- [x] Phase 2h: /api/clubs/owned endpoint for create-run dropdown
- [x] Route ordering fix (static before parameterised)
- [x] .gitignore updated