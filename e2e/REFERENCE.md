# KLUB E2E Testing Reference

## Overview

The KLUB E2E test suite provides comprehensive coverage of critical user journeys across the platform. Tests are written with Playwright using real component selectors and API mocking to ensure reliability.

## Test Organization

```
e2e/
├── user-journeys.spec.ts    ← Main test suite (15 tests)
├── runner-profile.spec.ts   ← Profile component tests (2 tests)
├── fixtures/
│   ├── auth.fixture.ts      ← Authentication helpers
│   └── api-mocks.ts         ← API response mocking
├── helpers/
│   └── selectors.ts         ← CSS selectors & locators
├── README.md                ← Full documentation
└── REFERENCE.md             ← This file
```

## Test Suite Breakdown

### Master Interaction Sweep (15 tests)

All tests in `user-journeys.spec.ts` are organized into a single test suite called "KLUB E2E: Master Interaction Sweep" which covers:

#### Authentication & Navigation
- **login flow** — Email + password entry, form submission, navigation to home
- **bottom nav navigation** — All 4 nav links (home, map, clubs, profile)

#### Profile Management
- **profile hero card displays user info** — Avatar, name, role, stats
- **settings menu interactions** — Open, view Strava/logout, close
- **profile tabs and run list** — Upcoming/past tab switching
- **settings menu strava connected badge** — Display connected status

#### Map & Exploration
- **map view and carousel interaction** — Map element, carousel dock, mini cards
- **carousel mini cards display run details** — Title, club, date, pace badge

#### Organizer Features
- **mode switching for organizers** — Runner ↔ organiser toggle
- **create run wizard 4-step flow** — Complete logistics → schedule → vibe → details flow
- **create run wizard back button navigation** — Back button, state preservation
- **create run FAB on map view for organizers** — Floating action button visibility/navigation
- **wizard progress bar updates correctly** — Progress indicator accuracy

#### Mobile & Touch
- **mobile carousel swipe and selection** — Touch interactions on Pixel 5

#### Error Handling
- **error handling on failed runs load** — Error banner display/dismissal

---

## Selectors Reference

All selectors are defined in `e2e/helpers/selectors.ts` based on actual component code.

### Login Page
```typescript
LOGIN_SELECTORS = {
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'button.submit',
  logo: '.logo',
  // ... more
}
```

### Bottom Navigation
```typescript
NAV_SELECTORS = {
  nav: 'app-bottom-nav nav.bottom-nav',
  homeLink: 'a[routerLink="/home"]',
  mapLink: 'a[routerLink="/map"]',
  clubsLink: 'a[routerLink="/clubs"]',
  profileLink: 'a[routerLink="/profile"]',
}
```

### Profile Page
```typescript
PROFILE_SELECTORS = {
  heroCard: '.hero-card',
  settingsButton: 'button.settings-btn',
  heroAvatar: '.hero-avatar',
  heroName: '.hero-name',
  modeToggle: '.mode-toggle',      // Organizer only
  tabContainer: '.tabs-container',
  tabBtn: '.tab-btn',
  runList: '.list',
  errorBanner: '.error-banner',
}
```

### Settings Menu
```typescript
SETTINGS_SELECTORS = {
  sheet: '.sheet',
  sheetTitle: '.sheet-title',
  closeButton: '.close-btn',
  stravaButton: '.strava-btn',
  stravaConnectedBadge: '.connected-badge',
  logoutButton: '.logout-btn',
}
```

### Map View
```typescript
MAP_SELECTORS = {
  mapElement: '.map-el',
  mapTitle: '.map-title',
  runsCount: '.runs-count',
  fab: '.fab',              // Create run (organizer only)
  locateButton: '.locate-btn',
  carouselDock: '.carousel-dock',
}
```

### Carousel
```typescript
CAROUSEL_SELECTORS = {
  scrollContainer: '.scroll-container',
  miniCard: '.mini-card',
  miniCardActive: '.mini-card.active',
  cardTitle: '.card-title',
  cardMeta: '.card-meta',
  cardBanner: '.card-banner',
}
```

### Wizard
```typescript
WIZARD_SELECTORS = {
  page: '.wizard-page',
  progressFill: '.progress-bar-fill',
  stepNum: '.step-num',
  stepName: '.step-name',
  backButton: '.btn-back',
  nextButton: '.btn-next',
  submitButton: '.btn-submit',
}
```

#### Wizard Step 1: Logistics
```typescript
WIZARD_STEP_LOGISTICS = {
  clubSelect: 'select.field-input',
  titleInput: 'input[placeholder="e.g. Saturday Morning 10K"]',
  startAddressInput: 'input[placeholder="e.g. Central Park South Entrance"]',
  endAddressInput: 'input[placeholder="e.g. Central Park Boathouse"]',
}
```

