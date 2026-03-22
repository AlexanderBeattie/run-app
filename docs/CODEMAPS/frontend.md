<!-- Generated: 2026-03-22 | Files scanned: 19 | Token estimate: ~440 -->

# Frontend Architecture Codemap

**Last Updated:** 2026-03-22
**Entry Points:** `/Users/alexbeattie/Downloads/klub/frontend/src/main.ts` | `/Users/alexbeattie/Downloads/klub/frontend/src/app/app.component.ts`

## Route Tree & Guards

**appComponent (app.component.ts) Outlet:**
```
routes (app.routes.ts)
├── / → redirect home
├── /login               LoadComponent: LoginComponent (no guard)
├── /register            LoadComponent: RegisterComponent (no guard)
├── /home        (authGuard) → HomeComponent
├── /map         (authGuard) → MapViewComponent
├── /clubs       (authGuard) → ClubListComponent
│   ├── /clubs/create              (organizerGuard) → CreateClubComponent
│   ├── /clubs/create-run           (organizerGuard) → CreateRunComponent
│   ├── /clubs/edit-run/:id         (organizerGuard) → EditRunComponent
│   └── /clubs/:id          (authGuard) → ClubProfileComponent
├── /profile             (authGuard) → RunnerProfileComponent
├── /organiser           (organizerGuard) → OrganiserHomeComponent
└── ** → redirect home
```

**Route Ordering (critical):**
- Static routes MUST come before parameterized: `/clubs/create` before `/clubs/:id`
- Guards applied: `authGuard` checks isLoggedIn(), `organizerGuard` checks role === 'organizer'

## Component Hierarchy

### Root Shell (AppComponent)
```
app.component.ts
├── template outlet (RouterOutlet)
├── ToastComponent (overlays notifications)
└── BottomNavComponent (4-tab nav, conditionally shown)
    └── showNav logic: isLoggedIn && not /login|/register
```

### Feature: Auth (core/auth/)
```
LoginComponent (features/auth/)
├── Form: email, password
├── AuthService.login() → navigate /home
├── Error toast on failure

RegisterComponent (features/auth/)
├── Form: displayName, email, password, role dropdown
├── AuthService.register() → navigate /home
└── Error toast on failure
```

### Feature: Home/Feed (features/home/)
```
HomeComponent
├── Signals:
│   ├── searchQuery, selectedFilters
│   ├── filters: pace, distance_min, city, date
├── OnInit: RunsService.loadRuns(filters)
├── Child: RunCardComponent (array)
│   ├── display: title, pace, distance, attendee count, date/time
│   ├── click → RunDetailDialogComponent (bottom sheet)
│   └── join button → toggleJoin() → local state update
└── ToastService: notifications
```

### Feature: Map (features/map/)
```
MapViewComponent
├── Google Maps JS API instance
├── MarkerClusterer (if ~10+ pins)
├── Geolocation: navigator.geolocation
├── OnInit: RunsService.loadRuns()
├── Click marker → RunDetailDialogComponent
└── Filter panel for city/pace (same as HomeComponent)
```

### Feature: Clubs (features/clubs/)

**ClubListComponent**
```
├── OnInit: ClubService.listClubs()
├── Child: ClubCardComponent (array)
│   ├── display: name, description, member_count, next_run_date
│   ├── click → navigate /clubs/:id
│   └── join button → ClubService.toggleJoin()
└── buttons: [Create Club] (if organizer)
```

**ClubProfileComponent**
```
├── Route param: :id
├── OnInit: ClubService.getClub(id)
├── Sub-sections:
│   ├── Header: name, description, logo, member_count
│   ├── Runs: ClubService.getClubRuns(id)
│   ├── Members: ClubService.getClubMembers(id)
│   └── Actions: [Join Club], [Create Run] (if organizer + owner)
└── child: RunCardComponent array
```

**CreateClubComponent** (organizerGuard)
```
├── Form: name, description, city, pace, tags
├── OnSubmit: ClubService.createClub() → navigate /clubs/:newId
└── Error/success toast
```

**CreateRunComponent** (organizerGuard)
```
├── Form:
│   ├── clubId dropdown (ClubService.getMyClubs())
│   ├── title, startAddress, endAddress
│   ├── start/end location pickers (Google Maps)
│   ├── date/time picker
│   ├── distanceKm, estimatedMinutes, pace, tags
├── Geocoding: GeocodingService.geocode() on address blur
├── OnSubmit: RunsService.createRun() → navigate /clubs/create-run (success toast)
└── canDeactivate guard: unsaved changes warning
```

**EditRunComponent** (organizerGuard)
```
├── Route param: :id
├── OnInit: RunsService.getRunById(id)
├── Form: Same as CreateRunComponent
├── Permissions: Only creator can edit
└── OnSubmit: RunsService.updateRun()
```

**OrganiserHomeComponent** (organizerGuard)
```
├── OnInit:
│   ├── RunsService.getMyRuns() → show created runs
│   ├── ClubService.getMyClubs() → show owned clubs
├── Tabs/sections:
│   ├── My Runs: list with [Edit], [Cancel], [Delete] buttons
│   ├── My Clubs: list with [View], [Edit], [Members] buttons
│   └── New Run: quick create button
└── RunOrganiserDialogComponent: Edit/view attendees
```

