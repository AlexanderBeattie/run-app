import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { CreateRunComponent } from '../create-run.component';
import { RunsService } from '../../../core/services/runs.service';
import { AuthService } from '../../../core/services/auth.service';
import { GeocodingService } from '../../../core/services/geocoding.service';
import { ClubService } from '../../../core/services/club.service';

const mockClubs = [{ id: 'club-1', name: 'Test Club' }];
const mockCoords = { lat: 51.5, lng: -0.1 };

describe('CreateRunComponent', () => {
  let component: CreateRunComponent;
  let fixture: ComponentFixture<CreateRunComponent>;
  let runsService: any;
  let authService: any;
  let geoService: any;
  let clubService: any;

  beforeEach(async () => {
    runsService = { createRun: jest.fn().mockReturnValue(of({})) };
    authService = {
      getUser: jest.fn().mockReturnValue(signal({ displayName: 'Alex Beattie', role: 'organizer' })),
      isOrganizer: jest.fn().mockReturnValue(true),
      isLoggedIn: jest.fn().mockReturnValue(true)
    };
    geoService = { geocode: jest.fn().mockResolvedValue(mockCoords) };
    clubService = { getMyClubs: jest.fn().mockReturnValue(of(mockClubs)) };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CreateRunComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RunsService, useValue: runsService },
        { provide: AuthService, useValue: authService },
        { provide: GeocodingService, useValue: geoService },
        { provide: ClubService, useValue: clubService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateRunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => expect(component).toBeTruthy());

  it('loads clubs on init when user is organizer', () => {
    expect(clubService.getMyClubs).toHaveBeenCalled();
    expect(component.myClubs).toEqual(mockClubs);
  });

  it('does not load clubs when user is not organizer', async () => {
    const freshClubService = { getMyClubs: jest.fn().mockReturnValue(of(mockClubs)) };
    authService.isOrganizer.mockReturnValue(false);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CreateRunComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RunsService, useValue: runsService },
        { provide: AuthService, useValue: authService },
        { provide: GeocodingService, useValue: geoService },
        { provide: ClubService, useValue: freshClubService }
      ]
    }).compileComponents();
    const f = TestBed.createComponent(CreateRunComponent);
    f.detectChanges();
    expect(freshClubService.getMyClubs).not.toHaveBeenCalled();
  });

  it('shows error when required fields are missing', async () => {
    await component.submit();
    expect(component.error).toBe('Please fill in all required fields.');
    expect(runsService.createRun).not.toHaveBeenCalled();
  });

  it('shows error when start address cannot be geocoded', async () => {
    component.title = 'Test Run';
    component.startAddress = 'Bad Address';
    component.endAddress = 'End St';
    component.date = '2026-06-01';
    component.time = '09:00';
    geoService.geocode.mockResolvedValueOnce(null).mockResolvedValueOnce(mockCoords);

    await component.submit();

    expect(component.error).toBe('Could not find start address.');
    expect(runsService.createRun).not.toHaveBeenCalled();
  });

  it('shows error when end address cannot be geocoded', async () => {
    component.title = 'Test Run';
    component.startAddress = 'Start St';
    component.endAddress = 'Bad Address';
    component.date = '2026-06-01';
    component.time = '09:00';
    geoService.geocode.mockResolvedValueOnce(mockCoords).mockResolvedValueOnce(null);

    await component.submit();

    expect(component.error).toBe('Could not find end address.');
    expect(runsService.createRun).not.toHaveBeenCalled();
  });

  it('calls createRun with correct payload on success', async () => {
    component.title = 'Morning Run';
    component.startAddress = 'Victoria Park';
    component.endAddress = 'Canary Wharf';
    component.date = '2026-06-01';
    component.time = '08:00';
    component.distanceKm = 8;
    component.estimatedMinutes = 50;

    await component.submit();

    expect(runsService.createRun).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Morning Run',
      startAddress: 'Victoria Park',
      endAddress: 'Canary Wharf',
      startLocation: mockCoords,
      endLocation: mockCoords,
      distanceKm: 8,
      estimatedMinutes: 50
    }));
  });

  it('shows error when createRun fails', async () => {
    runsService.createRun.mockReturnValue(throwError(() => new Error('Network error')));
    component.title = 'Morning Run';
    component.startAddress = 'Victoria Park';
    component.endAddress = 'Canary Wharf';
    component.date = '2026-06-01';
    component.time = '08:00';

    await component.submit();

    expect(component.error).toBe('Failed to post run.');
    expect(component.loading).toBe(false);
  });
});