#### Wizard Step 2: Schedule
```typescript
WIZARD_STEP_SCHEDULE = {
  dateInput: 'input[type="date"]',
  timeInput: 'input[type="time"]',
  hintBox: '.hint-box',
}
```

#### Wizard Step 3: Vibe
```typescript
WIZARD_STEP_VIBE = {
  vibeCard: '.vibe-card',
  vibeCardSelected: '.vibe-card.selected',
}
```

#### Wizard Step 4: Details
```typescript
WIZARD_STEP_DETAILS = {
  maxAttendeesInput: 'input[type="number"]',
  tagsGrid: '.tags-grid',
  tagPill: '.tag-pill',
  tagPillActive: '.tag-pill.active',
  notesTextarea: 'textarea.field-input',
}
```

---

## Fixtures & Helpers

### Auth Fixture

```typescript
import { loginTestUser } from './fixtures/auth.fixture';

// Login as runner (default)
await loginTestUser(page);

// Login as organizer
await loginTestUser(page, { isOrganizer: true });

// Login with Strava connected
await loginTestUser(page, { stravaConnected: true });

// Custom user
await loginTestUser(page, {
  displayName: 'Custom Name',
  email: 'custom@example.com',
  isOrganizer: true,
  stravaConnected: true,
});
```

What it does:
- Sets JWT token in localStorage
- Sets user data in localStorage
- Navigates to home
- Mocks auth/me and user profile endpoints

### API Mocks

```typescript
import { setupApiMocks } from './fixtures/api-mocks';

// Called in beforeEach hook
await setupApiMocks(page);
```

What it mocks:
- `GET /api/runs` → Array of 3 mock runs
- `GET /api/clubs` → Mock club
- `GET /api/users/**` → Mock user profile
- `GET /api/runs/joined` → Mock joined runs
- `POST /api/runs` → Success with new run ID
- `**/api/auth/strava**` → Blocked (prevent OAuth redirect)
- `**/api/geocoding**` → Mock coordinates

---

## Common Test Patterns

### Test Basic Element Visibility

```typescript
test('my test', async ({ page }) => {
  await page.goto('/profile');

  // Check element is visible
  await expect(page.locator('.my-selector')).toBeVisible();
});
```

### Test Navigation

```typescript
test('navigate to page', async ({ page }) => {
  await page.locator('a[routerLink="/map"]').click();

  // Wait for URL change
  await page.waitForURL('**/map', { timeout: 5000 });

  // Verify content
  await expect(page.locator('.map-el')).toBeVisible();
});
```

### Test Form Input

```typescript
test('fill form', async ({ page }) => {
  // Text input
  await page.locator('input[type="text"]').fill('My Value');

  // Dropdown
  await page.locator('select').selectOption('option-value');

  // Checkbox
  await page.locator('input[type="checkbox"]').check();

  // Button
  await page.locator('button').click();
});
```

### Test Modal/Dialog

```typescript
test('open modal', async ({ page }) => {
  // Click trigger
  await page.locator('.settings-btn').click();

  // Wait for modal
  await expect(page.locator('.sheet')).toBeVisible();

  // Interact with modal
  await page.locator('.logout-btn').click();

  // Verify modal closes
  await expect(page.locator('.sheet')).not.toBeVisible();
});
```

### Test Conditional Content

```typescript
test('organizer features', async ({ page }) => {
  // Check if element visible
  const toggleVisible = await page.locator('.mode-toggle').isVisible();

  if (toggleVisible) {
    // Only run if organizer
    await page.locator('.mode-btn').last().click();
  }
});
```

### Test Error Handling

```typescript
test('handle error', async ({ page }) => {
  // Break API
  await page.route('**/api/runs/**', route => {
    route.abort('failed');
  });

  await page.goto('/profile');

  // Verify error
  await expect(page.locator('.error-banner')).toBeVisible();
});
```

### Test Mobile Touch

```typescript
test('mobile touch', async ({ page }) => {
  // This runs on Pixel 5 (from playwright.config.ts)

  // Tap instead of click
  await page.locator('.mini-card').first().tap();

  // Scroll
  await page.locator('.scroll-container').evaluate(el => {
    el.scrollLeft += 100;
  });
});
```

---

## Running Tests

### All tests (desktop)
```bash
npm run test:e2e
```

### Mobile only (Pixel 5)
```bash
npm run test:e2e:mobile
```

### With browser visible
```bash
npm run test:e2e:headed
```

### Debug mode (with inspector)
```bash
npm run test:e2e:debug
```

