import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { RunnerProfileComponent } from '../runner-profile.component';
import { RunsService } from '../../../core/services/runs.service';
import { AuthService } from '../../../core/services/auth.service';

const makeRun = (overrides: any = {}) => ({
  id: 'run-1', title: 'Park Run', club_name: 'Test Club',
  event_date: new Date(Date.now() + 86400000 * 2).toISOString(),
  distance_km: '5',
  ...overrides
});

const makeRunnerAuth = () => ({
  getUser: jest.fn().mockReturnValue(signal({ id: 'u1', displayName: 'Alex Beattie', role: 'runner', stravaConnected: false, joinedRunIds: [] })),
  isLoggedIn: jest.fn().mockReturnValue(true),
  isOrganizer: jest.fn().mockReturnValue(false),
  getToken: jest.fn().mockReturnValue('tok'),
  setStravaConnected: jest.fn(),
  logout: jest.fn()
});

const makeOrganizerAuth = () => ({
  getUser: jest.fn().mockReturnValue(signal({ id: 'u2', displayName: 'Org User', role: 'organizer', stravaConnected: false, joinedRunIds: [] })),
  isLoggedIn: jest.fn().mockReturnValue(true),
  isOrganizer: jest.fn().mockReturnValue(true),
  getToken: jest.fn().mockReturnValue('tok'),
  setStravaConnected: jest.fn(),
  logout: jest.fn()
});

const makeRunsService = (joinedRuns = [makeRun()]) => ({
  getJoinedRuns: jest.fn().mockReturnValue(of(joinedRuns)),
  getMyRuns: jest.fn().mockReturnValue(of([])),
  getUserProfile: jest.fn().mockReturnValue(of({ id: 'u1', display_name: 'Alex Beattie', total_runs: 1, total_distance_km: 5, favorite_pace: null, verified_pace: 320, recent_runs: [] })),
  mapRun: jest.fn((r: any) => ({
    id: r.id, title: r.title, clubName: r.club_name,
    distanceKm: parseFloat(r.distance_km) || 0,
    date: new Date(r.event_date),
    attendees: [], startLocation: { lat: 0, lng: 0 }, endLocation: { lat: 0, lng: 0 },
    pace: null, runType: null, tags: [], maxAttendees: null
  })),
  toggleJoin: jest.fn(),
  formatTime: jest.fn().mockReturnValue('9:00am')
});

async function setup(authService: any, runsService: any) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [RunnerProfileComponent],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: RunsService, useValue: runsService },
      { provide: AuthService, useValue: authService }
    ]
  }).compileComponents();

  const fixture = TestBed.createComponent(RunnerProfileComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component };
}

