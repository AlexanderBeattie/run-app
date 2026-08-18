# KLUB E2E Test Suite

Comprehensive Playwright E2E tests for the KLUB run club discovery platform.

## Overview

This test suite covers critical user journeys across the platform:

1. **Authentication** — Login flow and session management
2. **Navigation** — Bottom navigation between home, map, clubs, and profile
3. **Profile & Settings** — User profile, stats, mode switching (organizer), and settings menu
4. **Map View** — Map rendering and carousel interaction
5. **Wizard Flow** — 4-step create run wizard (logistics → schedule → vibe → details)
6. **Mobile Interactions** — Touch gestures and responsive behavior on Pixel 5
7. **Error Handling** — Graceful degradation on API failures

## Files

```
e2e/
├── user-journeys.spec.ts       # Main test suite (10 tests)
├── runner-profile.spec.ts      # Existing profile tests
├── fixtures/
│   ├── auth.fixture.ts         # Login and authentication mocking
│   └── api-mocks.ts            # API response mocking
├── helpers/
│   └── selectors.ts            # Centralized selector constants
└── README.md                   # This file
```

## Setup

### Install Dependencies

Playwright is already in `package.json`. Install browser binaries:

```bash
npx playwright install --with-deps chromium
```

### Configuration

`playwright.config.ts` includes:
- **Desktop Chrome** — Full desktop browser tests
- **Mobile Chrome (Pixel 5)** — Mobile device emulation
- Timeout: 30 seconds per test
- Screenshot capture on failure
- Trace recording on retry

## Running Tests

### All Tests (Desktop)
```bash
npm run test:e2e
```

### Mobile Tests Only
```bash
npm run test:e2e:mobile
```

### Run Headed (See Browser)
```bash
npm run test:e2e:headed
```

### Debug Mode (Inspector)
```bash
npm run test:e2e:debug
```

### Specific Test File
```bash
npx playwright test e2e/user-journeys.spec.ts
```

### Specific Test
```bash
npx playwright test -g "login flow"
```

### List All Tests
```bash
npx playwright test --list
```

### View HTML Report
```bash
npx playwright show-report
```

## Test Coverage

### 1. Login Flow (`login flow`)
- Navigate to `/login`
- Verify login form rendered
- Fill email and password
- Mock successful login response
- Verify navigation to `/home`

**Validates**: Authentication endpoint integration, form submission, routing after login

### 2. Bottom Navigation (`bottom nav navigation`)
- Test all 4 nav links: Home, Map, Clubs, Profile
- Verify URL changes on click
- Verify active state updates

**Validates**: Router integration, nav state synchronization, routing guard behavior

### 3. Profile & Settings (`profile page and settings menu`)
- Verify hero card with user info (avatar, name, role, stats)
- Open settings menu
- Verify Strava integration section
- Verify logout button
- Close settings

**Validates**: Profile data display, settings sheet appearance, integration links

### 4. Profile Tabs (`profile tabs and run list`)
- Verify upcoming/past run tabs
- Mock joined runs data
- Verify run list renders

**Validates**: Segmented control interaction, data binding, list rendering

### 5. Map View (`map view and carousel interaction`)
- Navigate to map view
- Verify map header and element
- Verify carousel dock (if runs exist)
- Click carousel card
- Verify locate button

**Validates**: Map component integration, carousel rendering, touch interactions

### 6. Mode Switching (`mode switching for organizers`)
- Setup organizer user
- Navigate to profile
- Verify mode toggle (runner/organiser)
- Switch to organiser mode
- Verify button state changes

**Validates**: Conditional rendering, signal-based state, role-based UI

### 7. Create Run Wizard (`create run wizard 4-step flow`)
- Navigate to `/clubs/create-run`
- **Step 1 (Logistics)**: Fill club, title, start/end addresses
- **Step 2 (Schedule)**: Fill date and time
- **Step 3 (Vibe)**: Select pace (easy/social/moderate/fast/tempo)
- **Step 4 (Details)**: [TODO] Fill additional fields
- Mock run creation endpoint
- Verify form progression

**Validates**: Multi-step wizard flow, form field binding, API integration, error handling

### 8. Mobile Carousel (`mobile carousel swipe on map`)
- Navigate to map on Mobile Chrome
- Verify carousel container
- Tap carousel card
- Verify scroll/selection change

**Validates**: Mobile gesture handling, responsive carousel, device-specific behavior

### 9. Settings Strava Section (`settings menu strava integration section`)
- Open settings menu
- Verify Integrations section label
- Verify Strava button (Connect or Connected state)
- Verify Account section
- Verify logout button

**Validates**: Settings menu UI structure, conditional rendering based on connection state

### 10. Error Handling (`error handling on failed runs load`)
- Abort joined runs endpoint
- Navigate to profile
- Verify error banner appears
- Verify error message readable
- Verify close button works

**Validates**: Error boundary display, user-friendly error messages, error recovery

## API Mocking Strategy

### `setupApiMocks(page)` in `e2e/fixtures/api-mocks.ts`

Intercepts and mocks:
- `GET **/api/runs` → Array of 3 mock runs
- `POST **/api/runs` → Success with new run ID
- `GET **/api/clubs` → Array of 1 mock club
- `POST **/api/clubs` → Success with new club ID
- `GET **/api/clubs/:id` → Single club details
- `GET **/api/users/**` → User profile data
- `GET **/api/runs/joined` → Array of joined runs
- `**/api/auth/strava**` → Abort (prevent OAuth redirect)
- `**/api/geocoding**` → Glasgow coordinates (55.8642, -4.2518)

