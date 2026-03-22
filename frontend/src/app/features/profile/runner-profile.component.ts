import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-runner-profile',
  standalone: true,
  template: `
    <div class="page">
      <div class="profile-header">
        <div class="avatar">{{ initials }}</div>
        <div class="info">
          <div class="name">{{ auth.getUser()()?.displayName }}</div>
          <div class="role">Runner</div>
        </div>
        <button class="logout" (click)="logout()">Log out</button>
      </div>

      <div class="stats-row">
        <div class="stat"><div class="sv">{{ runs.length }}</div><div class="sl">runs joined</div></div>
        <div class="stat"><div class="sv">{{ totalKm }}k</div><div class="sl">total distance</div></div>
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
            <div class="run-item">
              <div class="run-left">
                <div class="run-club">{{ run.club_name }}</div>
                <div class="run-title">{{ run.title }}</div>
                <div class="run-meta">{{ formatDate(run.event_date) }} · {{ run.distance_km }}k</div>
              </div>
              <div class="run-badge">{{ run.distance_km }}k</div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 0 0 24px; }
    .profile-header { background: #0D0D0D; padding: 20px 20px 24px; display: flex; align-items: center; gap: 14px; }
    .avatar { width: 52px; height: 52px; border-radius: 50%; background: #E1F5EE; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 500; color: #0F6E56; flex-shrink: 0; }
    .info { flex: 1; }
    .name { font-size: 17px; font-weight: 500; color: #fff; margin-bottom: 2px; }
    .role { font-size: 13px; color: rgba(255,255,255,0.5); }
    .logout { background: rgba(255,255,255,0.08); border: none; color: rgba(255,255,255,0.6); border-radius: 8px; padding: 7px 12px; font-size: 13px; cursor: pointer; font-family: inherit; }
    .stats-row { display: flex; padding: 16px 16px 8px; gap: 12px; }
    .stat { flex: 1; background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 14px; text-align: center; }
    .sv { font-size: 22px; font-weight: 500; color: #0D0D0D; }
    .sl { font-size: 11px; color: #9B9B98; margin-top: 2px; }

    /* ── Error banner ─────────────────────────────────────────── */
    .error-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin: 14px 16px 12px 16px;
      background: #FCEBEB;
      border: 1px solid #E89999;
      border-radius: 12px;
      padding: 12px 14px;
    }
    .error-icon { font-size: 18px; flex-shrink: 0; }
    .error-title { font-size: 14px; font-weight: 600; color: #A32D2D; margin-bottom: 2px; }
    .error-text { font-size: 13px; color: #8B2828; }
    .error-close {
      background: none;
      border: none;
      color: #A32D2D;
      cursor: pointer;
      font-size: 20px;
      padding: 0;
      margin-left: auto;
      flex-shrink: 0;
    }

    .section-title { font-size: 11px; font-weight: 500; color: #9B9B98; text-transform: uppercase; letter-spacing: 0.06em; padding: 16px 20px 10px; }
    .empty { text-align: center; padding: 40px 20px; font-size: 14px; color: #9B9B98; }
    .list { display: flex; flex-direction: column; gap: 2px; padding: 0 12px; }
    .run-item { display: flex; justify-content: space-between; align-items: center; background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 14px; }
    .run-club { font-size: 11px; color: #1D9E75; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px; }
    .run-title { font-size: 14px; font-weight: 500; color: #0D0D0D; margin-bottom: 3px; }
    .run-meta { font-size: 12px; color: #6B6B68; }
    .run-badge { background: #E1F5EE; color: #0F6E56; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 500; flex-shrink: 0; margin-left: 12px; }
  `]
})
export class RunnerProfileComponent implements OnInit {
  svc = inject(RunsService);
  auth = inject(AuthService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  runs: any[] = [];
  loaded = false;
  errorMessage = signal<string | null>(null);

  get initials() { return (this.auth.getUser()()?.displayName ?? '').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2); }
  get totalKm() { return Math.round(this.runs.reduce((acc, r) => acc + parseFloat(r.distance_km), 0)); }

  ngOnInit() {
    this.svc.getJoinedRuns().subscribe({
      next: (data) => {
        this.runs = data;
        this.loaded = true;
        this.errorMessage.set(null);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loaded = true;
        this.errorMessage.set('Failed to load your runs. Please try again.');
        this.cdr.markForCheck();
      }
    });
  }

  formatDate(date: string) {
    const d = new Date(date);
    const diff = d.getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return 'Past';
    if (days === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}