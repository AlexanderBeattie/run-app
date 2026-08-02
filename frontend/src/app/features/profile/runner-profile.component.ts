import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { OrganiserHomeComponent } from '../clubs/organiser-home.component';
import { RunDetailDialogComponent } from '../../shared/components/run-detail-dialog/run-detail-dialog.component';
import { RunCardComponent } from '../../shared/components/run-card/run-card.component';
import { RoutePreviewComponent } from '../../shared/components/route-preview/route-preview.component';
import { SettingsMenuComponent } from '../../shared/components/settings-menu/settings-menu.component';
import { RunEvent } from '../../core/models/run-event.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-runner-profile',
  standalone: true,
  imports: [OrganiserHomeComponent, RunDetailDialogComponent, RunCardComponent, RoutePreviewComponent, SettingsMenuComponent],
  template: `
    <div class="page">

      <!-- Hero Header -->
      <div class="hero-card">
        <button class="settings-btn" (click)="showSettings.set(true)" aria-label="Open settings">⚙</button>
        <div class="hero-avatar">{{ initials }}</div>
        <div class="hero-name">{{ auth.getUser()()?.displayName }}</div>
        <div class="role">{{ auth.isOrganizer() ? 'Organiser' : 'Runner' }}</div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-sv">{{ runs.length }}</div>
            <div class="hero-sl">Runs</div>
          </div>
          <div class="hero-divider"></div>
          <div class="hero-stat">
            <div class="hero-sv">{{ totalKm }}k</div>
            <div class="hero-sl">Distance</div>
          </div>
          <div class="hero-divider"></div>
          <div class="hero-stat">
            <div class="hero-sv">{{ verifiedPace() !== null ? formatPace(verifiedPace()!) : '—' }}</div>
            <div class="hero-sl">Pace</div>
          </div>
        </div>
      </div>

      <!-- Organiser mode toggle -->

      @if (auth.isOrganizer()) {
        <div class="toggle-wrap">
          <div class="mode-toggle">
            <button class="mode-btn" [class.active]="viewMode() === 'runner'" (click)="viewMode.set('runner')">Runner</button>
            <button class="mode-btn" [class.active]="viewMode() === 'organiser'" (click)="viewMode.set('organiser')">Organiser</button>
          </div>
        </div>
      }

      <!-- Runner view -->
      @if (viewMode() === 'runner') {
        <div class="runner-view">

        <!-- Segmented tabs -->
        <div class="tabs-container">
          <div class="tab-track">
            <div class="tab-slider" [class.right]="activeTab() === 'past'"></div>
            <button class="tab-btn" [class.active]="activeTab() === 'upcoming'" (click)="activeTab.set('upcoming')">Upcoming</button>
            <button class="tab-btn" [class.active]="activeTab() === 'past'" (click)="activeTab.set('past')">Past</button>
          </div>
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

        @if (!loaded) {
          <div class="empty">Loading...</div>
        } @else {
          <div class="list">
            @if (activeTab() === 'upcoming') {
              @if (upcomingRuns.length === 0) {
                <div class="empty">No upcoming runs. Find one on the map!</div>
              } @else {
                @for (run of upcomingRuns; track run.id) {
                  <app-run-card [run]="run" [isJoined]="true"
                    (cardClick)="openDialog($event)"
                    (joinToggle)="onJoin($event)" />
                }
              }
            } @else {
              @if (pastRuns.length === 0) {
                <div class="empty">No past runs yet.</div>
              } @else {
                @for (run of pastRuns; track run.id) {
                  <app-run-card [run]="run" [isJoined]="true"
                    (cardClick)="openDialog($event)"
                    (joinToggle)="onJoin($event)" />
                  @if (run.strava_polyline) {
                    <app-route-preview [polyline]="run.strava_polyline" />
                  }
                }
              }
            }
          </div>
        }
        </div>
      }

      <!-- Organiser view -->
      @if (viewMode() === 'organiser') {
        <app-organiser-home [embedded]="true" />
      }

    </div>

    <!-- Run detail dialog -->
    @if (selectedRun()) {
      <app-run-detail-dialog
        [run]="selectedRun()!"
        [isJoined]="true"
        (close)="selectedRun.set(null)"
        (join)="onJoin($event)" />
    }

    <!-- Settings bottom sheet -->
    @if (showSettings()) {
      <app-settings-menu
        [stravaConnected]="auth.getUser()()?.stravaConnected ?? false"
        (close)="showSettings.set(false)"
        (logout)="onLogout()"
        (connectStrava)="connectStrava()" />
    }
  `,
  styles: [`
    .page { padding-bottom: 24px; background: #F7F7F5; min-height: 100%; overflow-x: hidden; }

    /* ── Hero ──────────────────────────────────────────────────── */
    .hero-card {
      position: relative;
      background: #0D0D0D;
      background-image: radial-gradient(ellipse at 50% 0%, rgba(29,158,117,0.18) 0%, transparent 65%);
      padding: 52px 20px 24px;
      text-align: center;
    }
    .settings-btn {
      position: absolute; top: 16px; right: 16px;
      width: 44px; height: 44px;
      background: rgba(255,255,255,0.1); border: none; border-radius: 50%;
      color: rgba(255,255,255,0.7); font-size: 18px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-family: inherit;
    }
    .settings-btn:active { background: rgba(255,255,255,0.18); }

    .hero-avatar {
      width: 64px; height: 64px; border-radius: 50%;
      background: rgba(29,158,117,0.2); border: 1.5px solid rgba(29,158,117,0.45);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 600; color: #4adebc;
      margin: 0 auto 12px;
    }
    .hero-name { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 4px; }
    .role { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 24px; }

    .hero-stats {
      display: flex; align-items: stretch;
      background: rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden;
    }
    .hero-stat { flex: 1; padding: 14px 8px; text-align: center; }
    .hero-sv { font-size: 18px; font-weight: 600; color: #fff; }
    .hero-sl { font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.05em; }
    .hero-divider { width: 0.5px; background: rgba(255,255,255,0.1); margin: 10px 0; flex-shrink: 0; }

    /* ── Mode toggle ─────────────────────────────────────────── */
    .toggle-wrap { background: #0D0D0D; padding: 0 16px 16px; }
    .mode-toggle { display: flex; background: rgba(255,255,255,0.12); border-radius: 999px; padding: 3px; gap: 2px; }
    .mode-btn { flex: 1; min-height: 44px; border: none; border-radius: 999px; background: transparent; color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: background 0.18s, color 0.18s; }
    .mode-btn.active { background: #fff; color: #0D0D0D; }

    /* ── Segmented tabs ──────────────────────────────────────── */
    .tabs-container { padding: 16px 16px 0; }
    .tab-track {
      position: relative;
      display: flex;
      background: #F0F0F0; border-radius: 999px; padding: 3px;
    }
    .tab-slider {
      position: absolute; top: 3px; bottom: 3px;
      left: 3px; width: calc(50% - 3px);
      background: #fff; border-radius: 999px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform;
    }
    .tab-slider.right { transform: translateX(100%); }
    .tab-btn {
      flex: 1; min-height: 44px; border: none; background: transparent;
      border-radius: 999px; z-index: 1;
      font-size: 14px; font-weight: 500; color: #6B6B68;
      cursor: pointer; font-family: inherit; transition: color 0.18s;
    }
    .tab-btn.active { color: #0D0D0D; }

    /* ── Run list ────────────────────────────────────────────── */
    .list { display: flex; flex-direction: column; gap: 12px; padding: 16px 12px; }
    .empty { text-align: center; padding: 40px 16px; font-size: 14px; color: #6B6B68; }

    /* ── Error ───────────────────────────────────────────────── */
    .error-banner {
      display: flex; align-items: flex-start; gap: 12px;
      margin: 14px 16px 0;
      background: #FCEBEB; border: 1px solid #E89999; border-radius: 12px; padding: 12px 14px;
    }
    .error-icon { font-size: 18px; flex-shrink: 0; }
    .error-title { font-size: 14px; font-weight: 600; color: #A32D2D; margin-bottom: 2px; }
    .error-text { font-size: 13px; color: #8B2828; }
    .error-close { background: none; border: none; color: #A32D2D; cursor: pointer; font-size: 20px; padding: 0; margin-left: auto; flex-shrink: 0; }
  `]
})
export class RunnerProfileComponent implements OnInit {
  svc = inject(RunsService);
  auth = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  runs: RunEvent[] = [];
  loaded = false;
  errorMessage = signal<string | null>(null);
  viewMode = signal<'runner' | 'organiser'>('runner');
  verifiedPace = signal<number | null>(null);
  selectedRun = signal<RunEvent | null>(null);
  showSettings = signal(false);
  activeTab = signal<'upcoming' | 'past'>('upcoming');

