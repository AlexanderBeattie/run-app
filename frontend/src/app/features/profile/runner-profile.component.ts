import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { OrganiserHomeComponent } from '../clubs/organiser-home.component';
import { RunDetailDialogComponent } from '../../shared/components/run-detail-dialog/run-detail-dialog.component';
import { RunEvent } from '../../core/models/run-event.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-runner-profile',
  standalone: true,
  imports: [OrganiserHomeComponent, RunDetailDialogComponent],
  template: `
    <div class="page">
      <div class="profile-header">
        <div class="avatar">{{ initials }}</div>
        <div class="info">
          <div class="name">{{ auth.getUser()()?.displayName }}</div>
          <div class="role">{{ auth.isOrganizer() ? 'Organiser' : 'Runner' }}</div>
        </div>
        <button class="logout" (click)="logout()">Log out</button>
      </div>

      @if (auth.isOrganizer()) {
        <div class="toggle-wrap">
          <div class="mode-toggle">
            <button class="mode-btn" [class.active]="viewMode() === 'runner'" (click)="viewMode.set('runner')">Runner</button>
            <button class="mode-btn" [class.active]="viewMode() === 'organiser'" (click)="viewMode.set('organiser')">Organiser</button>
          </div>
        </div>
      }

      @if (viewMode() === 'runner') {
        <div class="runner-view">
          <div class="stats-row">
            <div class="stat"><div class="sv">{{ runs.length }}</div><div class="sl">runs joined</div></div>
            <div class="stat"><div class="sv">{{ totalKm }}k</div><div class="sl">total distance</div></div>
            @if (verifiedPace() !== null) {
              <div class="stat"><div class="sv">{{ formatPace(verifiedPace()!) }}</div><div class="sl">verified pace</div></div>
            }
          </div>

          <div class="strava-section">
            @if (auth.getUser()()?.stravaConnected) {
              <div class="strava-connected">
                <svg class="strava-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" fill="#FC4C02"/></svg>
                <span class="strava-label">Connected to Strava</span>
                <span class="strava-check">✓</span>
              </div>
            } @else {
              <button class="strava-btn" (click)="connectStrava()" aria-label="Connect with Strava">
                <svg class="strava-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" fill="#fff"/></svg>
                Connect with Strava
              </button>
            }
          </div>

          @if (errorMessage()) {
            <div class="error-banner">
              <div class="error-icon">⚠</div>
              <div>
                <div class="error-title">Unable to load runs</div>
                <div class="error-text">{{ errorMessage() }}</div>
              </div>
              <button class="error-close" (click)="errorMessage.set(null)">×</button>
            </div>
          }

          <div class="section-title">Your upcoming runs</div>

          @if (!loaded) {
            <div class="empty">Loading...</div>
          } @else if (runs.length === 0) {
            <div class="empty">No runs yet. Find one on the map!</div>
          } @else {
            <div class="list">
              @for (run of runs; track run.id) {
                <div class="run-item" (click)="openDialog(run)" style="cursor:pointer">
                  <div class="run-left">
                    @if (run.club_name) { <div class="run-club">{{ run.club_name }}</div> }
                    <div class="run-title">{{ run.title }}</div>
                    <div class="run-meta">{{ formatDate(run.event_date) }} · {{ run.distance_km }}k</div>
                  </div>
                  <div class="run-badge">{{ run.distance_km }}k</div>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (viewMode() === 'organiser') {
        <app-organiser-home [embedded]="true" />
      }
    </div>

    @if (selectedRun()) {
      <app-run-detail-dialog
        [run]="selectedRun()!"
        [isJoined]="true"
        (close)="selectedRun.set(null)"
        (join)="onJoin($event)" />
    }
  `,
  styles: [`
    .page { padding: 0 0 24px; background: #F7F7F5; min-height: 100%; overflow-x: hidden; }
    .profile-header { background: #0D0D0D; padding: 16px 16px 20px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .avatar { width: 48px; height: 48px; border-radius: 50%; background: #E1F5EE; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 500; color: #0F6E56; flex-shrink: 0; }
    .info { flex: 1; min-width: 0; }
    .name { font-size: 15px; font-weight: 500; color: #fff; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .role { font-size: 12px; color: rgba(255,255,255,0.5); }
    .logout { background: rgba(255,255,255,0.08); border: none; color: rgba(255,255,255,0.6); border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; font-family: inherit; flex-shrink: 0; white-space: nowrap; }

    /* ── Mode toggle ─────────────────────────────────────────── */
    .toggle-wrap { background: #0D0D0D; padding: 0 16px 16px; }
    .mode-toggle { display: flex; background: rgba(255,255,255,0.12); border-radius: 999px; padding: 3px; gap: 2px; }
    .mode-btn { flex: 1; padding: 8px 0; border: none; border-radius: 999px; background: transparent; color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: background 0.18s, color 0.18s; }
    .mode-btn.active { background: #fff; color: #0D0D0D; }

    /* ── Runner view ─────────────────────────────────────────── */
    .stats-row { display: flex; padding: 14px 12px 8px; gap: 10px; }
    .stat { flex: 1; background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 12px; text-align: center; }
    .sv { font-size: 18px; font-weight: 500; color: #0D0D0D; }
    .sl { font-size: 10px; color: #9B9B98; margin-top: 2px; }

    .error-banner {
      display: flex; align-items: flex-start; gap: 12px;
      margin: 14px 16px 12px 16px;
      background: #FCEBEB; border: 1px solid #E89999; border-radius: 12px; padding: 12px 14px;
    }
    .error-icon { font-size: 18px; flex-shrink: 0; }
    .error-title { font-size: 14px; font-weight: 600; color: #A32D2D; margin-bottom: 2px; }
    .error-text { font-size: 13px; color: #8B2828; }
    .error-close { background: none; border: none; color: #A32D2D; cursor: pointer; font-size: 20px; padding: 0; margin-left: auto; flex-shrink: 0; }

    .strava-section { padding: 0 12px 12px; }
    .strava-btn { display: flex; align-items: center; gap: 8px; width: 100%; background: #FC4C02; border: none; border-radius: 12px; padding: 13px 16px; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; justify-content: center; }
    .strava-btn:hover { background: #e04400; }
    .strava-btn:focus-visible { outline: 2px solid #FC4C02; outline-offset: 2px; }
    .strava-connected { display: flex; align-items: center; gap: 8px; background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 13px 16px; }
    .strava-label { font-size: 14px; font-weight: 500; color: #0D0D0D; flex: 1; }
    .strava-check { font-size: 14px; color: #1D9E75; font-weight: 600; }
    .strava-icon { width: 20px; height: 20px; flex-shrink: 0; }
    .section-title { font-size: 11px; font-weight: 500; color: #9B9B98; text-transform: uppercase; letter-spacing: 0.06em; padding: 14px 14px 10px; }
    .empty { text-align: center; padding: 40px 16px; font-size: 14px; color: #9B9B98; }
    .list { display: flex; flex-direction: column; gap: 2px; padding: 0 12px; }
    .run-item { display: flex; justify-content: space-between; align-items: center; gap: 10px; background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 12px; min-width: 0; }
    .run-left { flex: 1; min-width: 0; }
    .run-club { font-size: 11px; color: #1D9E75; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px; }
    .run-title { font-size: 13px; font-weight: 500; color: #0D0D0D; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .run-meta { font-size: 12px; color: #6B6B68; }
    .run-badge { background: #E1F5EE; color: #0F6E56; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 500; flex-shrink: 0; }
  `]
})
export class RunnerProfileComponent implements OnInit {
  svc = inject(RunsService);
  auth = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  runs: any[] = [];
  loaded = false;
  errorMessage = signal<string | null>(null);
  viewMode = signal<'runner' | 'organiser'>('runner');
  verifiedPace = signal<number | null>(null);
  selectedRun = signal<RunEvent | null>(null);

