import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ClubProfileComponent } from '../club-profile.component';
import { ClubService } from '../../../core/services/club.service';
import { AuthService } from '../../../core/services/auth.service';
import { RunsService } from '../../../core/services/runs.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Club, ClubMember } from '../../../core/models/run-event.model';

const mockClub: Club = {
  id: 'club-1', name: 'Test Club', description: 'A test club',
  owner_id: 'user-123', city: 'London', pace: 'moderate',
  tags: ['road'], member_count: 5, active_run_count: 2,
  created_at: new Date().toISOString()
};

const mockMembers: ClubMember[] = [
  { id: 'user-123', display_name: 'Alex B', role: 'owner', joined_at: new Date().toISOString() },
  { id: 'user-456', display_name: 'Jo S', role: 'member', joined_at: new Date().toISOString() }
];

describe('ClubProfileComponent', () => {
  let component: ClubProfileComponent;
  let fixture: ComponentFixture<ClubProfileComponent>;
  let clubService: any;
  let authService: any;
  let runsService: any;
  let toastService: any;

  beforeEach(async () => {
    clubService = {
      getClub: jest.fn().mockReturnValue(of(mockClub)),
      getClubMembers: jest.fn().mockReturnValue(of(mockMembers)),
      getClubRuns: jest.fn().mockReturnValue(of([])),
      toggleJoin: jest.fn()
    };
    authService = {
      getUser: jest.fn().mockReturnValue(signal({ id: 'user-123', displayName: 'Alex B', role: 'organizer' })),
      isLoggedIn: jest.fn().mockReturnValue(true)
    };
    runsService = {
      getJoinedRunIds: jest.fn().mockReturnValue(signal([])),
      toggleJoin: jest.fn()
    };
    toastService = { show: jest.fn() };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ClubProfileComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ClubService, useValue: clubService },
        { provide: AuthService, useValue: authService },
        { provide: RunsService, useValue: runsService },
        { provide: ToastService, useValue: toastService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'club-1' } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClubProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => expect(component).toBeTruthy());

  it('fetches club, members, and runs on init', () => {
    expect(clubService.getClub).toHaveBeenCalledWith('club-1');
    expect(clubService.getClubMembers).toHaveBeenCalledWith('club-1');
    expect(clubService.getClubRuns).toHaveBeenCalledWith('club-1');
  });

  it('sets club data after load', () => {
    expect(component.club?.name).toBe('Test Club');
  });

  it('sets members after load', () => {
    expect(component.members.length).toBe(2);
  });

  it('sets isMember to true when current user is in the members list', () => {
    expect(component.isMember).toBe(true);
  });

  it('isOwner returns true when current user owns the club', () => {
    expect(component.isOwner).toBe(true);
  });

  it('isOwner returns false for a non-owner user', () => {
    authService.getUser.mockReturnValue(signal({ id: 'user-999', displayName: 'Other', role: 'runner' }));
    expect(component.isOwner).toBe(false);
  });

  it('toggleJoin flips isMember and updates member_count', () => {
    component.isMember = false;
    component.toggleJoin();
    expect(component.isMember).toBe(true);
    expect(component.club?.member_count).toBe(6);
    expect(toastService.show).toHaveBeenCalledWith('Joined club!');
  });

  it('toggleJoin shows leave toast when already a member', () => {
    component.isMember = true;
    component.toggleJoin();
    expect(component.isMember).toBe(false);
    expect(component.club?.member_count).toBe(4);
    expect(toastService.show).toHaveBeenCalledWith('Left club');
  });

  it('mapRun converts raw DB row to RunEvent shape', () => {
    const raw = {
      id: 'run-1', club_id: 'club-1', club_name: 'Test Club', title: 'Morning Run',
      start_lat: '51.5', start_lng: '-0.1', end_lat: '51.6', end_lng: '-0.2',
      start_address: 'Start St', end_address: 'End Rd',
      event_date: new Date().toISOString(), distance_km: '5.5',
      estimated_minutes: 30, attendees: [], status: 'active',
      created_by: 'user-123', pace: 'moderate', tags: ['road']
    };
    const run = component.mapRun(raw);
    expect(run.distanceKm).toBe(5.5);
    expect(run.startLocation).toEqual({ lat: 51.5, lng: -0.1 });
    expect(run.clubId).toBe('club-1');
  });
});
