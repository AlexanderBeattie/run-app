import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClubService } from '../../core/services/club.service';
import { AuthService } from '../../core/services/auth.service';
import { RunsService } from '../../core/services/runs.service';
import { ToastService } from '../../shared/services/toast.service';
import { RunCardComponent } from '../../shared/components/run-card/run-card.component';
import { RunDetailDialogComponent } from '../../shared/components/run-detail-dialog/run-detail-dialog.component';
import { Club, ClubMember, RunEvent } from '../../core/models/run-event.model';

@Component({
    selector: 'app-club-profile',
    standalone: true,
    imports: [RouterLink, RunCardComponent, RunDetailDialogComponent],
    template: `
    <div class="page">
      @if (errorMessage()) {
        <div class="error-page">
          <div class="error-icon">⚠</div>
          <div class="error-title">Unable to load club</div>
          <div class="error-text">{{ errorMessage() }}</div>
          <button class="error-retry" (click)="retry()">Try again</button>
        </div>
      } @else if (!club) {
        <div class="loading-page"><div class="spinner"></div></div>
      } @else {
        <div class="header">
          @if (club.logo_url) { <img class="cover-img" [src]="club.logo_url" [alt]="club.name + ' cover'" /> }
          <button class="back" (click)="router.navigate(['/clubs'])">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div class="club-avatar" [style.background]="club.color ?? '#1D9E75'" [style.color]="headerTextColor()">{{ club.name.charAt(0).toUpperCase() }}</div>
          <div class="club-name-row">
            <div class="club-name">{{ club.name }}</div>
            @if (isVerified) { <div class="verified-badge" title="This club has hosted 10+ runs">✓ Verified</div> }
          </div>
          @if (club.city) { <div class="club-city">{{ club.city }}</div> }
          @if (club.description) { <div class="club-desc">{{ club.description }}</div> }
          <div class="club-stats">
            <div class="stat"><div class="sv">{{ club.member_count }}</div><div class="sl">members</div></div>
            <div class="stat"><div class="sv">{{ club.active_run_count ?? 0 }}</div><div class="sl">active runs</div></div>
            <div class="stat"><div class="sv">{{ totalAttendance }}</div><div class="sl">people going</div></div>
          </div>
          <div class="tag-row">
            @if (club.pace) { <span class="tag pace">{{ club.pace }}</span> }
            @for (t of club.tags ?? []; track t) { <span class="tag">{{ t }}</span> }
          </div>
          @if (!isOwner) {
            <button class="join-btn" [class.joined]="isMember" [style.background]="!isMember ? (club.color ?? '#1D9E75') : null" (click)="toggleJoin()">
              {{ isMember ? 'Leave club' : 'Join club' }}
            </button>
          } @else {
            <div class="owner-actions">
              <div class="owner-badge">You own this club</div>
              <button class="edit-btn" [style.color]="club.color ?? '#1D9E75'" [style.borderColor]="club.color ?? '#1D9E75'" (click)="router.navigate(['/clubs/edit', clubId])">Edit club</button>
            </div>
          }
        </div>

        <div class="content">
          <div class="section-title">Upcoming runs ({{ runs.length }})</div>
          @if (runs.length === 0) {
            <div class="empty">No upcoming runs.</div>
          } @else {
            <div class="run-list">
              @for (run of runs; track run.id) {
                <app-run-card
                  [run]="mapRun(run)"
                  [isJoined]="runsService.getJoinedRunIds()().includes(run.id)"
                  (cardClick)="selectedRun.set(mapRun(run))"
                  (joinToggle)="onJoinRun($event)" />
              }
            </div>
          }

          <div class="section-title">Members ({{ members.length }})</div>
          @if (members.length === 0) {
            <div class="empty">No members yet.</div>
          } @else {
            <div class="member-list">
              @for (m of members; track m.id) {
                <div class="member-row">
                  <div class="member-av">{{ m.display_name.charAt(0).toUpperCase() }}</div>
                  <div class="member-info">
                    <span class="member-name">{{ m.display_name }}</span>
                    @if (m.role === 'owner') { <span class="role-badge">Owner</span> }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    @if (selectedRun()) {
      <app-run-detail-dialog
        [run]="selectedRun()!"
        [isJoined]="runsService.getJoinedRunIds()().includes(selectedRun()!.id)"
        (close)="selectedRun.set(null)"
        (join)="onJoinRun($event)" />
    }
  `,
    styles: [`
    .page { background: #F7F7F5; min-height: 100%; overflow-x: hidden; }

    /* ── Error page ─────────────────────────────────────────────── */
    .error-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 20px;
      text-align: center;
    }
    .error-icon { font-size: 48px; margin-bottom: 16px; }
    .error-title { font-size: 18px; font-weight: 600; color: #0D0D0D; margin-bottom: 8px; }
    .error-text { font-size: 14px; color: #6B6B68; margin-bottom: 20px; }
    .error-retry {
      background: #0F6E56;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
    }
    .error-retry:hover { opacity: 0.9; }

    .loading-page { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(0,0,0,0.1); border-top-color: #1D9E75; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .header { padding: 16px 16px 20px; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; overflow: hidden; }
    .cover-img { width: calc(100% + 32px); height: 160px; object-fit: cover; object-position: center; display: block; margin: -16px -16px 0; flex-shrink: 0; }
    .back { position: absolute; top: 16px; left: 12px; background: rgba(0,0,0,0.3); border: none; color: #fff; border-radius: 50%; opacity: 1; cursor: pointer; display: flex; padding: 6px; flex-shrink: 0; }
    .club-avatar { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 600; margin-top: -40px; margin-bottom: 12px; border: 4px solid #F7F7F5; }
    .club-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 4px; }
    .club-name { font-size: 20px; font-weight: 500; color: #0D0D0D; word-break: break-word; }
    .verified-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(29,158,117,0.25); color: #1D9E75; border: 1px solid rgba(29,158,117,0.4); border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .club-city { font-size: 13px; color: #6B6B68; margin-bottom: 8px; }
    .club-desc { font-size: 13px; color: #3D3D3B; line-height: 1.5; margin-bottom: 14px; max-width: 100%; padding: 0 4px; }
    .club-stats { display: flex; gap: 16px; margin-bottom: 12px; }
    .stat { text-align: center; }
    .sv { font-size: 18px; font-weight: 500; color: #0D0D0D; }
    .sl { font-size: 10px; color: #6B6B68; margin-top: 2px; }
    .tag-row { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; margin-bottom: 14px; }
    .tag { background: rgba(0,0,0,0.06); color: #3A3A38; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 500; }
    .tag.pace { background: rgba(29,158,117,0.15); color: #0F6E56; text-transform: capitalize; }
    .join-btn { width: 100%; max-width: 280px; background: #0F6E56; color: #fff; border: none; border-radius: 12px; padding: 12px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .join-btn.joined { background: #F0F0EE; color: #6B6B68; }
    .owner-actions { display: flex; align-items: center; gap: 10px; }
    .owner-badge { font-size: 12px; color: #6B6B68; background: rgba(0,0,0,0.05); border-radius: 8px; padding: 6px 12px; }
    .edit-btn { background: rgba(29,158,117,0.1); color: #1D9E75; border: 1px solid rgba(29,158,117,0.4); border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .content { padding: 16px 12px 20px; }
    .section-title { font-size: 11px; font-weight: 500; color: #6B6B68; text-transform: uppercase; letter-spacing: 0.06em; padding: 0 4px; margin-bottom: 12px; }
    .empty { text-align: center; padding: 20px 16px; font-size: 13px; color: #6B6B68; margin-bottom: 16px; }
    .run-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .member-list { display: flex; flex-direction: column; gap: 2px; }
    .member-row { display: flex; align-items: center; gap: 10px; padding: 10px 8px; border-radius: 10px; min-width: 0; }
    .member-row:hover { background: #fff; }
    .member-av { width: 32px; height: 32px; border-radius: 50%; background: #E1F5EE; color: #0F6E56; font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .member-info { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
    .member-name { font-size: 13px; color: #0D0D0D; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .role-badge { font-size: 10px; font-weight: 500; color: #1D9E75; background: #E1F5EE; padding: 2px 6px; border-radius: 999px; flex-shrink: 0; }
  `]
})
export class ClubProfileComponent implements OnInit {
    route = inject(ActivatedRoute);
    router = inject(Router);
    clubService = inject(ClubService);
    runsService = inject(RunsService);
    auth = inject(AuthService);
    toast = inject(ToastService);
    cdr = inject(ChangeDetectorRef);

