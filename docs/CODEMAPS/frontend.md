<!-- Generated: 2026-03-29 | Files scanned: 66 | Token estimate: ~520 -->

# Frontend Architecture Codemap

**Last Updated:** 2026-03-29
**Entry Points:** `frontend/src/main.ts` | `frontend/src/app/app.component.ts`

## Route Tree & Guards

```
routes (app.routes.ts)
├── / → entryGuard: UrlTree redirect → /home (logged in) | /map (guest)
├── /login               LoadComponent: LoginComponent (no guard; honours ?returnUrl=)
├── /register            LoadComponent: RegisterComponent (no guard)
├── /forgot-password     LoadComponent: ForgotPasswordComponent (no guard)
├── /reset-password      LoadComponent: ResetPasswordComponent (no guard)
├── /home        (authGuard) → HomeComponent
├── /map         (PUBLIC — guest access) → MapViewComponent
├── /clubs       (authGuard) → ClubListComponent
│   ├── /clubs/create              (organizerGuard) → CreateClubComponent
│   ├── /clubs/create-run          (organizerGuard) → CreateRunComponent (wizard)
│   ├── /clubs/edit-run/:id        (organizerGuard) → EditRunComponent
│   ├── /clubs/edit/:id            (organizerGuard) → EditClubComponent
│   └── /clubs/:id         (authGuard) → ClubProfileComponent
├── /profile             (authGuard) → RunnerProfileComponent (embeds OrganiserHome for organizers)
├── /organiser           → redirect /profile
└── ** → redirect / (re-runs guest/logged-in split)
```

**Guest mode:** `/map` is public. Guests can browse runs, open the run detail
dialog (attendees, weather, chat read-only), and are funnelled to
`/login?returnUrl=…` when they try to join, chat, or open any guarded tab.
Bottom nav shows for guests everywhere except auth screens; the Profile tab
becomes "Sign in" when logged out. Guards attach `?returnUrl=` and login
honours it.

**Route Ordering (critical):** Static routes MUST come before parameterized: `/clubs/create` before `/clubs/:id`

## Component Hierarchy

### Root Shell (AppComponent)
```
app.component.ts
├── RouterOutlet
├── ToastComponent (overlays notifications)
└── BottomNavComponent (4-tab nav, conditionally shown)
    └── showNav logic: isLoggedIn && not /login|/register
```

### Feature: Auth
```
LoginComponent → AuthService.login() → navigate /home
RegisterComponent → AuthService.register() → navigate /home
ForgotPasswordComponent → POST /api/auth/forgot-password
ResetPasswordComponent → reads ?token= → POST /api/auth/reset-password → navigate /login
```

### Feature: Home/Feed
```
HomeComponent
├── Signals: searchQuery, filters (pace, distance_min, city, date)
├── OnInit: RunsService.loadRuns(filters)
├── RunCardComponent[] → click → RunDetailDialogComponent (bottom sheet)
└── join button → RunsService.toggleJoin()
```

### Feature: Map
```
MapViewComponent
├── Google Maps JS API instance + MarkerClusterer
├── Geolocation: navigator.geolocation
├── OnInit: RunsService.loadRuns()
└── Click marker → RunDetailDialogComponent
```

### Feature: Clubs

**ClubListComponent**
```
├── OnInit: ClubService.listClubs()
├── ClubCardComponent[] → click → /clubs/:id
├── join button → ClubService.toggleJoin()
└── [Create Club] button (if organizer)
```

**ClubProfileComponent**
```
├── Route param: :id → ClubService.getClub(id)
├── Header: name, description, logo, member_count
├── Runs: ClubService.getClubRuns(id)
├── Members: ClubService.getClubMembers(id)
└── Actions: [Join Club], [Create Run] (if organizer + owner)
```

**CreateClubComponent** (organizerGuard)
```
├── Form: name, description, city, pace, tags
├── ClubBrandingPreviewComponent (live preview)
└── OnSubmit: ClubService.createClub() → navigate /clubs/:newId
```

**CreateRunComponent** (organizerGuard) — wizard-based
```
├── CreateRunWizardComponent (wizard shell)
│   ├── StepDetailsComponent   — title, run_type, description
│   ├── StepLogisticsComponent — start/end addresses, Google Maps pickers
│   ├── StepScheduleComponent  — date/time, distance, estimated minutes
│   └── StepVibeComponent      — pace, tags, club selection
├── Geocoding: GeocodingService.geocode() on address blur
└── OnSubmit: RunsService.createRun() → success toast → navigate
```

**EditRunComponent** (organizerGuard)
```
├── Route param: :id → RunsService.getRunById(id)
├── Form: same fields as CreateRunComponent
└── OnSubmit: RunsService.updateRun()
```

**OrganiserHomeComponent** (organizerGuard)
```
├── OnInit: RunsService.getMyRuns() + ClubService.getMyClubs()
├── My Runs: list with [Edit], [Cancel], [Delete] + RunCardCarouselComponent
├── My Clubs: list with [View], [Edit], [Members]
└── RunOrganiserDialogComponent: edit/view attendees
```

### Feature: Profile
```
RunnerProfileComponent
├── OnInit: AuthService.currentUser
├── Display: displayName, email, strava_connected status
├── Strava: [Connect Strava] button → StravaService.initiateOAuth()
│   └── Or: [View Activities] if connected → StravaService.getActivities()
├── My Runs: RunsService.getJoinedRuns() → RunCardComponent[]
└── Actions: [Logout], SettingsMenuComponent
```

## Core Services

