import { test, expect } from '@playwright/test';

test.describe('Runner profile card', () => {
  test.beforeEach(async ({ page }) => {
    // The app requires auth — intercept the runs API so the feed loads without a live DB.
    await page.route('**/api/runs**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'run-e2e-1',
            title: 'E2E Test Run',
            club_name: 'Test Club',
            club_id: 'club-1',
            date: new Date(Date.now() + 86_400_000).toISOString(),
            distance_km: 5,
            pace: 'easy',
            run_type: 'club_run',
            attendees: [{ id: 'user-e2e-1', display_name: 'Alice' }],
            attendee_count: 1,
            start_location: null,
          },
        ]),
      });
    });

    await page.route('**/api/users/user-e2e-1/profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-e2e-1',
          display_name: 'Alice',
          total_runs: 7,
          total_distance_km: 35.0,
          favorite_pace: 'easy',
          recent_runs: [
            { id: 'r1', title: 'Morning Run', club_name: 'Test Club', distance_km: 5, pace: 'easy', attended_date: '2024-03-01' },
          ],
        }),
      });
    });

    await page.goto('/');
  });

  test('open run detail → click attendee → profile opens → Escape closes → run detail still visible', async ({ page }) => {
    // Open a run card to get the detail dialog
    await page.getByText('E2E Test Run').first().click();
    await expect(page.locator('app-run-detail-dialog')).toBeVisible();

    // Click the attendee chip
    await page.getByRole('button', { name: /view profile for alice/i }).click();
    await expect(page.locator('app-runner-profile-dialog')).toBeVisible();
    await expect(page.locator('.name')).toContainText('Alice');

    // Press Escape to close the profile dialog
    await page.keyboard.press('Escape');
    await expect(page.locator('app-runner-profile-dialog')).not.toBeVisible();

    // Run detail dialog should still be visible
    await expect(page.locator('app-run-detail-dialog')).toBeVisible();
  });

  test('profile dialog close button dismisses without closing run detail', async ({ page }) => {
    await page.getByText('E2E Test Run').first().click();
    await expect(page.locator('app-run-detail-dialog')).toBeVisible();

    await page.getByRole('button', { name: /view profile for alice/i }).click();
    await expect(page.locator('app-runner-profile-dialog')).toBeVisible();

    // Click the ✕ close button inside the profile card
    await page.locator('app-runner-profile-dialog .close').click();
    await expect(page.locator('app-runner-profile-dialog')).not.toBeVisible();
    await expect(page.locator('app-run-detail-dialog')).toBeVisible();
  });
});