    club: Club | null = null;
    members: ClubMember[] = [];
    runs: any[] = [];
    isMember = false;
    selectedRun = signal<RunEvent | null>(null);
    errorMessage = signal<string | null>(null);
    clubId = '';

    get isOwner() { return this.club?.owner_id === this.auth.getUser()()?.id; }
    get isVerified() { return (this.club?.total_runs_count ?? 0) >= 10; }
    get totalAttendance() { return this.runs.reduce((sum, r) => sum + (r.attendees?.length ?? 0), 0); }

    headerTextColor(): string {
        const hex = (this.club?.color ?? '#0D0D0D').replace('#', '');
        if (hex.length < 6) return '#ffffff';
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance > 128 ? '#0a0a1a' : '#ffffff';
    }

    ngOnInit() {
        this.clubId = this.route.snapshot.paramMap.get('id') ?? '';
        this.loadClubData();
    }

    private loadClubData() {
        this.clubService.getClub(this.clubId).subscribe({
            next: (c) => {
                this.club = c;
                this.errorMessage.set(null);
                this.cdr.markForCheck();
            },
            error: () => {
                this.errorMessage.set('Failed to load club profile. Please try again.');
                this.cdr.markForCheck();
            }
        });
        this.clubService.getClubMembers(this.clubId).subscribe({
            next: (m) => {
                this.members = m;
                this.isMember = m.some(member => member.id === this.auth.getUser()()?.id);
                this.cdr.markForCheck();
            },
            error: () => {
                this.errorMessage.set('Failed to load members. Please try again.');
                this.cdr.markForCheck();
            }
        });
        this.clubService.getClubRuns(this.clubId).subscribe({
            next: (r) => {
                this.runs = r;
                this.errorMessage.set(null);
                this.cdr.markForCheck();
            },
            error: () => {
                this.errorMessage.set('Failed to load runs. Please try again.');
                this.cdr.markForCheck();
            }
        });
    }

