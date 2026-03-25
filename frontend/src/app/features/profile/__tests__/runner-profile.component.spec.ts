import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { RunnerProfileComponent } from '../runner-profile.component';
import { RunsService } from '../../../core/services/runs.service';
import { AuthService } from '../../../core/services/auth.service';

const makeRun = (overrides: any = {}) => ({
  id: 'run-1', title: 'Park Run', club_name: 'Test Club',
  event_date: new Date(Date.now() + 86400000 * 2).toISOString(),
  distance_km: '5',
  ...overrides
});

describe('RunnerProfileComponent', () => {
  let component: RunnerProfileComponent;
  let fixture: ComponentFixture<RunnerProfileComponent>;
  let runsService: any;
  let authService: any;

  beforeEach(async () => {
    runsService = {
      getJoinedRuns: jest.fn().mockReturnValue(of([makeRun()]))
    };
    authService = {
      getUser: jest.fn().mockReturnValue(signal({ displayName: 'Alex Beattie', role: 'runner' })),
      isLoggedIn: jest.fn().mockReturnValue(true),
      logout: jest.fn()
    };

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

    fixture = TestBed.createComponent(RunnerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => expect(component).toBeTruthy());

  it('calls getJoinedRuns on init and sets loaded', () => {
    expect(runsService.getJoinedRuns).toHaveBeenCalled();
    expect(component.loaded).toBe(true);
    expect(component.runs.length).toBe(1);
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

  it('starts with empty runs before data loads', async () => {
    runsService.getJoinedRuns.mockReturnValue(of([]));
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
    const f = TestBed.createComponent(RunnerProfileComponent);
    f.detectChanges();
    expect(f.componentInstance.runs).toEqual([]);
    expect(f.componentInstance.loaded).toBe(true);
  });
});
