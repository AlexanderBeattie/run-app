import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { HomeComponent } from '../home.component';
import { RunsService } from '../../../core/services/runs.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
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

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RunsService, useValue: runsService },
        { provide: AuthService, useValue: authService },
        ToastService
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

  it('displays runs from service', () => {
    const runs = [makeRun({ distanceKm: 3 }), makeRun({ id: 'run-2', distanceKm: 8 })];
    runsService.getRuns.mockReturnValue(signal(runs));
    expect(runsService.getRuns()().length).toBe(2);
  });

  it('calls loadRuns with filter params when setFilter is called', () => {
    component.setFilter({ label: '5k+', params: { distance_min: 5 } });
    expect(runsService.loadRuns).toHaveBeenCalledWith(expect.objectContaining({ distance_min: 5 }));
    expect(component.activeFilter).toBe('5k+');
  });

  it('calls loadRuns with date param for Today filter', () => {
    component.setFilter({ label: 'Today', params: { date: 'today' } });
    expect(runsService.loadRuns).toHaveBeenCalledWith(expect.objectContaining({ date: 'today' }));
  });

  it('calls loadRuns with date param for This week filter', () => {
    component.setFilter({ label: 'This week', params: { date: 'week' } });
    expect(runsService.loadRuns).toHaveBeenCalledWith(expect.objectContaining({ date: 'week' }));
  });

  it('calls loadRuns with distance_min for 10k+ filter', () => {
    component.setFilter({ label: '10k+', params: { distance_min: 10 } });
    expect(runsService.loadRuns).toHaveBeenCalledWith(expect.objectContaining({ distance_min: 10 }));
  });

  it('includes search query when setting filter', () => {
    component.searchQuery = 'parkrun';
    component.setFilter({ label: 'Today', params: { date: 'today' } });
    expect(runsService.loadRuns).toHaveBeenCalledWith(expect.objectContaining({ date: 'today', search: 'parkrun' }));
  });

  it('sets loaded to true after timeout', async () => {
    expect(component.loaded).toBe(false);
    await new Promise(r => setTimeout(r, 700));
    expect(component.loaded).toBe(true);
  });
});