  get initials() { return (this.auth.getUser()()?.displayName ?? '').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2); }
  get totalKm() { return Math.round(this.runs.reduce((acc, r) => acc + parseFloat(r.distance_km), 0)); }

  connectStrava() {
    const token = this.auth.getToken();
    if (!token) return;
    window.location.href = `${environment.apiUrl}/auth/strava?token=${encodeURIComponent(token)}`;
  }

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('strava') === 'connected') {
      this.auth.setStravaConnected();
      this.router.navigate([], { replaceUrl: true, queryParams: {} });
    }

    this.svc.getJoinedRuns().subscribe({
      next: (data) => {
        this.runs = data;
        this.loaded = true;
        this.errorMessage.set(null);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loaded = true;
        this.errorMessage.set('Failed to load your runs. Please try again.');
        this.cdr.markForCheck();
      }
    });

    const userId = this.auth.getUser()()?.id;
    if (userId) {
      this.svc.getUserProfile(userId).subscribe({
        next: (profile) => {
          this.verifiedPace.set(profile.verified_pace);
          this.cdr.markForCheck();
        },
        error: () => {}
      });
    }
  }

  formatDate(date: string) {
    const d = new Date(date);
    const diff = d.getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return 'Past';
    if (days === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  formatPace(secondsPerKm: number): string {
    const mins = Math.floor(secondsPerKm / 60);
    const secs = Math.round(secondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/k`;
  }

  openDialog(run: any) { this.selectedRun.set(this.svc.mapRun(run)); }

  onJoin(runId: string) {
    this.svc.toggleJoin(runId, this.auth.getUser()()?.id ?? 'guest');
  }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}
