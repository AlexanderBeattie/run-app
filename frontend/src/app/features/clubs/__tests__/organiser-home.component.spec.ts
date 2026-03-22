import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { OrganiserHomeComponent } from '../organiser-home.component';
import { RunsService } from '../../../core/services/runs.service';
import { AuthService } from '../../../core/services/auth.service';

const makeRun = (overrides: any = {}) => ({
  id: 'run-1', title: 'Morning Run', status: 'active',
  event_date: new Date(Date.now() + 86400000 * 2).toISOString(),
  distance_km: '8', attendees: ['u1', 'u2'], max_attendees: 10,
  ...overrides
});

describe('OrganiserHomeComponent', () => {
  let component: OrganiserHomeComponent;
  let fixture: ComponentFixture<OrganiserHomeComponent>;
  let runsService: any;
  let authService: any;

  beforeEach(async () => {
    runsService = {
      getMyRuns: jest.fn().mockReturnValue(of([makeRun()])),
      cancelRun: jest.fn().mockReturnValue(of({})),
      deleteRun: jest.fn().mockReturnValue(of({}))
    };
    authService = {
      getUser: jest.fn().mockReturnValue(signal({ displayName: 'Alex Beattie', role: 'organizer' })),
      isLoggedIn: jest.fn().mockReturnValue(true),
      logout: jest.fn()
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [OrganiserHomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RunsService, useValue: runsService },
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganiserHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => expect(component).toBeTruthy());

  it('calls getMyRuns on init and sets loaded', () => {
    expect(runsService.getMyRuns).toHaveBeenCalled();
    expect(component.loaded).toBe(true);
    expect(component.runs.length).toBe(1);
  });

  it('initials returns first two letters of display name', () => {
    expect(component.initials).toBe('AB');
  });

  it('activeRuns excludes cancelled runs', () => {
    component.runs = [makeRun(), makeRun({ id: 'run-2', status: 'cancelled' })];
    expect(component.activeRuns).toBe(1);
  });

  it('totalSignups sums attendees across all runs', () => {
    component.runs = [makeRun({ attendees: ['u1', 'u2'] }), makeRun({ id: 'run-2', attendees: ['u3'] })];
    expect(component.totalSignups).toBe(3);
  });

  it('nextRun returns the soonest upcoming active run', () => {
    const soon = makeRun({ id: 'run-soon', event_date: new Date(Date.now() + 86400000).toISOString() });
    const later = makeRun({ id: 'run-later', event_date: new Date(Date.now() + 86400000 * 5).toISOString() });
    component.runs = [later, soon];
    expect(component.nextRun?.id).toBe('run-soon');
  });

  it('nextRun excludes cancelled runs', () => {
    component.runs = [makeRun({ status: 'cancelled' })];
    expect(component.nextRun).toBeNull();
  });

  it('getCapacity returns percentage of attendees vs max', () => {
    const run = makeRun({ attendees: ['u1', 'u2'], max_attendees: 10 });
    expect(component.getCapacity(run)).toBe(20);
  });

  it('getCapacity returns 0 when no max_attendees set', () => {
    const run = makeRun({ max_attendees: null });
    expect(component.getCapacity(run)).toBe(0);
  });

  it('getCapacity caps at 100', () => {
    const run = makeRun({ attendees: new Array(20).fill('u'), max_attendees: 10 });
    expect(component.getCapacity(run)).toBe(100);
  });

  it('onCancelled updates run status without refetching', () => {
    component.runs = [makeRun({ id: 'run-1', status: 'active' })];
    component.onCancelled('run-1');
    expect(component.runs[0].status).toBe('cancelled');
    expect(runsService.getMyRuns).toHaveBeenCalledTimes(1); // only the initial call
  });

  it('onDeleted removes the run from the list', () => {
    component.runs = [makeRun({ id: 'run-1' }), makeRun({ id: 'run-2' })];
    component.onDeleted('run-1');
    expect(component.runs.length).toBe(1);
    expect(component.runs[0].id).toBe('run-2');
  });

  it('onDeleted clears selectedRun', () => {
    component.selectedRun = makeRun({ id: 'run-1' });
    component.runs = [makeRun({ id: 'run-1' })];
    component.onDeleted('run-1');
    expect(component.selectedRun).toBeNull();
  });

  it('cancel shows confirm modal with cancel mode', () => {
    component.runs = [makeRun({ id: 'run-1', status: 'active' })];
    component.cancel('run-1');
    expect(component.confirmModal.mode).toBe('cancel');
    expect(component.confirmModal.runId).toBe('run-1');
  });

  it('onConfirmed calls cancelRun when mode is cancel', () => {
    component.confirmModal = { mode: 'cancel', runId: 'run-1', title: '', message: '', confirmLabel: '', destructive: false };
    component.onConfirmed();
    expect(runsService.cancelRun).toHaveBeenCalledWith('run-1');
  });

  it('onCancelledModal clears modal', () => {
    component.confirmModal = { mode: 'cancel', runId: 'run-1', title: '', message: '', confirmLabel: '', destructive: false };
    component.onCancelledModal();
    expect(component.confirmModal.mode).toBeNull();
  });

  it('delete shows confirm modal with delete mode', () => {
    component.runs = [makeRun({ id: 'run-1' })];
    component.delete('run-1');
    expect(component.confirmModal.mode).toBe('delete');
    expect(component.confirmModal.runId).toBe('run-1');
  });

  it('onConfirmed calls deleteRun when mode is delete', () => {
    component.confirmModal = { mode: 'delete', runId: 'run-1', title: '', message: '', confirmLabel: '', destructive: true };
    component.onConfirmed();
    expect(runsService.deleteRun).toHaveBeenCalledWith('run-1');
  });
});
