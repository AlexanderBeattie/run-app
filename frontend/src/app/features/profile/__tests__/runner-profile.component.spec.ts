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
  getUserProfile: jest.fn().mockReturnValue(of({ id: 'u1', display_name: 'Alex Beattie', total_runs: 1, total_distance_km: 5, favorite_pace: null, verified_pace: 320, recent_runs: [] }))
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
      component.runs = [makeRun({ distance_km: '5' }), makeRun({ id: 'r2', distance_km: '8.5' })];
      expect(component.totalKm).toBe(14);
    });

    it('totalKm returns 0 when no runs', () => {
      component.runs = [];
      expect(component.totalKm).toBe(0);
    });

    it('formatDate returns Past for dates in the past', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      expect(component.formatDate(past)).toBe('Past');
    });

    it('formatDate returns Tomorrow for tomorrow', () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      expect(component.formatDate(tomorrow)).toBe('Tomorrow');
    });

    it('formatDate returns formatted date for future dates beyond tomorrow', () => {
      const future = new Date(Date.now() + 86400000 * 5).toISOString();
      const result = component.formatDate(future);
      expect(result).toMatch(/\w{3},?\s+\d+\s+\w+/);
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
