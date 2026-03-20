import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RunsService } from '../runs.service';
import { environment } from '../../../../environments/environment';

const mockRunData = {
  id: 'run-1', club_id: 'club-1', club_name: 'Test Club', title: 'Test Run',
  start_lat: '51.5', start_lng: '-0.1', end_lat: '51.6', end_lng: '-0.2',
  start_address: 'Start St, London', end_address: 'End Rd, London',
  event_date: new Date(Date.now() + 86400000).toISOString(),
  distance_km: '5.5', estimated_minutes: 30,
  attendees: ['user-1', 'user-2'], max_attendees: 20,
  notes: 'Test notes', status: 'active', created_by: 'user-1',
  pace: 'moderate', tags: ['road']
};

describe('RunsService', () => {
  let service: RunsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RunsService
      ]
    });
    service = TestBed.inject(RunsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('is created', () => expect(service).toBeTruthy());

  it('starts with empty runs signal', () => {
    expect(service.getRuns()()).toEqual([]);
  });

  it('starts with no selected run', () => {
    expect(service.getSelectedRunId()()).toBeNull();
  });

  it('starts with no joined runs', () => {
    expect(service.getJoinedRunIds()()).toEqual([]);
  });

  it('loadRuns fetches and maps runs correctly', () => {
    service.loadRuns();
    const req = http.expectOne(r => r.url.includes('/runs'));
    expect(req.request.method).toBe('GET');
    req.flush([mockRunData]);
    const runs = service.getRuns()();
    expect(runs.length).toBe(1);
    expect(runs[0].title).toBe('Test Run');
    expect(runs[0].distanceKm).toBe(5.5);
    expect(runs[0].startLocation).toEqual({ lat: 51.5, lng: -0.1 });
    expect(runs[0].attendees).toEqual(['user-1', 'user-2']);
    expect(runs[0].pace).toBe('moderate');
    expect(runs[0].tags).toEqual(['road']);
  });

  it('loadRuns sends query params when provided', () => {
    service.loadRuns({ search: 'parkrun', distance_min: 5 });
    const req = http.expectOne(r => r.url.includes('/runs') && r.params.get('search') === 'parkrun');
    expect(req.request.params.get('distance_min')).toBe('5');
    req.flush([]);
  });

  it('loadRuns sends date filter param', () => {
    service.loadRuns({ date: 'today' });
    const req = http.expectOne(r => r.params.get('date') === 'today');
    req.flush([]);
  });

  it('selectRun updates selectedRunId', () => {
    service.selectRun('run-1');
    expect(service.getSelectedRunId()()).toBe('run-1');
    service.selectRun(null);
    expect(service.getSelectedRunId()()).toBeNull();
  });

  it('formatDate returns Today for current date', () => {
    expect(service.formatDate(new Date())).toBe('Today');
  });

  it('formatDate returns Tomorrow for next day', () => {
    const tomorrow = new Date(Date.now() + 86400000);
    expect(service.formatDate(tomorrow)).toBe('Tomorrow');
  });

  it('formatDate returns weekday for other dates', () => {
    const future = new Date(Date.now() + 3 * 86400000);
    const result = service.formatDate(future);
    expect(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).toContain(result);
  });

  it('createRun posts to correct endpoint', () => {
    const payload: any = {
      clubId: null, clubName: 'Test', title: 'Run',
      startLocation: { lat: 51.5, lng: -0.1 },
      endLocation: { lat: 51.6, lng: -0.2 },
      startAddress: 'Start', endAddress: 'End',
      date: new Date().toISOString(), distanceKm: 5, estimatedMinutes: 30
    };
    service.createRun(payload).subscribe();
    const req = http.expectOne(r => r.url.includes('/runs') && r.method === 'POST');
    expect(req.request.method).toBe('POST');
    req.flush(mockRunData);
  });
});