### Authentication

Use `loginTestUser(page)` fixture to:
1. Set JWT token in localStorage
2. Set user object in localStorage
3. Navigate to `/home` with authenticated session

Alternatively, use `submitLoginForm(page, email, password)` to test the login form itself.

## Selectors Reference

Centralized in `e2e/helpers/selectors.ts`:

### Login Page
- `emailInput` — Email input field
- `passwordInput` — Password input field
- `submitButton` — Login submit button
- `forgotPasswordLink` — Forgot password link
- `errorMessage` — Error message display

### Navigation
- `nav` — Bottom nav container
- `homeLink`, `mapLink`, `clubsLink`, `profileLink` — Nav links
- `navItemActive` — Active nav item

### Profile
- `heroCard` — Hero/header card
- `settingsButton` — Settings gear button
- `modeToggle` — Runner/Organiser toggle
- `tabBtn` — Upcoming/Past tabs
- `runList` — Run list container

### Settings
- `sheet` — Settings bottom sheet
- `stravaButton` — Strava connect button
- `logoutButton` — Logout button
- `overlay` — Overlay backdrop

### Carousel (Map)
- `carouselDock` — Carousel container at bottom of map
- `scrollContainer` — Horizontal scroll container
- `miniCard` — Individual run card
- `miniCardActive` — Card with active state

### Wizard
- `progressBar` — Progress indicator
- `stepName` — Current step label
- `nextButton` — Next step button
- `submitButton` — Final submit button

## TODOs and Known Issues

### Incomplete Implementations

1. **Step Details Component** (`create-run-wizard` test)
   - Needs to read `StepDetailsComponent` for exact field selectors
   - TODO: Add assertions for distance, description fields

2. **Carousel Scroll Position** (`map view` and `mobile carousel` tests)
   - TODO: Verify scroll position changes after card selection
   - TODO: Add scroll delta assertions

3. **Vibe Card Selection** (`create-run-wizard` test)
   - TODO: Verify `.selected` class appears on clicked card
   - TODO: Test multiple pace options

4. **Dialog Opening** (map carousel interaction)
   - TODO: Verify run detail dialog opens on carousel card click
   - TODO: Test dialog content matches selected run

5. **Geolocation Mocking** (locate button)
   - TODO: Add geolocation mock for locate button test
   - TODO: Verify map centers on user location

### Mobile-Specific Gaps

- Swipe gestures: Currently using `.tap()`, could enhance with drag simulation
- Viewport-specific assertions: Some tests may need viewport checks
- Safe area padding: Test iOS safe area handling (Pixel 5 doesn't have notch)

## Flaky Test Handling

### Running Tests Multiple Times

To check for flakiness:
```bash
npx playwright test --repeat-each=5
```

### Quarantining Flaky Tests

If a test is intermittently failing:

```typescript
test.fixme(true, 'Issue #123: Timing issue with carousel scroll')
test('carousel scroll sometimes misses final card', async ({ page }) => {
  // test code
})
```

Or use `test.skip()` to disable temporarily:

```typescript
test.skip('flaky feature', async ({ page }) => {
  // will not run
})
```

### Common Causes

1. **Network timing** — Use `waitForResponse()` instead of `waitForTimeout()`
2. **Animation timing** — Add longer waits or use `waitUntil: 'networkidle'`
3. **Locator races** — Use `page.getByRole()` for better auto-waiting
4. **Stale element** — Re-query locators if content updates

## Best Practices

### Do's
✓ Use `page.getByRole()`, `page.getByText()`, `page.getByLabel()`
✓ Wait for network: `waitForURL()`, `waitForResponse()`, `waitForNavigation()`
✓ Use `waitUntil: 'networkidle'` for page loads
✓ Test from user perspective, not implementation
✓ Isolate tests — each test sets up its own data

### Don'ts
✗ Don't use `waitForTimeout()` for waits
✗ Don't rely on hardcoded delays
✗ Don't share state between tests (use `beforeEach`)
✗ Don't test CSS selectors directly (test behavior)
✗ Don't leave tests pending — use `.fixme()` or `.skip()` if needed

## CI/CD Integration

Tests are configured to run in CI with:
- `retries: 2` — Retry flaky tests up to 2 times
- `workers: 1` — Run sequentially to avoid port conflicts
- `forbidOnly: true` — Fail if `.only` is left in code
- Trace recording on first retry

### GitHub Actions Example

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Debugging

### Enable Verbose Output
```bash
DEBUG=pw:api npx playwright test
```

### Run Single Test with Inspector
```bash
npx playwright test -g "login flow" --debug
```

### Generate Trace for Failed Test
```bash
npx playwright test --trace on
```

Then view trace:
```bash
npx playwright show-trace trace.zip
```

### Take Screenshots
```bash
npx playwright test --screenshot=on
```

Screenshots saved to test results directory.

## Contributing

When adding new tests:

1. **Read actual component files** — Don't guess selectors
2. **Use semantic locators** — `getByRole()` > `getByText()` > CSS selectors
3. **Mock API responses** — Use `setupApiMocks(page)` or custom routes
4. **Test from user POV** — Focus on what users see/do
5. **Add TODO comments** — Mark incomplete assertions for future work
6. **Keep tests isolated** — Use `beforeEach` to reset state
7. **Test critical paths** — Prioritize high-risk journeys (auth, payments, creation)

## References

- [Playwright Docs](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Accessibility](https://playwright.dev/docs/accessibility-testing)
- [Debugging Tests](https://playwright.dev/docs/debug)
