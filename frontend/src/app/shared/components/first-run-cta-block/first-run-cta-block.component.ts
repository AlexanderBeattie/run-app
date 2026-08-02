import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RunEvent } from '../../../core/models/run-event.model';
import { RunsService } from '../../../core/services/runs.service';

const DISMISSED_KEY = 'klub-first-run-dismissed';

@Component({
  selector: 'app-first-run-cta-block',
  standalone: true,
  template: `
    <div class="cta-block">
      <div class="cta-header">
        <div class="cta-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" fill="#E1F5EE"/>
            <path d="M12 4C9.24 4 7 6.18 7 8.86 7 12.5 12 18 12 18s5-5.5 5-9.14C17 6.18 14.76 4 12 4zm0 6.6a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5z" fill="#1D9E75"/>
          </svg>
          Your First Run
        </div>
        <button class="dismiss-btn" aria-label="Dismiss" (click)="onDismiss()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B68" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <p class="cta-sub">Runs happening close to you. Pick one and go.</p>

      <div class="runs-list">
        @for (run of runs; track run.id) {
          <div class="run-row" (click)="runClick.emit(run)">
            <div class="run-dot" [style.background]="gradientForPace(run.pace)"></div>
            <div class="run-info">
              <div class="run-title">{{ run.title }}</div>
              <div class="run-meta">
                {{ runsService.formatDate(run.date) }} · {{ run.distanceKm }}km
                @if (run.attendees.length > 0) {
                  · {{ run.attendees.length }} going
                }
              </div>
            </div>
            @if (run.distanceFromUserKm !== undefined) {
              <div class="dist-badge">{{ formatDistance(run.distanceFromUserKm) }}</div>
            }
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .cta-block {
      background: #fff;
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 2px 12px rgba(29,158,117,0.1), 0 0 0 1.5px rgba(29,158,117,0.15);
      margin-bottom: 4px;
    }
    .cta-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .cta-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #0F6E56;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .dismiss-btn {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    .cta-sub {
      font-size: 13px;
      color: #6B6B68;
      margin: 0 0 14px;
    }
    .runs-list {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .run-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #F0F0EE;
      cursor: pointer;
    }
    .run-row:last-child { border-bottom: none; }
    .run-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .run-info { flex: 1; min-width: 0; }
    .run-title {
      font-size: 14px;
      font-weight: 600;
      color: #0D0D0D;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .run-meta { font-size: 12px; color: #6B6B68; margin-top: 2px; }
    .dist-badge {
      flex-shrink: 0;
      font-size: 11px;
      font-weight: 600;
      color: #0F6E56;
      background: #E1F5EE;
      border-radius: 999px;
      padding: 3px 9px;
    }
  `]
})
export class FirstRunCtaBlockComponent {
  @Input() runs: RunEvent[] = [];
  @Output() runClick = new EventEmitter<RunEvent>();
  @Output() dismissed = new EventEmitter<void>();

  runsService = inject(RunsService);

  onDismiss(): void {
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(DISMISSED_KEY, '1');
    }
    this.dismissed.emit();
  }

  formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  }

  gradientForPace(pace?: string): string {
    const g: Record<string, string> = {
      easy:     '#1D9E75',
      social:   '#10B981',
      moderate: '#3B82F6',
      fast:     '#EF4444',
      tempo:    '#F59E0B',
    };
    return g[pace ?? ''] ?? '#6B6B68';
  }
}