### AuthService (core/services/auth.service.ts)
```
currentUser: Signal<KlubUser | null>  ← loads from localStorage on init
isLoggedIn(): boolean
isOrganizer(): boolean
isTokenExpired(): boolean  ← checks expiresAt with 60s buffer
login(email, password): Observable
register(displayName, email, password, role): Observable
refresh(): Observable  ← exchanges refreshToken for new JWT
logout(): void
  └── POST /api/auth/logout → clears localStorage, resets signal
```
**Session:** localStorage keys: `klub_token`, `klub_user`, `klub_refresh_token`, `klub_expires_at`

### RunsService (core/services/runs.service.ts)
```
runs: Signal<RunEvent[]>
joinedRunIds: Signal<string[]>

loadRuns(filters?): void → GET /api/runs → updates runs signal
getRunById(id): Observable<RunEvent>
getMyRuns(): Observable<RunEvent[]>
getJoinedRuns(): Observable<RunEvent[]>
createRun(data): Observable<RunEvent>
updateRun(id, data): Observable<RunEvent>
deleteRun(id): Observable<void>
toggleJoin(runId): void → POST /api/runs/:id/join → updates local state
mapRun(raw): RunEvent  ← converts DB columns to frontend types
formatDate(date): string  ← "Today", "Tomorrow", "Next Wednesday"
formatTime(date): string  ← "HH:MM" en-GB
```

### ClubService (core/services/club.service.ts)
```
myClubIds: Signal<string[]>

listClubs(): Observable<Club[]>
getClub(id): Observable<Club>
getClubRuns(id): Observable<RunEvent[]>
getClubMembers(id): Observable<ClubMember[]>
createClub(data): Observable<Club>
updateClub(id, data): Observable<Club>
toggleJoin(clubId): void
loadMyClubs(): void
getMyClubs(): Observable<Club[]>  ← clubs user owns (for run creation)
```

### StravaService (core/services/strava.service.ts)
```
initiateOAuth(): void → GET /api/strava → redirect to Strava auth
getActivities(): Observable<StravaActivity[]> → GET /api/users/strava/activities
```

### GeocodingService (core/services/geocoding.service.ts)
```
geocode(address: string): Observable<{lat, lng, formatted_address}>
  └── GET /api/geocode?address= (server-side proxy)
```

### GeoService (core/services/geo.service.ts)
```
getCurrentPosition(): Promise<{lat, lng}>  ← wraps navigator.geolocation
```

## Shared Components

| Component | Key Inputs/Outputs | Used By |
|-----------|-------------------|---------|
| **RunCardComponent** | @Input run, showJoinButton; @Output clicked | Home, Profile, Clubs |
| **RunDetailDialogComponent** | @Input run, showActions | Home, Map (bottom sheet) |
| **RunCardCarouselComponent** | @Input runs: RunEvent[] | OrganiserHomeComponent |
| **BottomNavComponent** | isLoggedIn, isOrganizer | AppComponent (fixed bottom) |
| **ToastComponent** | Signal-driven | AppComponent (overlay) |
| **SettingsMenuComponent** | — | RunnerProfileComponent |
| **ClubBrandingPreviewComponent** | @Input clubData | CreateClubComponent |
| **ShareCardModalComponent** | @Input run | RunDetailDialogComponent |
| **StravaSelector ModalComponent** | @Input activities | RunDetailDialogComponent |
| **ConfirmModalComponent** | @Input title, message, destructive; @Output confirmed/cancelled | OrganiserHomeComponent |
| **RunnerProfileDialogComponent** | @Input userId | (attendee view) |

## Guards & Interceptors

**authGuard** (core/guards/auth.guard.ts)
```
CanActivateFn → AuthService.isLoggedIn() → true: allow | false: navigate /login
```

**organizerGuard** (core/guards/organizer.guard.ts)
```
CanActivateFn → AuthService.isOrganizer() → true: allow | false: navigate /home + error toast
```

**jwtInterceptor** (core/interceptors/jwt.interceptor.ts)
```
HttpInterceptorFn
├── Skips /auth/ routes
├── Proactively refreshes expired tokens (60s buffer) before request
├── Appends: Authorization: Bearer {token}
└── On 401 response: AuthService.logout() + navigate /login
```

## Configuration

**app.config.ts**
```
providers: [
  provideRouter(routes),
  provideHttpClient(withInterceptors([jwtInterceptor])),
  provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() })
]
```

## File Organization

```
src/app/
├── app.component.ts          ← shell (RouterOutlet + ToastComponent + BottomNav)
├── app.routes.ts             ← 16 lazy routes + guards
├── app.config.ts             ← DI + service worker
├── core/
│   ├── guards/               (2 files: auth, organizer)
│   ├── interceptors/         (1 file: jwt)
│   ├── models/               (interfaces: KlubUser, RunEvent, Club, ClubMember)
│   └── services/             (6 files: auth, runs, club, geocoding, strava, geo)
├── features/
│   ├── auth/                 (4 components)
│   ├── clubs/                (7 components + create-run-wizard/ subdirectory with 4 step components)
│   ├── home/                 (1 component)
│   ├── map/                  (1 component)
│   └── profile/              (1 component)
└── shared/
    ├── components/           (11 components: run-card, run-detail-dialog, run-card-carousel,
    │                          bottom-nav, toast, settings-menu, club-branding-preview,
    │                          share-card-modal, strava-selector-modal, confirm-modal,
    │                          runner-profile-dialog)
    └── services/             (1 file: toast)
```

**Component count:** ~35 standalone Angular components, all using `inject()` for DI

## Related Codemaps
- [architecture.md](architecture.md) — Data flow, monorepo setup
- [backend.md](backend.md) — API routes called by services
- [dependencies.md](dependencies.md) — npm packages, environment
