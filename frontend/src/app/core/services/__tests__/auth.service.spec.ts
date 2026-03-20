import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../auth.service';
import { environment } from '../../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService
      ]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('is created', () => expect(service).toBeTruthy());

  it('is not logged in by default with empty storage', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('isOrganizer returns false for runner', () => {
    expect(service.isOrganizer()).toBe(false);
  });

  it('stores token and user on successful login', () => {
    const mockResponse = {
      token: 'test-token',
      user: { id: '1', displayName: 'Test', email: 'test@test.com', role: 'runner', stravaConnected: false, joinedRunIds: [] }
    };
    service.login('test@test.com', 'password').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@test.com', password: 'password' });
    req.flush(mockResponse);
    expect(service.isLoggedIn()).toBe(true);
    expect(localStorage.getItem('klub_token')).toBe('test-token');
  });

  it('clears storage and resets state on logout', () => {
    localStorage.setItem('klub_token', 'test-token');
    localStorage.setItem('klub_user', JSON.stringify({ id: '1' }));
    service.logout();
    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('klub_token')).toBeNull();
    expect(localStorage.getItem('klub_user')).toBeNull();
  });

  it('registers organizer and sets isOrganizer true', () => {
    const mockResponse = {
      token: 'new-token',
      user: { id: '2', displayName: 'Org', email: 'org@test.com', role: 'organizer', stravaConnected: false, joinedRunIds: [] }
    };
    service.register('Org', 'org@test.com', 'password123', 'organizer').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    req.flush(mockResponse);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.isOrganizer()).toBe(true);
  });

  it('loads user from localStorage on init', () => {
    localStorage.setItem('klub_token', 'stored-token');
    localStorage.setItem('klub_user', JSON.stringify({ id: '3', role: 'runner' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService
      ]
    });
    const newService = TestBed.inject(AuthService);
    expect(newService.isLoggedIn()).toBe(true);
  });
});