### Specific test by name
```bash
npx playwright test -g "login flow"
```

### Check for flakiness
```bash
npx playwright test --repeat-each=5
```

### View results
```bash
npx playwright show-report
```

---

## Configuration

### playwright.config.ts

```typescript
{
  testDir: './e2e',
  timeout: 30_000,              // 30 seconds per test
  use: {
    baseURL: 'http://localhost:4201',
    trace: 'on-first-retry',    // Trace failures
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev:frontend',
    url: 'http://localhost:4201',
    reuseExistingServer: !process.env['CI'],
  },
}
```

---

## Debugging

### See what failed
```bash
npx playwright show-report
```

Opens browser with:
- Screenshot of failure
- Video recording (if enabled)
- Trace file (network/DOM/console)

### Run single test with debug
```bash
npx playwright test -g "login flow" --debug
```

Opens Playwright Inspector:
- Step through test
- Inspect DOM
- Run console commands
- Evaluate selectors

### Print to console
```typescript
console.log('Debug info:', value);
```

### Inspect selector
```typescript
// In test
const element = page.locator('.my-selector');
const box = await element.boundingBox();
console.log('Element:', box);
```

### Wait and pause
```typescript
await page.waitForTimeout(2000);  // Wait 2 seconds
```

---

## Best Practices

### DO

- ✓ Use semantic selectors: `[routerLink="/home"]` > `.nav-home`
- ✓ Wait for conditions: `waitForURL()` > `waitForTimeout()`
- ✓ Test user workflows: Login → Navigate → Interact
- ✓ Mock API responses: Keep tests fast and isolated
- ✓ Use consistent naming: `test('action with outcome')`
- ✓ Isolate tests: No shared state between tests
- ✓ Add clear comments: Explain complex steps

### DON'T

- ✗ Use brittle selectors: XPath, deeply nested CSS
- ✗ Sleep for fixed times: `page.waitForTimeout(1000)`
- ✗ Depend on test order: Each test must be independent
- ✗ Use vague names: `test('test 1')`
- ✗ Hardcode delays: Use proper waits
- ✗ Test CSS styling: E2E tests check functionality, not colors
- ✗ Test internal logic: That's unit test job

---

## Maintenance

### When UI Changes

1. Read the component template
2. Find the actual CSS class or attribute
3. Update selector in `e2e/helpers/selectors.ts`
4. Run tests to verify

Example:
```typescript
// Component changed button class
// OLD: button.submit
// NEW: button.btn-login

BUTTON_SUBMIT: 'button.btn-login',
```

### When API Changes

1. Update mock response in `e2e/fixtures/api-mocks.ts`
2. Update test assertions if needed
3. Run tests to verify

### When Tests Fail

1. Check if UI actually changed
2. Check if selector is correct (run test --headed)
3. Check if API mock matches reality
4. Check browser console for errors
5. Run with `--debug` to step through

---

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Install dependencies
  run: npm install

- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

### Configuration for CI

```typescript
// playwright.config.ts
const config = {
  // ...
  retries: process.env['CI'] ? 2 : 0,      // Retry twice in CI
  workers: process.env['CI'] ? 1 : null,   // Single worker in CI
  reporter: 'html',                        // HTML report
}
```

---

## Troubleshooting

### "Test timeout"
- Check frontend is running: `npm run dev:frontend`
- Check selector is correct: Run with `--headed`
- Increase timeout: `{ timeout: 60_000 }`

### "Cannot find element"
- Run with `--headed` to see browser
- Check selector in DevTools
- Run `npx playwright test --debug`

### "Navigation failed"
- Check URL is correct: `waitForURL('**/path')`
- Check auth is set up
- Check API mocks are set up

### "Flaky test"
- Add proper waits: `waitForURL()` not `waitForTimeout()`
- Check for race conditions
- Run with `--repeat-each=5` to identify

### "Test passes locally, fails in CI"
- Check browser versions: Use same Playwright version
- Check environment: CI might have different timezone
- Check for timing issues: CI slower than local

---

## Performance Tips

- Use `waitForURL()` instead of `reload()` where possible
- Mock all API calls: No real backend calls
- Run tests in parallel when possible
- Keep tests focused: One user journey per test
- Use `@focus` tag to run single test during dev

---

## Resources

- **Playwright Docs:** https://playwright.dev
- **Best Practices:** https://playwright.dev/docs/best-practices
- **Test Isolation:** https://playwright.dev/docs/test-isolation
- **Selectors:** https://playwright.dev/docs/locators
- **Debugging:** https://playwright.dev/docs/debug

---

Last Updated: 2024-03-28
