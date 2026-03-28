import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RunEvent } from '../../../core/models/run-event.model';
import { RunsService } from '../../../core/services/runs.service';

const FILLING_FAST_THRESHOLD = 0.8;
const NEW_CLUB_DAYS = 30;

@Component({
  selector: 'app-run-card',
  standalone: true,
  template: `
    <div class="card" role="button" [attr.aria-label]="'View run: ' + run.title" (click)="cardClick.emit(run)">
      <div class="banner" [style.background]="bannerGradient">
        <svg class="route-svg" viewBox="0 0 280 80" preserveAspectRatio="none">
          <path [attr.d]="routeGeometry.path"
                stroke="rgba(255,255,255,0.35)" stroke-width="2.5"
                fill="none" stroke-dasharray="5 4" stroke-linecap="round"/>
          <circle cx="28" [attr.cy]="routeGeometry.startY" r="5" fill="rgba(255,255,255,0.95)"/>
          <circle cx="252" [attr.cy]="routeGeometry.endY" r="5" fill="transparent"
                  stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/>
        </svg>
        @if (hasDistance) {
          <div class="dist-pill">{{ run.distanceKm }}km<span class="dist-miles"> / {{ distanceMiles }}mi</span></div>
        }
        <div class="badge-row">
          @if (isFillingFast) { <div class="badge badge-orange">🔥 Filling fast</div> }
          @if (isBeginnerFriendly) { <div class="badge badge-green">🌿 Beginner friendly</div> }
          @if (isNewClub) { <div class="badge badge-blue">✨ New club</div> }
        </div>
        <div class="club-badge">{{ (run.clubName || '?')[0].toUpperCase() }}</div>
      </div>

      <div class="body">
        <div class="title">{{ run.title }}</div>
        <div class="chip-row">
          @if (run.clubName) {
            <div class="club-chip">{{ run.clubName }}</div>
          }
          @if (runTypeLabel) {
            <div class="run-type-chip">{{ runTypeLabel.emoji }} {{ runTypeLabel.label }}</div>
          }
        </div>
        <div class="meta-row">
          @if (validDate) {
            <span class="meta-text">{{ svc.formatDate(validDate) }} · {{ svc.formatTime(validDate) }}</span>
          }
          @if (run.pace) { <span class="pace-chip">{{ run.pace }}</span> }
          @for (tag of (run.tags ?? []); track tag) {
            <span class="tag-chip">{{ tag }}</span>
          }
        </div>
        @if (run.maxAttendees) {
          <div class="capacity-bar">
            <div class="capacity-fill" [style.width.%]="capacityPct"></div>
          </div>
        }
        <div class="footer">
          <div class="facepile">
            @for (a of facepileAttendees; track a.id) {
              <div class="fp-circle" [title]="a.display_name">{{ a.display_name?.[0]?.toUpperCase() || '?' }}</div>
            }
            @if (extraCount > 0) {
              <div class="fp-circle fp-extra">+{{ extraCount }}</div>
            }
            @if (run.attendees.length > 0) {
              <span class="live-badge"><span class="live-dot"></span>{{ run.attendees.length }} going</span>
            } @else {
              <span class="going-label no-going">Be the first</span>
            }
          </div>
          <button class="join-btn" [class.joined]="isJoined" (click)="onJoin($event)"
            [attr.aria-label]="isJoined ? 'Leave run: ' + run.title : 'Join run: ' + run.title">
            {{ isJoined ? '✓ Going' : "I'm coming" }}
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
      bottom: 28px; left: 0; right: 0;
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
      font-size: 13px; font-weight: 600;
      letter-spacing: 0.02em;
    }
    .dist-miles { font-size: 11px; font-weight: 500; opacity: 0.8; }

    .badge-row {
      position: absolute;
      top: 12px; left: 12px;
      display: flex; gap: 5px;
      flex-wrap: wrap;
      max-width: calc(100% - 90px);
    }

    .badge {
      font-size: 11px; font-weight: 600;
      border-radius: 999px;
      padding: 3px 8px;
      backdrop-filter: blur(6px);
      white-space: nowrap;
    }
    .badge-orange { background: rgba(239,94,0,0.85); color: #fff; }
    .badge-green  { background: rgba(29,158,117,0.85); color: #fff; }
    .badge-blue   { background: rgba(59,130,246,0.85); color: #fff; }

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
      font-size: 16px; font-weight: 600; color: #0D0D0D;
      margin-bottom: 6px; line-height: 1.3;
    }

    .chip-row {
      display: flex; flex-wrap: wrap;
      gap: 6px; margin-bottom: 8px;
    }

    .club-chip {
      display: inline-block;
      font-size: 11px; font-weight: 600;
      background: #E1F5EE; color: #0F6E56;
      border-radius: 999px;
      padding: 4px 10px;
    }

    .run-type-chip {
      display: inline-block;
      font-size: 11px; font-weight: 600;
      background: #F0F0EE; color: #3A3A38;
      border-radius: 999px;
      padding: 4px 10px;
    }

    .meta-row {
      display: flex; align-items: center;
      gap: 8px; margin-bottom: 14px; flex-wrap: wrap;
    }

    .meta-text { font-size: 13px; color: #6B6B68; }

    .pace-chip {
      font-size: 11px; font-weight: 500;
      background: #F7F7F5; color: #6B6B68;
      border-radius: 999px; padding: 2px 8px;
      text-transform: capitalize;
    }

    .tag-chip {
      font-size: 11px; font-weight: 500;
      background: #E1F5EE; color: #0F6E56;
      border-radius: 999px; padding: 2px 8px;
      text-transform: capitalize;
    }

.footer { display: flex; justify-content: space-between; align-items: center; }

    .facepile { display: flex; align-items: center; gap: 2px; }

    .fp-circle {
      width: 26px; height: 26px;
      border-radius: 50%;
      background: #E1F5EE; color: #0F6E56;
      font-size: 10px; font-weight: 600;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff;
      margin-left: -6px;
    }
    .facepile .fp-circle:first-child { margin-left: 0; }
    .fp-extra { background: #F7F7F5; color: #6B6B68; font-size: 9px; }

    .live-badge {
      display: inline-flex; align-items: center; gap: 5px;
      margin-left: 6px;
      background: #E1F5EE; color: #0F6E56;
      border-radius: 999px; padding: 3px 9px;
      font-size: 12px; font-weight: 600;
      white-space: nowrap;
    }
    .live-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #1D9E75; flex-shrink: 0;
      animation: pulse-dot 1.8s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.75); }
    }
    .going-label {
      font-size: 12px; color: #6B6B68;
      margin-left: 6px; white-space: nowrap;
    }
    .no-going { color: #B0B0AE; }

    .join-btn {
      background: #0D0D0D; color: #fff;
      border: none; border-radius: 999px;
      padding: 9px 18px;
      font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: opacity 0.15s;
    }
    .join-btn:active { opacity: 0.8; }
    .join-btn.joined { background: #E1F5EE; color: #0F6E56; }

    .capacity-bar { height: 3px; background: rgba(0,0,0,0.06); border-radius: 999px; margin-bottom: 12px; overflow: hidden; }
    .capacity-fill { height: 100%; background: #1D9E75; border-radius: 999px; transition: width 0.3s ease; }
  `]
})
export class RunCardComponent {
  @Input() run!: RunEvent;
  @Input() isJoined = false;
  @Output() cardClick = new EventEmitter<RunEvent>();
  @Output() joinToggle = new EventEmitter<string>();