### Feature: Profile (features/profile/)
```
RunnerProfileComponent
├── OnInit: AuthService.currentUser
├── Display: displayName, email, strava_connected (placeholder)
├── My Runs: RunsService.getJoinedRuns()
├── Actions: [Logout], [Edit Profile] (not implemented yet)
└── RunCardComponent array: joined runs
```

## Core Services

### AuthService (core/services/auth.service.ts)
```
currentUser: Signal<KlubUser | null>  ← loads from localStorage on init
getUser(): Signal
isLoggedIn(): boolean
isOrganizer(): boolean
login(email, password): Observable
register(displayName, email, password, role): Observable
logout(): void
  └── clears localStorage, resets signal
```

**Session Persistence:**
- localStorage keys: `klub_token`, `klub_user`
- Restored on AppComponent init via authGuard checks
- Manual token refresh: not implemented (7d expiry)

### RunsService (core/services/runs.service.ts)
```
runs: Signal<RunEvent[]>
joinedRunIds: Signal<string[]>

loadRuns(filters?): void
  └── GET /api/runs with dynamic filters
  └── Maps API response to RunEvent[] signal

mapRun(raw): RunEvent
  └── Converts DB columns to frontend types (lat/lng parsing)

toggleJoin(runId): void
  └── POST /api/runs/:id/join
  └── Updates local state: joinedRunIds, attendees

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
getMyClubs(): Observable<Club[]>  ← clubs user owns
```

### GeocodingService (core/services/geocoding.service.ts)
```
geocode(address: string): Observable<{lat, lng, formatted_address}>
  └── GET /api/geocode?address= (server-side proxy)
  └── Used in CreateRunComponent on address blur
```

## Shared Components

**RunCardComponent** (shared/components/run-card/)
```
@Input() run: RunEvent
@Input() showJoinButton: boolean
@Output() clicked: EventEmitter<RunEvent>

template:
├── header: title, club chip (green badge showing club_name if run.club_name present)
├── body: start/end address, date, distance, pace, tags
├── footer: attendee count, join button (if input true)
└── styles: card layout, green accent color
```

**RunDetailDialogComponent** (shared/components/run-detail-dialog/)
```
@Input() run: RunEvent
@Input() showActions: boolean

template (bottom sheet):
├── Full run details
├── Attendees list (if available)
├── Actions: Join/Unjoin, Edit (if creator), Cancel (if creator)
└── Closes on backdrop click or [X]
```

**BottomNavComponent** (shared/components/bottom-nav/)
```
4 tabs (if authenticated):
├── Home (icon, label, route /home)
├── Map (icon, label, route /map)
├── Clubs (icon, label, route /clubs)
└── Profile/Dashboard (icon, label, route /profile or /organiser)
    └── Routes to /organiser if isOrganizer(), else /profile

styles: fixed bottom, safe-area-inset-bottom
```

**ToastComponent** (shared/components/toast/)
```
@Input() message: string
@Input() type: 'success' | 'error' | 'info'

template: Displays above bottom nav
styles: Slide-in animation, auto-dismiss 3s
```

**ConfirmModalComponent** (shared/components/confirm-modal/)
```
@Input() title: string
@Input() message: string
@Input() confirmLabel: string
@Input() destructive: boolean
@Output() confirmed: EventEmitter<void>
@Output() cancelled: EventEmitter<void>

template: Full-screen backdrop + centred modal card
styles: Destructive mode applies red confirm button
Used by: OrganiserHomeComponent (cancel/delete run actions)
Note: Replaces browser confirm() — Phase 3e
```

## Guards & Interceptors

**authGuard** (core/guards/auth.guard.ts)
```
CanActivateFn
├── Check: AuthService.isLoggedIn()
├── True: allow navigation
└── False: navigate /login
```

**organizerGuard** (core/guards/organizer.guard.ts)
```
CanActivateFn
├── Check: AuthService.isOrganizer()
├── True: allow navigation
└── False: navigate /home + error toast
```

**jwtInterceptor** (core/interceptors/jwt.interceptor.ts)
```
HttpInterceptorFn
├── On request: Get token from localStorage
├── Append: Authorization: Bearer {token}
└── On error 401: AuthService.logout() + navigate /login
```

## Configuration

**app.config.ts**
```
ApplicationConfig {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
}
```

**environment.ts**
```
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  googleMapsApiKey: 'AIzaSyAP5XxqUs9drdHjaU8ME_Kn8fAnIiqvGDE'
}
```

## File Organization

```
src/app/
├── app.component.ts          ← 36 lines (shell)
├── app.routes.ts             ← 19 lines (lazy routes + guards)
├── app.config.ts             ← 17 lines (DI + service worker)
├── core/
│   ├── guards/               (2 files)
│   ├── interceptors/         (1 file)
│   ├── models/               (1 file)
│   └── services/             (4 files)
├── features/
│   ├── auth/                 (2 components)
│   ├── clubs/                (7 components)
│   ├── home/                 (1 component)
│   ├── map/                  (1 component)
│   └── profile/              (1 component)
└── shared/
    ├── components/           (5 components)
    └── services/             (1 service: toast)
```

## Related Codemaps
- [architecture.md](architecture.md) — Data flow, monorepo setup
- [backend.md](backend.md) — API routes called by services
- [dependencies.md](dependencies.md) — npm packages, environment
