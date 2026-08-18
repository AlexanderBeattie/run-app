import { Page } from '@playwright/test';

/**
 * Mock test user object matching AuthService interface.
 */
interface MockUser {
  id: string;
  email: string;
  displayName: string;
  role?: string;
  isOrganizer?: boolean;
  stravaConnected: boolean;
}

/**
 * Mock authentication fixture for E2E tests.
 * Sets up localStorage and API routes to simulate an authenticated session.
 */
export async function loginTestUser(page: Page, userOverrides?: Partial<MockUser>): Promise<void> {
  const isOrg = userOverrides?.isOrganizer ?? false;
  const testUser: MockUser = {
    id: 'test-user-123',
    email: 'test@klub.local',
    displayName: 'Test Runner',
    role: isOrg ? 'organizer' : 'runner',
    isOrganizer: isOrg,
    stravaConnected: false,
    ...userOverrides,
  };

  const token = 'test-jwt-token-xyz';

  // Mock auth/me endpoint
  await page.route('**/api/auth/me', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testUser),
      });
    } else {
      route.continue();
    }
  });

  // Mock user profile endpoint
  await page.route('**/api/users/**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: testUser.id,
          displayName: testUser.displayName,
          email: testUser.email,
          verified_pace: null,
          stravaConnected: testUser.stravaConnected,
        }),
      });
    } else {
      route.continue();
    }
  });

  // Navigate to login first to allow localStorage setting
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Set token in localStorage to simulate authenticated session
  const expiresIn = 3600; // 1 hour
  await page.evaluate(
    ({ token, user, expiresIn }) => {
      localStorage.setItem('klub_token', token);
      localStorage.setItem('klub_user', JSON.stringify(user));
      localStorage.setItem('klub_token_expiry', String(Date.now() + expiresIn * 1000));
      localStorage.setItem('klub_refresh_token', token);
      localStorage.setItem('onboarded', 'true');
    },
    { token, user: testUser, expiresIn }
  );

  // Navigate to home to trigger auth guard and load authenticated content
  await page.goto('/home', { waitUntil: 'networkidle' });
}

/**
 * Fill and submit login form with test credentials.
 * Use this when testing the login flow itself, not after login.
 */
export async function submitLoginForm(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Fill email field
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill(email);

  // Fill password field
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);

  // Click submit button
  const submitBtn = page.locator('button.submit');
  await submitBtn.click();

  // Wait for navigation to home
  await page.waitForURL('**/home', { waitUntil: 'networkidle' });
}
