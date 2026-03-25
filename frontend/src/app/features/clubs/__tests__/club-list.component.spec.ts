import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ClubListComponent } from '../club-list.component';
import { ClubService } from '../../../core/services/club.service';
import { AuthService } from '../../../core/services/auth.service';
import { Club } from '../../../core/models/run-event.model';

const makeClub = (overrides: Partial<Club> = {}): Club => ({
  id: 'club-1', name: 'Test Club', description: 'A test club',
  owner_id: 'user-123', city: 'London', pace: 'moderate',
  tags: ['road'], member_count: 5, created_at: new Date().toISOString(),
  ...overrides
});

describe('ClubListComponent', () => {
  let component: ClubListComponent;
  let fixture: ComponentFixture<ClubListComponent>;
  let clubService: any;
  let authService: any;

  beforeEach(async () => {
    clubService = {
      listClubs: jest.fn().mockReturnValue(of([makeClub()]))
    };
    authService = {
      isOrganizer: jest.fn().mockReturnValue(false),
      isLoggedIn: jest.fn().mockReturnValue(false)
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ClubListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ClubService, useValue: clubService },
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClubListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => expect(component).toBeTruthy());

  it('calls listClubs on init', () => {
    expect(clubService.listClubs).toHaveBeenCalled();
  });

  it('populates clubs and filteredClubs after load', () => {
    expect(component.clubs.length).toBe(1);
    expect(component.filteredClubs.length).toBe(1);
    expect(component.loaded).toBe(true);
  });

  it('filterClubs narrows list by name', () => {
    component.clubs = [makeClub({ name: 'Parkrun Pals' }), makeClub({ id: 'club-2', name: 'Speed Demons' })];
    component.searchQuery = 'parkrun';
    component.filterClubs();
    expect(component.filteredClubs.length).toBe(1);
    expect(component.filteredClubs[0].name).toBe('Parkrun Pals');
  });

  it('filterClubs narrows list by city', () => {
    component.clubs = [makeClub({ city: 'London' }), makeClub({ id: 'club-2', name: 'Manchester Club', city: 'Manchester' })];
    component.searchQuery = 'manchester';
    component.filterClubs();
    expect(component.filteredClubs.length).toBe(1);
    expect(component.filteredClubs[0].city).toBe('Manchester');
  });

  it('filterClubs restores full list when query is cleared', () => {
    component.clubs = [makeClub(), makeClub({ id: 'club-2', name: 'Other Club' })];
    component.searchQuery = 'other';
    component.filterClubs();
    expect(component.filteredClubs.length).toBe(1);

    component.searchQuery = '';
    component.filterClubs();
    expect(component.filteredClubs.length).toBe(2);
  });

  it('filterClubs is case-insensitive', () => {
    component.clubs = [makeClub({ name: 'South London Harriers' })];
    component.searchQuery = 'SOUTH LONDON';
    component.filterClubs();
    expect(component.filteredClubs.length).toBe(1);
  });

  // ─── formatDate ─────────────────────────────────────────────────────────────

  it('formatDate returns "Today" for a date within 24 hours', () => {
    const soon = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    expect(component.formatDate(soon)).toBe('Today');
  });

  it('formatDate returns "Tomorrow" for a date approximately 24h away', () => {
    const tomorrow = new Date(Date.now() + 86400000 * 1.5).toISOString();
    expect(component.formatDate(tomorrow)).toBe('Tomorrow');
  });

  it('formatDate returns a formatted string for dates further away', () => {
    const future = new Date(Date.now() + 86400000 * 5).toISOString();
    const result = component.formatDate(future);
    expect(result).toMatch(/\w{3}/); // at least a 3-char weekday abbreviation
  });
});