  get initials(): string {
    return (this.auth.getUser()()?.displayName ?? '')
      .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  get totalKm(): number {
    return Math.round(this.runs.reduce((acc, r) => acc + (r.distanceKm ?? 0), 0));
  }

  get upcomingRuns(): RunEvent[] {
    const now = new Date();
    return this.runs.filter(r => r.date >= now);
  }

  get pastRuns(): RunEvent[] {
    const now = new Date();
    return this.runs.filter(r => r.date < now);
  }

  connectStrava(): void {
    const token = this.auth.getToken();
    if (!token) return;
    window.location.href = `${environment.apiUrl}/auth/strava?token=${encodeURIComponent(token)}`;
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('strava') === 'connected') {
      this.auth.setStravaConnected();
      this.router.navigate([], { replaceUrl: true, queryParams: {} });
    }

    this.svc.getJoinedRuns().subscribe({
      next: (data) => {
        this.runs = data.map((r: any) => this.svc.mapRun(r));
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

  formatPace(secondsPerKm: number): string {
    const mins = Math.floor(secondsPerKm / 60);
    const secs = Math.round(secondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/k`;
  }

  openDialog(run: RunEvent): void { this.selectedRun.set(run); }

  onJoin(runId: string): void {
    this.svc.toggleJoin(runId, this.auth.getUser()()?.id ?? 'guest');
  }

  onLogout(): void {
    this.showSettings.set(false);
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