    retry() {
        this.errorMessage.set(null);
        this.club = null;
        this.members = [];
        this.runs = [];
        this.loadClubData();
    }

    toggleJoin() {
        if (!this.club) return;
        this.clubService.toggleJoin(this.club.id);
        this.isMember = !this.isMember;
        if (this.club) {
            this.club = { ...this.club, member_count: this.club.member_count + (this.isMember ? 1 : -1) };
        }
        this.toast.show(this.isMember ? 'Joined club!' : 'Left club');
        this.cdr.markForCheck();
    }

    mapRun(r: any): RunEvent {
        return {
            id: r.id, clubId: r.club_id, clubName: r.club_name, title: r.title,
            startLocation: { lat: parseFloat(r.start_lat), lng: parseFloat(r.start_lng) },
            endLocation: { lat: parseFloat(r.end_lat), lng: parseFloat(r.end_lng) },
            startAddress: r.start_address, endAddress: r.end_address,
            date: new Date(r.event_date), distanceKm: parseFloat(r.distance_km),
            estimatedMinutes: r.estimated_minutes, attendees: r.attendees ?? [],
            maxAttendees: r.max_attendees, notes: r.notes,
            status: r.status, createdBy: r.created_by,
            pace: r.pace, tags: r.tags
        };
    }

    onJoinRun(runId: string) {
        this.runsService.toggleJoin(runId, this.auth.getUser()()?.id ?? 'guest');
        this.toast.show('Run updated!');
    }
}