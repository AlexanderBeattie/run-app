import { Page } from '@playwright/test';
import { RunEvent } from '../../frontend/src/app/core/models/run-event.model';

/**
 * Mock API responses for E2E tests.
 * Intercepts common API endpoints and returns fixture data.
 */
export async function setupApiMocks(page: Page): Promise<void> {
  // Mock runs endpoint
  await page.route('**/api/runs', (route) => {
    if (route.request().method() === 'GET') {
      const mockRuns = generateMockRuns();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRuns),
      });
    } else if (route.request().method() === 'POST') {
      // POST to create a run
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-run-' + Date.now(),
          title: 'New Test Run',
          clubId: 'club-1',
          clubName: 'Test Club',
          location: 'Glasgow',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          pace: 'easy',
          distanceKm: 5,
          attendees: [],
        }),
      });
    } else {
      route.continue();
    }
  });

  // Mock clubs endpoint
  await page.route('**/api/clubs', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generateMockClubs()),
      });
    } else if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-club-' + Date.now(),
          name: 'New Test Club',
          description: 'Test club description',
          location: 'Glasgow',
          logoUrl: null,
        }),
      });
    } else {
      route.continue();
    }
  });

  // Mock specific club by ID
  await page.route('**/api/clubs/*', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'club-1',
          name: 'Glasgow Running Club',
          description: 'A community for runners in Glasgow',
          location: 'Glasgow',
          logoUrl: null,
          createdAt: new Date('2024-01-01'),
        }),
      });
    } else {
      route.continue();
    }
  });

  // Mock organizer's owned clubs (must be registered after **/api/clubs/* for LIFO priority)
  await page.route('**/api/clubs/owned', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generateMockClubs()),
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
          id: 'test-user-123',
          displayName: 'Test Runner',
          email: 'test@klub.local',
          verified_pace: null,
          stravaConnected: false,
        }),
      });
    } else {
      route.continue();
    }
  });

  // Mock joined runs endpoint
  await page.route('**/api/runs/joined', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([generateMockRuns()[0]]),
      });
    } else {
      route.continue();
    }
  });

  // Mock Strava integration endpoint
  await page.route('**/api/auth/strava**', (route) => {
    // Strava OAuth redirect - just abort to avoid leaving the page
    route.abort('blockedbyconnect');
  });

  // Mock geocoding endpoint
  await page.route('**/api/geocode**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          lat: 55.8642,
          lng: -4.2518,
          address: 'Glasgow, Scotland',
        }),
      });
    } else {
      route.continue();
    }
  });

}

/**
 * Generate mock run data for testing.
 */
function generateMockRuns(): any[] {
  const now = new Date();
  return [
    {
      id: 'run-1',
      title: 'Easy Morning Run',
      club_id: 'club-1',
      club_name: 'Glasgow Running Club',
      start_address: 'Glasgow Green',
      end_address: 'Glasgow Green',
      start_lat: '55.8554', start_lng: '-4.2399',
      end_lat: '55.8554', end_lng: '-4.2399',
      event_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      pace: 'easy',
      distance_km: 5,
      run_type: 'club_run',
      attendees: [{ id: 'user-1', display_name: 'Runner One' }],
      attendee_count: 1,
    },
    {
      id: 'run-2',
      title: 'Tempo Training',
      club_id: 'club-1',
      club_name: 'Glasgow Running Club',
      start_address: 'Kelvingrove Park',
      end_address: 'Kelvingrove Park',
      start_lat: '55.8700', start_lng: '-4.2873',
      end_lat: '55.8700', end_lng: '-4.2873',
      event_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      pace: 'moderate',
      distance_km: 8,
      run_type: 'club_run',
      attendees: [
        { id: 'user-1', display_name: 'Runner One' },
        { id: 'user-2', display_name: 'Runner Two' },
      ],
      attendee_count: 2,
    },
    {
      id: 'run-3',
      title: 'Speed Session',
      club_id: 'club-1',
      club_name: 'Glasgow Running Club',
      start_address: 'Hampden Park',
      end_address: 'Hampden Park',
      start_lat: '55.8280', start_lng: '-4.2518',
      end_lat: '55.8280', end_lng: '-4.2518',
      event_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      pace: 'fast',
      distance_km: 6,
      run_type: 'club_run',
      attendees: [
        { id: 'user-1', display_name: 'Runner One' },
        { id: 'user-2', display_name: 'Runner Two' },
        { id: 'user-3', display_name: 'Runner Three' },
      ],
      attendee_count: 3,
    },
  ];
}

/**
 * Generate mock club data for testing.
 */
function generateMockClubs(): any[] {
  return [
    {
      id: 'club-1',
      name: 'Glasgow Running Club',
      description: 'A vibrant community of runners in Glasgow',
      location: 'Glasgow',
      logoUrl: null,
      createdAt: new Date('2024-01-01'),
    },
  ];
}
