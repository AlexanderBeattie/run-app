import { Component, Input, Output, EventEmitter, inject, OnInit, signal, HostListener } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RunsService } from '../../../core/services/runs.service';

type RunnerProfile = {
  id: string;
  display_name: string;
  total_runs: number;
  total_distance_km: number;
  favorite_pace: string | null;
  verified_pace: number | null;
  recent_runs: { id: string; title: string; club_name: string; distance_km: number; pace: string | null; attended_date: string; strava_activity_id: number | null }[];
};

@Component({
  selector: 'app-runner-profile-dialog',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="overlay" (click)="onOverlay($event)">
      <div class="card" role="dialog" aria-modal="true" [attr.aria-label]="profile()?.display_name ? 'Profile for ' + profile()!.display_name : 'Runner profile'">
        <button class="close" (click)="close.emit()" aria-label="Close profile">✕</button>

        @if (loading()) {
          <div class="skeleton">
            <div class="sk-av"></div>
            <div class="sk-line wide"></div>
            <div class="sk-line narrow"></div>
            <div class="sk-stats"></div>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <div class="error-icon">!</div>
            <p>Unable to load profile</p>
            <button class="dismiss-btn" (click)="close.emit()">Dismiss</button>
          </div>
        } @else if (profile()) {
          <div class="av">{{ profile()!.display_name.charAt(0).toUpperCase() || '?' }}</div>
          <div class="name">{{ profile()!.display_name }}</div>
          <div class="stats-row">
            <div class="stat">
              <div class="sv">{{ profile()!.total_runs }}</div>
              <div class="sl">runs</div>
            </div>
            <div class="stat">
              <div class="sv">{{ (profile()!.total_distance_km | number:'1.0-0') }}k</div>
              <div class="sl">distance</div>
            </div>
            <div class="stat">
              <div class="sv">
                {{ profile()!.verified_pace ? (profile()!.verified_pace! | number:'1.2-2') + ' /k' : (profile()!.favorite_pace ?? '—') }}
              </div>
              @if (profile()!.verified_pace) {
                <div class="sl verified-label">
                  <svg class="strava-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.17" fill="#FC4C02"/></svg>
                  verified
                </div>
              } @else {
                <div class="sl">pace</div>
              }
            </div>
          </div>
          @if (profile()!.recent_runs.length > 0) {
            <div class="section-title">Recent runs</div>
            <ul class="recent-list">
              @for (r of profile()!.recent_runs; track r.id) {
                <li class="recent-item">
                  <span class="recent-title">
                    @if (r.strava_activity_id) {
                      <svg class="run-strava-icon" viewBox="0 0 24 24" aria-label="Strava verified run"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.17" fill="#FC4C02"/></svg>
                    }
                    {{ r.title }}
                  </span>
                  <span class="recent-meta">{{ r.club_name }} · {{ r.distance_km }}k</span>
                </li>
              }
            </ul>
          } @else {
            <p class="no-runs">No runs yet. Early days!</p>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 600; padding: 20px; }
    .card { background: #fff; border-radius: 20px; width: 100%; max-width: 340px; padding: 28px 24px 24px; position: relative; text-align: center; }
    .close { position: absolute; top: 14px; right: 14px; background: #F7F7F5; border: none; width: 28px; height: 28px; border-radius: 50%; font-size: 13px; cursor: pointer; color: #6B6B68; display: flex; align-items: center; justify-content: center; }
    .close:focus-visible { outline: 2px solid #1D9E75; outline-offset: 2px; }
    .av { width: 64px; height: 64px; border-radius: 50%; background: #E1F5EE; color: #0F6E56; font-size: 26px; font-weight: 600; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
    .name { font-size: 18px; font-weight: 600; color: #0D0D0D; margin-bottom: 20px; }
    .stats-row { display: flex; background: #F7F7F5; border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
    .stat { flex: 1; padding: 12px 8px; border-right: 0.5px solid rgba(0,0,0,0.08); }
    .stat:last-child { border-right: none; }
    .sv { font-size: 17px; font-weight: 600; color: #0D0D0D; text-transform: capitalize; }
    .sl { font-size: 10px; color: #6B6B68; margin-top: 2px; }
    .verified-label { display: flex; align-items: center; justify-content: center; gap: 3px; color: #FC4C02; }
    .strava-icon { width: 10px; height: 10px; flex-shrink: 0; }
    .run-strava-icon { width: 11px; height: 11px; flex-shrink: 0; vertical-align: middle; margin-right: 3px; }
    .section-title { font-size: 11px; font-weight: 500; color: #6B6B68; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; text-align: left; }
    .recent-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
    .recent-item { display: flex; flex-direction: column; background: #F7F7F5; border-radius: 10px; padding: 8px 12px; text-align: left; }
    .recent-title { font-size: 13px; font-weight: 500; color: #0D0D0D; }
    .recent-meta { font-size: 11px; color: #6B6B68; margin-top: 2px; }
    .no-runs { font-size: 13px; color: #6B6B68; margin: 0; }
    .error-state { padding: 16px 0; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .error-icon { width: 40px; height: 40px; border-radius: 50%; background: #FEE2E2; color: #7f1d1d; font-size: 20px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .error-state p { font-size: 14px; color: #3D3D3B; margin: 0; }
    .dismiss-btn { background: #F7F7F5; border: none; border-radius: 10px; padding: 8px 20px; font-size: 14px; cursor: pointer; font-family: inherit; color: #0D0D0D; }
    .skeleton { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 4px 0; }
    .sk-av { width: 64px; height: 64px; border-radius: 50%; background: #F0F0EE; animation: pulse 1.4s ease-in-out infinite; }
    .sk-line { height: 14px; border-radius: 8px; background: #F0F0EE; animation: pulse 1.4s ease-in-out infinite; }
    .sk-line.wide { width: 60%; }
    .sk-line.narrow { width: 40%; }
    .sk-stats { width: 100%; height: 56px; border-radius: 12px; background: #F0F0EE; animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @media (max-width: 400px) {
      .overlay { padding: 12px 0 0; align-items: flex-end; }
      .card { max-width: 100%; border-radius: var(--radius-sheet, 24px) var(--radius-sheet, 24px) 0 0; }
    }
  `]
})
export class RunnerProfileDialogComponent implements OnInit {
  @Input() userId!: string;
  @Output() close = new EventEmitter<void>();

  private svc = inject(RunsService);
  loading = signal(true);
  error = signal(false);
  profile = signal<RunnerProfile | null>(null);

  ngOnInit() {
    this.svc.getUserProfile(this.userId).subscribe({
      next: (data) => { this.profile.set(data); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }

  onOverlay(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape() { this.close.emit(); }
}
