import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RunEvent } from '../../../core/models/run-event.model';
import { RunsService } from '../../../core/services/runs.service';

@Component({
  selector: 'app-run-card',
  standalone: true,
  template: `
    <div class="card" (click)="cardClick.emit(run)">
      <div class="banner" [style.background]="bannerGradient">
        <svg class="route-svg" viewBox="0 0 280 80" preserveAspectRatio="none">
          <path d="M 28 58 Q 80 18 140 38 Q 200 58 252 22"
                stroke="rgba(255,255,255,0.35)" stroke-width="2.5"
                fill="none" stroke-dasharray="5 4" stroke-linecap="round"/>
          <circle cx="28" cy="58" r="5" fill="rgba(255,255,255,0.95)"/>
          <circle cx="252" cy="22" r="5" fill="transparent"
                  stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/>
        </svg>
        <div class="dist-pill">{{ run.distanceKm }}km</div>
        <div class="club-badge">{{ (run.clubName || '?')[0].toUpperCase() }}</div>
      </div>

      <div class="body">
        <div class="title">{{ run.title }}</div>
        @if (run.club_name) {
          <div class="club-chip">{{ run.club_name }}</div>
        }
        <div class="meta-row">
          <span class="meta-text">{{ svc.formatDate(run.date) }} · {{ svc.formatTime(run.date) }}</span>
          @if (run.pace) { <span class="pace-chip">{{ run.pace }}</span> }
        </div>
        <div class="footer">
          <div class="going">
            <div class="going-dot"></div>
            {{ run.attendees.length }} going
          </div>
          <button class="join-btn" [class.joined]="isJoined" (click)="onJoin($event)">
            {{ isJoined ? '✓ Going' : "I\'m coming" }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      background: #fff;
      border-radius: 18px;
      overflow: hidden;
      cursor: pointer;
      box-shadow: 0 1px 6px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06);
      transition: transform 0.15s ease;
    }
    .card:active { transform: scale(0.985); }

    .banner { height: 130px; position: relative; overflow: hidden; }

    .route-svg {
      position: absolute;
      bottom: 28px;
      left: 0; right: 0;
      width: 100%; height: 70px;
    }

    .dist-pill {
      position: absolute;
      top: 12px; right: 12px;
      background: rgba(0,0,0,0.28);
      backdrop-filter: blur(6px);
      color: #fff;
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .club-badge {
      position: absolute;
      bottom: -16px; left: 16px;
      width: 40px; height: 40px;
      border-radius: 12px;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; color: #0D0D0D;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }

    .body { padding: 24px 16px 16px; }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #0D0D0D;
      margin-bottom: 6px;
      line-height: 1.3;
    }

    .club-chip {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      background: #E1F5EE;
      color: #0F6E56;
      border-radius: 999px;
      padding: 4px 10px;
      margin-bottom: 8px;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }

    .meta-text { font-size: 13px; color: #6B6B68; }

    .pace-chip {
      font-size: 11px;
      font-weight: 500;
      background: #F7F7F5;
      color: #6B6B68;
      border-radius: 999px;
      padding: 2px 8px;
      text-transform: capitalize;
    }

    .footer { display: flex; justify-content: space-between; align-items: center; }

    .going {
      font-size: 13px;
      color: #6B6B68;
      display: flex; align-items: center; gap: 5px;
    }

    .going-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #1D9E75;
    }

    .join-btn {
      background: #0D0D0D;
      color: #fff;
      border: none;
      border-radius: 999px;
      padding: 9px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.15s;
    }
    .join-btn:active { opacity: 0.8; }
    .join-btn.joined { background: #E1F5EE; color: #0F6E56; }
  `]
})
export class RunCardComponent {
  @Input() run!: RunEvent;
  @Input() isJoined = false;
  @Output() cardClick = new EventEmitter<RunEvent>();
  @Output() joinToggle = new EventEmitter<string>();

  svc = inject(RunsService);

  get bannerGradient(): string {
    const gradients: Record<string, string> = {
      easy:     'linear-gradient(135deg, #1D9E75 0%, #0a5c42 100%)',
      social:   'linear-gradient(135deg, #10B981 0%, #065f46 100%)',
      moderate: 'linear-gradient(135deg, #3B82F6 0%, #1e3a8a 100%)',
      fast:     'linear-gradient(135deg, #EF4444 0%, #7f1d1d 100%)',
      tempo:    'linear-gradient(135deg, #F59E0B 0%, #78350f 100%)',
    };
    return gradients[this.run.pace ?? ''] ?? 'linear-gradient(135deg, #1D9E75 0%, #0D0D0D 100%)';
  }

  onJoin(e: Event) {
    e.stopPropagation();
    this.joinToggle.emit(this.run.id);
  }
}
