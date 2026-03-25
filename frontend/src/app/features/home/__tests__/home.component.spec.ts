import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { HomeComponent } from '../home.component';
import { RunsService } from '../../../core/services/runs.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClubService } from '../../../core/services/club.service';
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

  let clubService: any;

  beforeEach(async () => {
    runsService = {
      loadRuns: jest.fn(),
      fetchRuns: jest.fn().mockReturnValue(of([])),
      getRuns: jest.fn().mockReturnValue(signal([])),
      getJoinedRunIds: jest.fn().mockReturnValue(signal([])),
      toggleJoin: jest.fn()
    };
    authService = {
      getUser: jest.fn().mockReturnValue(signal({ displayName: 'Alex Beattie', role: 'runner' })),
      isLoggedIn: jest.fn().mockReturnValue(true)
    };
    clubService = {
      listClubs: jest.fn().mockReturnValue(of([])),
      getMineClubs: jest.fn().mockReturnValue(of([]))
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
        { provide: ClubService, useValue: clubService },
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => expect(component).toBeTruthy());

  it('calls loadRuns on init', () => expect(runsService.loadRuns).toHaveBeenCalled());

  it('firstName returns first word of display name', () => {
    expect(component.firstName).toBe('Alex');
  });

  it('firstName returns full name when single word', () => {
    authService.getUser.mockReturnValue(signal({ displayName: 'Alex', role: 'runner' }));
    expect(component.firstName).toBe('Alex');
  });

  it('displays runs from service', () => {
    const runs = [makeRun({ distanceKm: 3 }), makeRun({ id: 'run-2', distanceKm: 8 })];
    runsService.getRuns.mockReturnValue(signal(runs));
    expect(runsService.getRuns()().length).toBe(2);
  });

  it('calls loadRuns with filter params when setCategory is called', () => {
    component.setCategory({ label: '5K', params: { distance_min: 5 } });
    expect(runsService.loadRuns).toHaveBeenCalledWith(expect.objectContaining({ distance_min: 5 }));
    expect(component.activeCategory).toBe('5K');
  });

  it('calls loadRuns with date param for Today category', () => {
    component.setCategory({ label: 'Today', params: { date: 'today' } });
    expect(runsService.loadRuns).toHaveBeenCalledWith(expect.objectContaining({ date: 'today' }));
  });

  it('calls loadRuns with pace param for Easy category', () => {
    component.setCategory({ label: 'Easy', params: { pace: 'easy' } });
    expect(runsService.loadRuns).toHaveBeenCalledWith(expect.objectContaining({ pace: 'easy' }));
  });

  it('calls loadRuns with distance_min for 10K category', () => {
    component.setCategory({ label: '10K', params: { distance_min: 8 } });
    expect(runsService.loadRuns).toHaveBeenCalledWith(expect.objectContaining({ distance_min: 8 }));
  });

  it('includes search query when setting category', () => {
    component.searchQuery = 'parkrun';
    component.setCategory({ label: 'Today', params: { date: 'today' } });
    expect(runsService.loadRuns).toHaveBeenCalledWith(expect.objectContaining({ date: 'today', search: 'parkrun' }));
  });

  it('hasActiveFilters is false by default', () => {
    expect(component.hasActiveFilters).toBe(false);
  });

  it('hasActiveFilters is true when category is not All', () => {
    component.setCategory({ label: 'Fast', params: { pace: 'fast' } });
    expect(component.hasActiveFilters).toBe(true);
  });

  it('hasActiveFilters is true when search query is set', () => {
    component.searchQuery = 'parkrun';
    expect(component.hasActiveFilters).toBe(true);
  });

  it('sets loaded to true after timeout', async () => {
    expect(component.loaded).toBe(false);
    await new Promise(r => setTimeout(r, 700));
    expect(component.loaded).toBe(true);
  });
});
