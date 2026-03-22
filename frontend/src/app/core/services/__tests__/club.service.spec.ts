import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClubService } from '../club.service';
import { environment } from '../../../../environments/environment';

const mockClub = {
  id: 'club-1', name: 'Test Club', description: 'A test club',
  owner_id: 'user-123', city: 'London', pace: 'moderate',
  tags: ['road'], member_count: 5, created_at: new Date().toISOString()
};

const mockMember = {
  id: 'user-1', display_name: 'Alex B', role: 'owner', joined_at: new Date().toISOString()
};

describe('ClubService', () => {
  let service: ClubService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ClubService
      ]
    });
    service = TestBed.inject(ClubService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('is created', () => expect(service).toBeTruthy());

  it('starts with empty myClubIds signal', () => {
    expect(service.getMyClubIds()()).toEqual([]);
  });

  // ─── listClubs ─────────────────────────────────────────────────────────────

  it('listClubs fetches all clubs', () => {
    service.listClubs().subscribe(clubs => {
      expect(clubs.length).toBe(1);
      expect(clubs[0].name).toBe('Test Club');
    });
    const req = http.expectOne(`${environment.apiUrl}/clubs`);
    expect(req.request.method).toBe('GET');
    req.flush([mockClub]);
  });

  // ─── getClub ───────────────────────────────────────────────────────────────

  it('getClub fetches a single club by id', () => {
    service.getClub('club-1').subscribe(club => {
      expect(club.id).toBe('club-1');
    });
    const req = http.expectOne(`${environment.apiUrl}/clubs/club-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockClub);
  });

  // ─── getClubRuns ───────────────────────────────────────────────────────────

  it('getClubRuns fetches runs for a club', () => {
    const mockRun = { id: 'run-1', title: 'Morning Run', attendees: [] };
    service.getClubRuns('club-1').subscribe(runs => {
      expect(runs.length).toBe(1);
      expect(runs[0].title).toBe('Morning Run');
    });
    const req = http.expectOne(`${environment.apiUrl}/clubs/club-1/runs`);
    expect(req.request.method).toBe('GET');
    req.flush([mockRun]);
  });

  // ─── getClubMembers ────────────────────────────────────────────────────────

  it('getClubMembers fetches member list for a club', () => {
    service.getClubMembers('club-1').subscribe(members => {
      expect(members.length).toBe(1);
      expect(members[0].display_name).toBe('Alex B');
    });
    const req = http.expectOne(`${environment.apiUrl}/clubs/club-1/members`);
    expect(req.request.method).toBe('GET');
    req.flush([mockMember]);
  });

  // ─── createClub ────────────────────────────────────────────────────────────

  it('createClub posts to /clubs with correct body', () => {
    const payload = { name: 'Test Club', city: 'London', pace: 'moderate' };
    service.createClub(payload).subscribe(club => {
      expect(club.name).toBe('Test Club');
    });
    const req = http.expectOne(`${environment.apiUrl}/clubs`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockClub);
  });

  // ─── updateClub ────────────────────────────────────────────────────────────

  it('updateClub patches the club endpoint', () => {
    service.updateClub('club-1', { name: 'Updated Club' }).subscribe(club => {
      expect(club.name).toBe('Updated Club');
    });
    const req = http.expectOne(`${environment.apiUrl}/clubs/club-1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'Updated Club' });
    req.flush({ ...mockClub, name: 'Updated Club' });
  });

  // ─── getMyClubs ────────────────────────────────────────────────────────────

  it('getMyClubs fetches clubs owned by the user', () => {
    service.getMyClubs().subscribe(clubs => {
      expect(clubs[0].owner_id).toBe('user-123');
    });
    const req = http.expectOne(`${environment.apiUrl}/clubs/owned`);
    expect(req.request.method).toBe('GET');
    req.flush([mockClub]);
  });

  // ─── loadMyClubs ───────────────────────────────────────────────────────────

  it('loadMyClubs populates myClubIds signal with club ids', () => {
    service.loadMyClubs();
    const req = http.expectOne(`${environment.apiUrl}/clubs/mine`);
    req.flush([mockClub]);
    expect(service.getMyClubIds()()).toEqual(['club-1']);
  });

  it('loadMyClubs clears myClubIds when user is in no clubs', () => {
    service.loadMyClubs();
    const req = http.expectOne(`${environment.apiUrl}/clubs/mine`);
    req.flush([]);
    expect(service.getMyClubIds()()).toEqual([]);
  });

  // ─── toggleJoin ────────────────────────────────────────────────────────────

  it('toggleJoin adds clubId to myClubIds when joined', () => {
    service.toggleJoin('club-1');
    const req = http.expectOne(`${environment.apiUrl}/clubs/club-1/join`);
    expect(req.request.method).toBe('POST');
    req.flush({ joined: true });
    expect(service.getMyClubIds()()).toContain('club-1');
  });

  it('toggleJoin removes clubId from myClubIds when left', () => {
    // Seed the signal with the club already present
    service.loadMyClubs();
    const seedReq = http.expectOne(`${environment.apiUrl}/clubs/mine`);
    seedReq.flush([mockClub]);
    expect(service.getMyClubIds()()).toContain('club-1');

    service.toggleJoin('club-1');
    const req = http.expectOne(`${environment.apiUrl}/clubs/club-1/join`);
    req.flush({ joined: false });
    expect(service.getMyClubIds()()).not.toContain('club-1');
  });
});
