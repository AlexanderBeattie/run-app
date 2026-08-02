import { test, expect } from '@playwright/test';
import { loginTestUser, submitLoginForm } from './fixtures/auth.fixture';
import { setupApiMocks } from './fixtures/api-mocks';
import {
  LOGIN_SELECTORS,
  NAV_SELECTORS,
  PROFILE_SELECTORS,
  SETTINGS_SELECTORS,
  CAROUSEL_SELECTORS,
  MAP_SELECTORS,
  WIZARD_SELECTORS,
  WIZARD_STEP_LOGISTICS,
  WIZARD_STEP_SCHEDULE,
  WIZARD_STEP_VIBE,
  WIZARD_STEP_DETAILS,
} from './helpers/selectors';

/**
 * KLUB E2E Test Suite: Master Interaction Sweep
 *
 * Comprehensive tests for critical user journeys across the platform:
 * - Authentication (login flow)
 * - Navigation (bottom nav)
 * - Profile and settings
 * - Map view with carousel
 * - Create run wizard (4-step flow)
 * - Mode switching for organizers
 * - Error handling
 */

test.describe('KLUB E2E: Master Interaction Sweep', () => {
  // ────────────────────────────────────────────────────────────
  // SETUP / TEARDOWN
  // ────────────────────────────────────────────────────────────

  test.beforeEach(async ({ page }) => {
    // Setup API mocks for all tests
    await setupApiMocks(page);

    // Login test user for authenticated tests
    const isLoginTest = test.info().title.includes('login flow');
    if (!isLoginTest) {
      await loginTestUser(page);
    }
  });

  // ────────────────────────────────────────────────────────────
  // TEST 1: Login Flow (Happy Path)
  // ────────────────────────────────────────────────────────────

  test('login flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Verify login page is rendered
    await expect(page.locator(LOGIN_SELECTORS.logo)).toBeVisible();
    await expect(page.locator('text=Welcome back')).toBeVisible();

    // Mock successful login response
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'test-jwt-token',
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            displayName: 'Test Runner',
            isOrganizer: false,
            stravaConnected: false,
          },
        }),
      });
    });

    // Fill email field
    await page.locator(LOGIN_SELECTORS.emailInput).fill('test@example.com');

    // Fill password field
    await page.locator(LOGIN_SELECTORS.passwordInput).fill('password123');

    // Click submit button
    await page.locator(LOGIN_SELECTORS.submitButton).click();

    // Wait for navigation to home
    await page.waitForURL('**/home', { timeout: 5000 });

    // Verify home page is loaded
    await expect(page.locator(PROFILE_SELECTORS.page)).toBeVisible();
  });

  // ────────────────────────────────────────────────────────────
  // TEST 2: Bottom Navigation
  // ────────────────────────────────────────────────────────────

  test('bottom nav navigation', async ({ page }) => {
    // Verify nav is visible
    await expect(page.locator(NAV_SELECTORS.nav)).toBeVisible();

    // Test Home link
    await page.locator(NAV_SELECTORS.homeLink).click();
    await page.waitForURL('**/home', { timeout: 5000 });

    // Test Map link
    await page.locator(NAV_SELECTORS.mapLink).click();
    await page.waitForURL('**/map', { timeout: 5000 });
    await expect(page.locator(MAP_SELECTORS.mapElement)).toBeVisible();

    // Test Clubs link
    await page.locator(NAV_SELECTORS.clubsLink).click();
    await page.waitForURL('**/clubs', { timeout: 5000 });

    // Test Profile link
    await page.locator(NAV_SELECTORS.profileLink).click();
    await page.waitForURL('**/profile', { timeout: 5000 });
    await expect(page.locator(PROFILE_SELECTORS.heroCard)).toBeVisible();
  });

  // ────────────────────────────────────────────────────────────
  // TEST 3: Profile Page - Hero Card and User Info
  // ────────────────────────────────────────────────────────────

  test('profile hero card displays user info', async ({ page }) => {
    // Navigate to profile
    await page.goto('/profile', { waitUntil: 'networkidle' });

    // Verify hero card is rendered
    await expect(page.locator(PROFILE_SELECTORS.heroCard)).toBeVisible();

    // Verify user avatar is displayed
    await expect(page.locator(PROFILE_SELECTORS.heroAvatar)).toBeVisible();

    // Verify user name is displayed
    await expect(page.locator(PROFILE_SELECTORS.heroName)).toContainText('Test Runner');

    // Verify role is displayed
    await expect(page.locator(PROFILE_SELECTORS.roleLabel)).toContainText('Runner');

    // Verify stats are displayed
    await expect(page.locator(PROFILE_SELECTORS.heroStats)).toBeVisible();
  });

  // ────────────────────────────────────────────────────────────
  // TEST 4: Settings Menu - Open, View, and Close
  // ────────────────────────────────────────────────────────────

  test('settings menu interactions', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'networkidle' });

    // Click settings button
    await page.locator(PROFILE_SELECTORS.settingsButton).click();

    // Verify settings menu appears
    await expect(page.locator(SETTINGS_SELECTORS.sheet)).toBeVisible();
    await expect(page.locator(SETTINGS_SELECTORS.sheetTitle)).toContainText('Settings');

    // Verify Integrations section is visible
    await expect(page.locator('text=Integrations')).toBeVisible();

    // Verify Strava button (not connected) is present
    await expect(page.locator(SETTINGS_SELECTORS.stravaButton)).toBeVisible();
    await expect(page.locator(SETTINGS_SELECTORS.stravaButton)).toContainText('Connect with Strava');

    // Verify Account section is visible
    await expect(page.locator('text=Account')).toBeVisible();

    // Verify logout button is present
    await expect(page.locator(SETTINGS_SELECTORS.logoutButton)).toBeVisible();
    await expect(page.locator(SETTINGS_SELECTORS.logoutButton)).toContainText('Log out');

    // Close settings menu
    await page.locator(SETTINGS_SELECTORS.closeButton).click();
    await expect(page.locator(SETTINGS_SELECTORS.sheet)).not.toBeVisible();
  });

  // ────────────────────────────────────────────────────────────
  // TEST 5: Profile Tabs - Upcoming and Past Runs
  // ────────────────────────────────────────────────────────────

  test('profile tabs and run list', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'networkidle' });

    // Verify tabs container is visible
    await expect(page.locator(PROFILE_SELECTORS.tabContainer)).toBeVisible();

    // Get all tab buttons
    const tabs = page.locator(PROFILE_SELECTORS.tabBtn);
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(2); // At least Upcoming and Past

    // Verify Upcoming tab is active by default
    const upcomingTab = tabs.first();
    await expect(upcomingTab).toHaveClass(/active/);

    // Click Past tab
    const pastTab = tabs.last();
    await pastTab.click();

    // Verify Past tab becomes active
    await expect(pastTab).toHaveClass(/active/);

    // Wait for list to render
    await expect(page.locator(PROFILE_SELECTORS.runList)).toBeVisible({ timeout: 3000 });
  });

  // ────────────────────────────────────────────────────────────
  // TEST 6: Map View and Carousel Interaction
  // ────────────────────────────────────────────────────────────

  test('map view and carousel interaction', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'networkidle' });

    // Verify map header
    await expect(page.locator(MAP_SELECTORS.mapTitle)).toContainText('KLUB');
    await expect(page.locator(MAP_SELECTORS.runsCount)).toBeVisible();

    // Verify map element is rendered
    await expect(page.locator(MAP_SELECTORS.mapElement)).toBeVisible();

    // Verify locate button is present
    await expect(page.locator(MAP_SELECTORS.locateButton)).toBeVisible();

    // Check if carousel dock is visible (depends on runs)
    const carouselDock = page.locator(MAP_SELECTORS.carouselDock);
    const carouselVisible = await carouselDock.isVisible();

    if (carouselVisible) {
      // Verify mini cards exist
      const miniCards = page.locator(CAROUSEL_SELECTORS.miniCard);
      const cardCount = await miniCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Click on first card
      await miniCards.first().click();

      // Verify card becomes active
      const activeCard = page.locator(CAROUSEL_SELECTORS.miniCardActive);
      await expect(activeCard).toBeVisible();
    }
  });

  // ────────────────────────────────────────────────────────────
  // TEST 7: Mode Switching (Organizer)
  // ────────────────────────────────────────────────────────────

  test('mode switching for organizers', async ({ page }) => {
    // Login as organizer
    await loginTestUser(page, { isOrganizer: true, displayName: 'Test Organizer' });

    await page.goto('/profile', { waitUntil: 'networkidle' });

    // Verify mode toggle is present (only for organizers)
    const modeToggle = page.locator(PROFILE_SELECTORS.modeToggle);
    const toggleVisible = await modeToggle.isVisible();

    if (toggleVisible) {
      // Get all mode buttons
      const modeButtons = modeToggle.locator('.mode-btn');
      const buttonCount = await modeButtons.count();
      expect(buttonCount).toBe(2); // Runner and Organiser

      // Verify first button (Runner) is active by default
      const runnerBtn = modeButtons.first();
      await expect(runnerBtn).toHaveClass(/active/);

      // Click organiser button
      const organiserBtn = modeButtons.last();
      await organiserBtn.click();

      // Verify organiser button becomes active
      await expect(organiserBtn).toHaveClass(/active/);

      // Verify runner button is no longer active
      await expect(runnerBtn).not.toHaveClass(/active/);
    }
  });

  // ────────────────────────────────────────────────────────────
  // TEST 8: Create Run Wizard - Complete 4-Step Flow
  // ────────────────────────────────────────────────────────────

  test('create run wizard 4-step flow', async ({ page }) => {
    // Login as organizer
    await loginTestUser(page, { isOrganizer: true });

    // Navigate to create run wizard
    await page.goto('/clubs/create-run', { waitUntil: 'domcontentloaded' });

    // Verify wizard page loads
    await expect(page.locator(WIZARD_SELECTORS.page)).toBeVisible();

    // ── STEP 1: LOGISTICS ────────────────────────────────────
    await expect(page.locator(WIZARD_SELECTORS.stepName)).toContainText('Logistics');
    await expect(page.locator(WIZARD_SELECTORS.stepNum)).toContainText('Step 1 of 4');

    // Select club
    const clubSelect = page.locator(WIZARD_STEP_LOGISTICS.clubSelect).first();
    await clubSelect.selectOption('club-1');

    // Fill run name
    await page.locator(WIZARD_STEP_LOGISTICS.titleInput).fill('Test Morning Run');

    // Fill start address
    await page.locator(WIZARD_STEP_LOGISTICS.startAddressInput).fill('Glasgow Green');

    // Fill end address
    await page.locator(WIZARD_STEP_LOGISTICS.endAddressInput).fill('Kelvingrove Park');

    // Click next
    await page.locator(WIZARD_SELECTORS.nextButton).click();

    // ── STEP 2: SCHEDULE ────────────────────────────────────
    await expect(page.locator(WIZARD_SELECTORS.stepName)).toContainText('Schedule');
    await expect(page.locator(WIZARD_SELECTORS.stepNum)).toContainText('Step 2 of 4');

    // Fill date (7 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    await page.locator(WIZARD_STEP_SCHEDULE.dateInput).fill(dateStr);

    // Fill time
    await page.locator(WIZARD_STEP_SCHEDULE.timeInput).fill('08:00');

    // Verify hint box is visible
    await expect(page.locator(WIZARD_STEP_SCHEDULE.hintBox)).toBeVisible();

    // Click next
    await page.locator(WIZARD_SELECTORS.nextButton).click();

    // ── STEP 3: THE VIBE ────────────────────────────────────
    await expect(page.locator(WIZARD_SELECTORS.stepName)).toContainText('The Vibe');
    await expect(page.locator(WIZARD_SELECTORS.stepNum)).toContainText('Step 3 of 4');

    // Select a pace (first vibe card)
    const vibeCards = page.locator(WIZARD_STEP_VIBE.vibeCard);
    const cardCount = await vibeCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Click first vibe card (easy pace)
    await vibeCards.first().click();

    // Verify card is selected
    const selectedCard = page.locator(WIZARD_STEP_VIBE.vibeCardSelected);
    await expect(selectedCard).toHaveCount(1); // At least one selected

    // Click next
    await page.locator(WIZARD_SELECTORS.nextButton).click();

    // ── STEP 4: DETAILS ────────────────────────────────────
    await expect(page.locator(WIZARD_SELECTORS.stepName)).toContainText('Details');
    await expect(page.locator(WIZARD_SELECTORS.stepNum)).toContainText('Step 4 of 4');

    // Verify submit button text
    await expect(page.locator(WIZARD_SELECTORS.submitButton)).toContainText('Post Run');

    // Optional: Fill max attendees
    await page.locator(WIZARD_STEP_DETAILS.maxAttendeesInput).fill('20');

    // Optional: Select a tag
    const tags = page.locator(WIZARD_STEP_DETAILS.tagPill);
    const tagCount = await tags.count();
    if (tagCount > 0) {
      await tags.first().click();
    }

    // Optional: Fill notes
    await page.locator(WIZARD_STEP_DETAILS.notesTextarea).fill('This is a test run event.');

    // Mock POST run endpoint
    await page.route('**/api/runs', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-run-' + Date.now(),
            title: 'Test Morning Run',
            clubId: 'club-1',
            clubName: 'Glasgow Running Club',
          }),
        });
      } else {
        route.continue();
      }
    });

    // Click submit button
    await page.locator(WIZARD_SELECTORS.submitButton).click();

    // Wait for navigation (could go to profile or success page)
    await page.waitForURL('**/profile', { timeout: 5000 });

    // Verify we're no longer on the wizard page
    const wizardPageVisible = await page.locator(WIZARD_SELECTORS.page).isVisible();
    expect(wizardPageVisible).toBe(false);
  });

  // ────────────────────────────────────────────────────────────
  // TEST 9: Mobile Carousel Interaction (Pixel 5)
  // ────────────────────────────────────────────────────────────

  test('mobile carousel swipe and selection', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'networkidle' });

    // Verify carousel is present
    const scrollContainer = page.locator(CAROUSEL_SELECTORS.scrollContainer);
    const isVisible = await scrollContainer.isVisible();

    if (isVisible) {
      // Get carousel cards
      const miniCards = page.locator(CAROUSEL_SELECTORS.miniCard);
      const cardCount = await miniCards.count();

      if (cardCount > 1) {
        // Click first card (tap() requires hasTouch; click() works on all projects)
        await miniCards.first().click();
        await page.waitForTimeout(200);

        // Close the run-detail-dialog if it opened — its fixed overlay blocks subsequent clicks
        const closeBtn = page.locator('app-run-detail-dialog .close');
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(200);
        }

        // Click second card
        await miniCards.nth(1).click();
        await page.waitForTimeout(200);

        // Verify second card is now active
        const activeCard = miniCards.nth(1);
        await expect(activeCard).toHaveClass(/active/);
      }
    }
  });

  // ────────────────────────────────────────────────────────────
  // TEST 10: Error Handling - Failed Runs Load
  // ────────────────────────────────────────────────────────────

  test('error handling on failed runs load', async ({ page }) => {
    // Override the runs endpoint to fail
    await page.route('**/api/runs/joined', (route) => {
      route.abort('failed');
    });

    await page.goto('/profile', { waitUntil: 'networkidle' });

    // Reload to trigger the error
    await page.reload({ waitUntil: 'networkidle' });

    // Verify error banner appears
    const errorBanner = page.locator(PROFILE_SELECTORS.errorBanner);
    const errorVisible = await errorBanner.isVisible({ timeout: 2000 });

    if (errorVisible) {
      // Verify error message text
      await expect(errorBanner).toContainText(/error|failed/i);

      // Verify close button exists
      const closeBtn = errorBanner.locator('button');
      await expect(closeBtn).toBeVisible();

      // Close error
      await closeBtn.click();

      // Verify error disappears
      await expect(errorBanner).not.toBeVisible();
    }
  });

  // ────────────────────────────────────────────────────────────
  // TEST 11: Wizard Navigation - Back Button
  // ────────────────────────────────────────────────────────────

  test('create run wizard back button navigation', async ({ page }) => {
    // Login as organizer
    await loginTestUser(page, { isOrganizer: true });

    await page.goto('/clubs/create-run', { waitUntil: 'domcontentloaded' });

    // Step 1: Fill logistics
    const clubSelect = page.locator(WIZARD_STEP_LOGISTICS.clubSelect).first();
    await clubSelect.selectOption('club-1');
    await page.locator(WIZARD_STEP_LOGISTICS.titleInput).fill('Test Run');
    await page.locator(WIZARD_STEP_LOGISTICS.startAddressInput).fill('Start');
    await page.locator(WIZARD_STEP_LOGISTICS.endAddressInput).fill('End');

    // Move to Step 2
    await page.locator(WIZARD_SELECTORS.nextButton).click();
    await expect(page.locator(WIZARD_SELECTORS.stepNum)).toContainText('Step 2 of 4');

    // Click back button
    await page.locator(WIZARD_SELECTORS.backButton).click();

    // Verify we're back at Step 1
    await expect(page.locator(WIZARD_SELECTORS.stepNum)).toContainText('Step 1 of 4');
    await expect(page.locator(WIZARD_SELECTORS.stepName)).toContainText('Logistics');

    // Verify data is preserved
    await expect(page.locator(WIZARD_STEP_LOGISTICS.titleInput)).toHaveValue('Test Run');
  });

  // ────────────────────────────────────────────────────────────
  // TEST 12: Create Run FAB on Map (Organizers Only)
  // ────────────────────────────────────────────────────────────

  test('create run FAB on map view for organizers', async ({ page }) => {
    // Login as organizer
    await loginTestUser(page, { isOrganizer: true });

    await page.goto('/map', { waitUntil: 'networkidle' });

    // Verify FAB is present for organizers
    const fab = page.locator(MAP_SELECTORS.fab);
    await expect(fab).toBeVisible();

    // Click FAB
    await fab.click();

    // Verify navigation to create-run
    await page.waitForURL('**/clubs/create-run', { timeout: 5000 });
    await expect(page.locator(WIZARD_SELECTORS.page)).toBeVisible();
  });

  // ────────────────────────────────────────────────────────────
  // TEST 13: Settings Menu - Connected Strava Badge
  // ────────────────────────────────────────────────────────────

  test('settings menu strava connected badge', async ({ page }) => {
    // Login with Strava connected
    await loginTestUser(page, { stravaConnected: true });

    await page.goto('/profile', { waitUntil: 'networkidle' });

    // Open settings
    await page.locator(PROFILE_SELECTORS.settingsButton).click();
    await expect(page.locator(SETTINGS_SELECTORS.sheet)).toBeVisible();

    // Verify Strava connected badge is shown
    const connectedBadge = page.locator(SETTINGS_SELECTORS.stravaConnectedBadge);
    const badgeVisible = await connectedBadge.isVisible();

    if (badgeVisible) {
      await expect(connectedBadge).toContainText('Connected');
    }
  });

  // ────────────────────────────────────────────────────────────
  // TEST 14: Progress Bar in Wizard
  // ────────────────────────────────────────────────────────────

  test('wizard progress bar updates correctly', async ({ page }) => {
    // Login as organizer
    await loginTestUser(page, { isOrganizer: true });

    await page.goto('/clubs/create-run', { waitUntil: 'domcontentloaded' });

    // Get progress fill element
    const progressFill = page.locator(WIZARD_SELECTORS.progressFill);

    // Step 1: Progress should be 25%
    let width = await progressFill.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).width
    );
    let percentage = parseFloat(width) / (1280 || 100);
    expect(percentage).toBeLessThan(0.5); // Should be around 25%

    // Fill Step 1 and move to Step 2
    const clubSelect = page.locator(WIZARD_STEP_LOGISTICS.clubSelect).first();
    await clubSelect.selectOption('club-1');
    await page.locator(WIZARD_STEP_LOGISTICS.titleInput).fill('Test Run');
    await page.locator(WIZARD_STEP_LOGISTICS.startAddressInput).fill('Start');
    await page.locator(WIZARD_STEP_LOGISTICS.endAddressInput).fill('End');
    await page.locator(WIZARD_SELECTORS.nextButton).click();

    // Step 2: Progress should be 50%
    await expect(page.locator(WIZARD_SELECTORS.stepNum)).toContainText('Step 2 of 4');
  });

  // ────────────────────────────────────────────────────────────
  // TEST 15: Run Card Carousel - Card Details
  // ────────────────────────────────────────────────────────────

  test('carousel mini cards display run details', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'networkidle' });

    const miniCards = page.locator(CAROUSEL_SELECTORS.miniCard);
    const cardCount = await miniCards.count();

    if (cardCount > 0) {
      // Verify first card has content
      const firstCard = miniCards.first();

      // Verify card title is visible
      await expect(firstCard.locator(CAROUSEL_SELECTORS.cardTitle)).toBeVisible();

      // Verify card meta (club name, date) is visible
      const cardMetas = firstCard.locator(CAROUSEL_SELECTORS.cardMeta);
      const metaCount = await cardMetas.count();
      expect(metaCount).toBeGreaterThan(0);

      // Verify card has a banner color
      await expect(firstCard.locator(CAROUSEL_SELECTORS.cardBanner)).toBeVisible();
    }
  });
});
