import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { HomeComponent } from '../home.component';
import { RunsService } from '../../../core/services/runs.service';
import { AuthService } from '../../../core/services/auth.service';
import { RunEvent } from '../../../core/models/run-event.model';

const makeRun = (overrides: Partial<RunEvent> = {}): RunEvent => ({
  id: 'run-1', clubId: 'club-1', clubName: 'Test Club', title: 'Test Run',
  startLocation: { lat: 51.5, lng: -0.1 }, endLocation: { lat: 51.6, lng: -0.2 },
  startAddress: 'Start', endAddress: 'End',
  date: new Date(), distanceKm: 5, estimatedMinutes: 30,
  attendees: [], status: 'active',
  ...overrides
});

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let runsService: any;
  let authService: any;

  beforeEach(async () => {
    runsService = {
      loadRuns: jest.fn(),
      getRuns: jest.fn().mockReturnValue(signal([])),
      getJoinedRunIds: jest.fn().mockReturnValue(signal([])),
      toggleJoin: jest.fn()
    };
    authService = {
      getUser: jest.fn().mockReturnValue(signal({ displayName: 'Alex Beattie', role: 'runner' })),
      isLoggedIn: jest.fn().mockReturnValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RunsService, useValue: runsService },
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => expect(component).toBeTruthy());

  it('calls loadRuns on init', () => expect(runsService.loadRuns).toHaveBeenCalled());

  it('shows correct initials for two-word name', () => {
    expect(component.initials).toBe('AB');
  });

  it('shows single initial for one-word name', () => {
    authService.getUser.mockReturnValue(signal({ displayName: 'Alex', role: 'runner' }));
    expect(component.initials).toBe('A');
  });

  it('returns all runs when filter is All runs', () => {
    const runs = [makeRun({ distanceKm: 3 }), makeRun({ id: 'run-2', distanceKm: 8 })];
    runsService.getRuns.mockReturnValue(signal(runs));
    component.activeFilter = 'All runs';
    expect(component.filteredRuns.length).toBe(2);
  });

  it('filters to 5k+ runs correctly', () => {
    const runs = [makeRun({ distanceKm: 3 }), makeRun({ id: 'run-2', distanceKm: 5 }), makeRun({ id: 'run-3', distanceKm: 10 })];
    runsService.getRuns.mockReturnValue(signal(runs));
    component.activeFilter = '5k+';
    expect(component.filteredRuns.length).toBe(2);
  });

  it('filters to 10k+ runs correctly', () => {
    const runs = [makeRun({ distanceKm: 5 }), makeRun({ id: 'run-2', distanceKm: 10 }), makeRun({ id: 'run-3', distanceKm: 12 })];
    runsService.getRuns.mockReturnValue(signal(runs));
    component.activeFilter = '10k+';
    expect(component.filteredRuns.length).toBe(2);
  });

  it('filters to Today runs only', () => {
    const todayRun = makeRun({ date: new Date() });
    const tomorrowRun = makeRun({ id: 'run-2', date: new Date(Date.now() + 86400000) });
    runsService.getRuns.mockReturnValue(signal([todayRun, tomorrowRun]));
    component.activeFilter = 'Today';
    expect(component.filteredRuns.length).toBe(1);
  });

  it('sets loaded to true after timeout', async () => {
    expect(component.loaded).toBe(false);
    await new Promise(r => setTimeout(r, 900));
    expect(component.loaded).toBe(true);
  });
});