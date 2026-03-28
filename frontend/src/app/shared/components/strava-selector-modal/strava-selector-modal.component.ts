import { Component, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { StravaActivity } from '../../../core/models/run-event.model';
import { StravaService } from '../../../core/services/strava.service';

@Component({
  selector: 'app-strava-selector-modal',
  standalone: true,
  imports: [],
  template: `
    <div class="overlay" (click)="onOverlayClick($event)">
      <div class="modal">
        <div class="drag-handle"></div>
        <button class="close" (click)="close.emit()">✕</button>
        <h3>Link Strava Activity</h3>
        <p class="subtitle">Select the run you completed</p>

        @if (loading()) {
          <div class="loading">
            <div class="spinner"></div>
            <span>Fetching your recent runs…</span>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <span>{{ error() }}</span>
            <button class="retry-btn" (click)="loadActivities()">Retry</button>
          </div>
        } @else if (activities().length === 0) {
          <div class="empty-state">No recent runs found on Strava.</div>
        } @else {
          <div class="activity-list">
            @for (a of activities(); track a.id) {
              <button
                class="activity-item"
                [class.selected]="selectedId() === a.id"
                (click)="selectedId.set(a.id)"
              >
                <div class="activity-main">
                  <span class="activity-name">{{ a.name }}</span>
                  <span class="activity-date">{{ formatDate(a.start_date_local) }}</span>
                </div>
                <div class="activity-stats">
                  <span>{{ formatDistance(a.distance) }}</span>
                  <span class="sep">·</span>
                  <span>{{ formatTime(a.moving_time) }}</span>
                </div>
              </button>
            }
          </div>
        }

        <div class="action-row">
          <button class="cancel-btn" (click)="close.emit()">Cancel</button>
          <button
            class="confirm-btn"
            [disabled]="selectedId() === null"
            (click)="onConfirm()"
          >
            Link Run
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; justify-content: center; z-index: 600; }
    .modal { background: #fff; border-radius: 20px 20px 0 0; width: 100%; max-width: 560px; max-height: 80dvh; display: flex; flex-direction: column; padding: 8px 20px 32px; }
    .drag-handle { width: 40px; height: 4px; background: rgba(0,0,0,0.15); border-radius: 2px; margin: 8px auto 16px; flex-shrink: 0; }
    .close { position: absolute; top: 20px; right: 16px; background: #F7F7F5; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 14px; cursor: pointer; color: #6B6B68; display: flex; align-items: center; justify-content: center; }
    h3 { font-size: 18px; font-weight: 600; color: #0D0D0D; margin: 0 0 4px; }
    .subtitle { font-size: 13px; color: #9B9B98; margin: 0 0 16px; }
    .loading { display: flex; align-items: center; gap: 10px; padding: 24px 0; color: #6B6B68; font-size: 14px; }
    .spinner { width: 18px; height: 18px; border: 2px solid #E1F5EE; border-top-color: #1D9E75; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-state { display: flex; flex-direction: column; gap: 10px; padding: 16px; background: #FEF2F2; border-radius: 10px; color: #7F1D1D; font-size: 13px; margin-bottom: 16px; }
    .retry-btn { align-self: flex-start; background: #FEE2E2; border: none; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 500; color: #7F1D1D; cursor: pointer; font-family: inherit; }
    .empty-state { font-size: 14px; color: #9B9B98; padding: 24px 0; text-align: center; }
    .activity-list { overflow-y: auto; flex: 1; margin: 0 -20px; padding: 0 20px; }
    .activity-item { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 12px 0; border: none; border-bottom: 1px solid #F0F0EE; background: transparent; cursor: pointer; font-family: inherit; text-align: left; border-left: 3px solid transparent; padding-left: 8px; margin-left: -8px; }
    .activity-item:hover { background: #F7F7F5; }
    .activity-item.selected { border-left-color: #1D9E75; background: #F0FAF6; }
    .activity-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .activity-name { font-size: 14px; font-weight: 500; color: #0D0D0D; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
    .activity-date { font-size: 12px; color: #9B9B98; }
    .activity-stats { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #6B6B68; white-space: nowrap; flex-shrink: 0; }
    .sep { color: #C0C0BE; }
    .action-row { display: flex; gap: 10px; padding-top: 16px; flex-shrink: 0; }
    .cancel-btn { background: #F7F7F5; color: #0D0D0D; border: none; border-radius: 12px; padding: 14px 20px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .confirm-btn { flex: 1; background: #1D9E75; color: #E1F5EE; border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .confirm-btn:disabled { background: #B0D8CA; cursor: not-allowed; }
    @media (min-width: 600px) {
      .overlay { align-items: center; padding: 20px; }
      .modal { border-radius: 20px; max-height: 80vh; }
    }
  `]
})
export class StravaSelectorModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() selected = new EventEmitter<StravaActivity>();

  private strava = inject(StravaService);
  activities = signal<StravaActivity[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedId = signal<number | null>(null);

  ngOnInit() { this.loadActivities(); }

  loadActivities() {
    this.loading.set(true);
    this.error.set(null);
    this.strava.getActivities().subscribe({
      next: (data) => { this.activities.set(data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.error?.error ?? 'Failed to load activities');
        this.loading.set(false);
      },
    });
  }

  onConfirm() {
    const act = this.activities().find(a => a.id === this.selectedId());
    if (act) this.selected.emit(act);
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.close.emit();
  }

  formatDistance(m: number): string { return (m / 1000).toFixed(2) + 'k'; }

  formatTime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
}