  svc = inject(RunsService);

  get facepileAttendees() { return this.run.attendees.slice(0, 3); }
  get extraCount() { return Math.max(0, this.run.attendees.length - 3); }
  get hasDistance(): boolean { return this.run.distanceKm != null && !isNaN(this.run.distanceKm) && this.run.distanceKm > 0; }
  get distanceMiles(): string {
    if (!this.hasDistance) return '0.0';
    return (this.run.distanceKm * 0.621371).toFixed(1);
  }
  get validDate(): Date | null {
    const d = new Date(this.run.date);
    return isNaN(d.getTime()) ? null : d;
  }

  get capacityPct(): number {
    if (!this.run.maxAttendees) return 0;
    return Math.min(100, Math.round((this.run.attendees.length / this.run.maxAttendees) * 100));
  }

  get isFillingFast(): boolean {
    if (!this.run.maxAttendees) return false;
    return this.run.attendees.length / this.run.maxAttendees >= FILLING_FAST_THRESHOLD;
  }

  get isBeginnerFriendly(): boolean {
    return this.run.pace === 'easy' || this.run.pace === 'social' ||
      (this.run.tags ?? []).some(t => ['beginner', 'beginner-friendly', 'shakeout'].includes(t.toLowerCase()));
  }

  get runTypeLabel(): { label: string; emoji: string } | null {
    const map: Record<string, { label: string; emoji: string }> = {
      club_run:       { label: 'Club Run',    emoji: '🏃' },
      parkrun_style:  { label: 'Parkrun',     emoji: '🅿️' },
      one_off_race:   { label: 'Race',        emoji: '🏅' },
      training_group: { label: 'Training',    emoji: '💪' },
      trail_run:      { label: 'Trail',       emoji: '🌲' },
    };
    return this.run.runType ? (map[this.run.runType] ?? null) : null;
  }

  get isNewClub(): boolean {
    if (!this.run.club_created_at) return false;
    return (Date.now() - new Date(this.run.club_created_at).getTime()) / 86400000 <= NEW_CLUB_DAYS;
  }

  get routeGeometry(): { path: string; startY: number; endY: number } {
    const start = this.run.startLocation;
    const end = this.run.endLocation;
    const km = this.run.distanceKm ?? 5;
    const BASE_Y = 50;

    // Map lat difference to Y offset: north end = higher on card (lower Y)
    // 0.09° lat ≈ 10km; scale so ±0.1° → ±28px
    const latDiff = (start && end) ? (end.lat - start.lat) : 0;
    const startY = BASE_Y;
    const endY = Math.max(8, Math.min(72, BASE_Y - latDiff * 280));

    // Arc height grows with distance, peaks sooner for shorter runs
    const amplitude = Math.max(10, Math.min(38, km * 2.2));
    const ctrlY = Math.max(4, Math.min(startY, endY) - amplitude);

    return {
      path: `M 28 ${startY} Q 140 ${ctrlY.toFixed(1)} 252 ${endY.toFixed(1)}`,
      startY,
      endY: parseFloat(endY.toFixed(1)),
    };
  }

  get bannerGradient(): string {
    const g: Record<string, string> = {
      easy:     'linear-gradient(135deg, #1D9E75 0%, #0a5c42 100%)',
      social:   'linear-gradient(135deg, #10B981 0%, #065f46 100%)',
      moderate: 'linear-gradient(135deg, #3B82F6 0%, #1e3a8a 100%)',
      fast:     'linear-gradient(135deg, #EF4444 0%, #7f1d1d 100%)',
      tempo:    'linear-gradient(135deg, #F59E0B 0%, #78350f 100%)',
    };
    return g[this.run.pace ?? ''] ?? 'linear-gradient(135deg, #1D9E75 0%, #0D0D0D 100%)';
  }

  onJoin(e: Event) {
    e.stopPropagation();
    this.joinToggle.emit(this.run.id);
  }
}