describe('RunnerProfileComponent', () => {
  describe('runner user', () => {
    let component: RunnerProfileComponent;
    let fixture: ComponentFixture<RunnerProfileComponent>;
    let runsService: any;
    let authService: any;

    beforeEach(async () => {
      authService = makeRunnerAuth();
      runsService = makeRunsService();
      ({ fixture, component } = await setup(authService, runsService));
    });

    it('creates the component', () => expect(component).toBeTruthy());

    it('calls getJoinedRuns on init and sets loaded', () => {
      expect(runsService.getJoinedRuns).toHaveBeenCalled();
      expect(component.loaded).toBe(true);
      expect(component.runs.length).toBe(1);
    });

    it('initialises viewMode as runner', () => {
      expect(component.viewMode()).toBe('runner');
    });

    it('does NOT render mode toggle for runner role', () => {
      const toggle = fixture.nativeElement.querySelector('.mode-toggle');
      expect(toggle).toBeNull();
    });

    it('initials returns first two letters of display name', () => {
      expect(component.initials).toBe('AB');
    });

    it('initials handles single-word name', () => {
      authService.getUser.mockReturnValue(signal({ displayName: 'Alex', role: 'runner' }));
      expect(component.initials).toBe('A');
    });

    it('totalKm sums distances across all joined runs', () => {
      component.runs = [{ distanceKm: 5, attendees: [] } as any, { distanceKm: 8.5, attendees: [] } as any];
      expect(component.totalKm).toBe(14);
    });

    it('totalKm returns 0 when no runs', () => {
      component.runs = [];
      expect(component.totalKm).toBe(0);
    });

    it('fetches verified_pace from user profile', () => {
      expect(runsService.getUserProfile).toHaveBeenCalledWith('u1');
      expect(component.verifiedPace()).toBe(320);
    });

    it('formatPace converts seconds-per-km to M:SS string', () => {
      expect(component.formatPace(320)).toBe('5:20/k');
      expect(component.formatPace(360)).toBe('6:00/k');
      expect(component.formatPace(375)).toBe('6:15/k');
    });

    it('handles getUserProfile error gracefully without crashing', async () => {
      const failSvc = { ...makeRunsService(), getUserProfile: jest.fn().mockReturnValue(throwError(() => new Error('404'))) };
      const { component: c } = await setup(makeRunnerAuth(), failSvc);
      expect(c.verifiedPace()).toBeNull();
    });

    it('starts with empty runs before data loads', async () => {
      const svc = { ...makeRunsService([]), getJoinedRuns: jest.fn().mockReturnValue(of([])) };
      const { component: c } = await setup(makeRunnerAuth(), svc);
      expect(c.runs).toEqual([]);
      expect(c.loaded).toBe(true);
    });
  });

  describe('upcoming / past run filtering', () => {
    it('upcomingRuns returns runs with date in the future', async () => {
      const future = makeRun({ id: 'f1', event_date: new Date(Date.now() + 86400000 * 3).toISOString() });
      const past = makeRun({ id: 'p1', event_date: new Date(Date.now() - 86400000 * 3).toISOString() });
      const svc = makeRunsService([future, past]);
      const { component } = await setup(makeRunnerAuth(), svc);
      expect(component.upcomingRuns.map(r => r.id)).toContain('f1');
      expect(component.upcomingRuns.map(r => r.id)).not.toContain('p1');
    });

    it('pastRuns returns runs with date in the past', async () => {
      const future = makeRun({ id: 'f1', event_date: new Date(Date.now() + 86400000 * 3).toISOString() });
      const past = makeRun({ id: 'p1', event_date: new Date(Date.now() - 86400000 * 3).toISOString() });
      const svc = makeRunsService([future, past]);
      const { component } = await setup(makeRunnerAuth(), svc);
      expect(component.pastRuns.map(r => r.id)).toContain('p1');
      expect(component.pastRuns.map(r => r.id)).not.toContain('f1');
    });

    it('upcomingRuns is empty when all runs are in the past', async () => {
      const past1 = makeRun({ id: 'p1', event_date: new Date(Date.now() - 86400000).toISOString() });
      const past2 = makeRun({ id: 'p2', event_date: new Date(Date.now() - 172800000).toISOString() });
      const svc = makeRunsService([past1, past2]);
      const { component } = await setup(makeRunnerAuth(), svc);
      expect(component.upcomingRuns).toHaveLength(0);
      expect(component.pastRuns).toHaveLength(2);
    });

    it('pastRuns is empty when all runs are in the future', async () => {
      const f1 = makeRun({ id: 'f1', event_date: new Date(Date.now() + 86400000).toISOString() });
      const f2 = makeRun({ id: 'f2', event_date: new Date(Date.now() + 172800000).toISOString() });
      const svc = makeRunsService([f1, f2]);
      const { component } = await setup(makeRunnerAuth(), svc);
      expect(component.pastRuns).toHaveLength(0);
      expect(component.upcomingRuns).toHaveLength(2);
    });
  });

  describe('tab switching', () => {
    it('starts on the upcoming tab', async () => {
      const { component } = await setup(makeRunnerAuth(), makeRunsService());
      expect(component.activeTab()).toBe('upcoming');
    });

    it('switching to past tab updates activeTab signal', async () => {
      const { component, fixture } = await setup(makeRunnerAuth(), makeRunsService());
      component.activeTab.set('past');
      fixture.detectChanges();
      expect(component.activeTab()).toBe('past');
    });

    it('shows upcoming empty state when upcoming tab selected and no upcoming runs', async () => {
      const past = makeRun({ id: 'p1', event_date: new Date(Date.now() - 86400000 * 5).toISOString() });
      const svc = makeRunsService([past]);
      const { fixture } = await setup(makeRunnerAuth(), svc);
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('No upcoming runs');
    });

    it('shows past empty state when past tab selected and no past runs', async () => {
      const future = makeRun({ id: 'f1', event_date: new Date(Date.now() + 86400000 * 5).toISOString() });
      const svc = makeRunsService([future]);
      const { component, fixture } = await setup(makeRunnerAuth(), svc);
      component.activeTab.set('past');
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('No past runs');
    });
  });

  describe('error handling', () => {
    it('sets errorMessage when getJoinedRuns fails', async () => {
      const failSvc = { ...makeRunsService(), getJoinedRuns: jest.fn().mockReturnValue(throwError(() => new Error('Network error'))) };
      const { component } = await setup(makeRunnerAuth(), failSvc);
      expect(component.errorMessage()).toBeTruthy();
    });

    it('clears errorMessage when close button clicked', async () => {
      const failSvc = { ...makeRunsService(), getJoinedRuns: jest.fn().mockReturnValue(throwError(() => new Error('err'))) };
      const { component, fixture } = await setup(makeRunnerAuth(), failSvc);
      const closeBtn = fixture.nativeElement.querySelector('.error-close');
      expect(closeBtn).not.toBeNull();
      closeBtn.click();
      fixture.detectChanges();
      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('organiser user', () => {
    let component: RunnerProfileComponent;
    let fixture: ComponentFixture<RunnerProfileComponent>;
    let runsService: any;
    let authService: any;

    beforeEach(async () => {
      authService = makeOrganizerAuth();
      runsService = makeRunsService();
      ({ fixture, component } = await setup(authService, runsService));
    });

    it('renders the mode toggle for organiser role', () => {
      const toggle = fixture.nativeElement.querySelector('.mode-toggle');
      expect(toggle).not.toBeNull();
    });

    it('initialises viewMode as runner', () => {
      expect(component.viewMode()).toBe('runner');
    });

    it('runner button is active by default', () => {
      const btns = fixture.nativeElement.querySelectorAll('.mode-btn');
      expect(btns[0].classList).toContain('active');
      expect(btns[1].classList).not.toContain('active');
    });

    it('switching to organiser mode updates viewMode signal', () => {
      component.viewMode.set('organiser');
      fixture.detectChanges();
      expect(component.viewMode()).toBe('organiser');
    });

    it('organiser button becomes active after switching', () => {
      component.viewMode.set('organiser');
      fixture.detectChanges();
      const btns = fixture.nativeElement.querySelectorAll('.mode-btn');
      expect(btns[1].classList).toContain('active');
      expect(btns[0].classList).not.toContain('active');
    });

    it('runner view content is hidden when in organiser mode', () => {
      component.viewMode.set('organiser');
      fixture.detectChanges();
      const runnerView = fixture.nativeElement.querySelector('.runner-view');
      expect(runnerView).toBeNull();
    });

    it('runner view content is visible in runner mode', () => {
      const runnerView = fixture.nativeElement.querySelector('.runner-view');
      expect(runnerView).not.toBeNull();
    });

    it('role label shows Organiser for organiser user', () => {
      const role = fixture.nativeElement.querySelector('.role');
      expect(role.textContent).toContain('Organiser');
    });
  });
});
