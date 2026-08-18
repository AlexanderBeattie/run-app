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
    expect(result).toMatch(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/);
  });

  it('getComments fetches and maps comments for a run', () => {
    const mockComment = {
      id: 'c1', run_id: 'run-1', user_id: 'user-1', content: 'Hello!',
      display_name: 'Alice', avatar_url: null,
      created_at: new Date('2026-01-01T10:00:00Z').toISOString()
    };
    let result: any;
    service.getComments('run-1').subscribe(c => result = c);
    const req = http.expectOne(`${environment.apiUrl}/runs/run-1/comments`);
    expect(req.request.method).toBe('GET');
    req.flush([mockComment]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('c1');
    expect(result[0].runId).toBe('run-1');
    expect(result[0].displayName).toBe('Alice');
    expect(result[0].content).toBe('Hello!');
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });

  it('getComments returns empty array when no comments', () => {
    let result: any;
    service.getComments('run-1').subscribe(c => result = c);
    const req = http.expectOne(`${environment.apiUrl}/runs/run-1/comments`);
    req.flush([]);
    expect(result).toEqual([]);
  });

  it('postComment sends content and maps response', () => {
    const mockResponse = {
      id: 'c2', run_id: 'run-1', user_id: 'user-2', content: 'Great run!',
      display_name: 'Bob', avatar_url: null,
      created_at: new Date('2026-01-01T11:00:00Z').toISOString()
    };
    let result: any;
    service.postComment('run-1', 'Great run!').subscribe(c => result = c);
    const req = http.expectOne(`${environment.apiUrl}/runs/run-1/comments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Great run!' });
    req.flush(mockResponse);
    expect(result.id).toBe('c2');
    expect(result.displayName).toBe('Bob');
    expect(result.content).toBe('Great run!');
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