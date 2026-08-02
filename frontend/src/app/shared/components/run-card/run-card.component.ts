import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RunEvent } from '../../../core/models/run-event.model';
import { RunsService } from '../../../core/services/runs.service';

const FILLING_FAST_THRESHOLD = 0.8;
const NEW_CLUB_DAYS = 30;

const CLUB_DOT_COLORS = ['dot-teal', 'dot-blue', 'dot-purple', 'dot-orange', 'dot-rose'];

@Component({
  selector: 'app-run-card',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="card" role="button" tabindex="0" [attr.aria-label]="'View run: ' + run.title"
      (click)="cardClick.emit(run)"
      (keydown.enter)="cardClick.emit(run)"
      (keydown.space)="$event.preventDefault(); cardClick.emit(run)">
      <div [class]="'banner ' + bannerClass">
        <div class="badge-row">
          @if (isFillingFast) { <div class="badge badge-orange">🔥 Filling fast</div> }
          @if (isBeginnerFriendly) { <div class="badge badge-green">🌿 Beginner friendly</div> }
          @if (isNewClub) { <div class="badge badge-blue">✨ New club</div> }
        </div>
        <div class="club-dot {{clubDotClass}}">{{ clubInitial }}</div>
      </div>

      <div class="body">
        <div class="body-cols">
          <div class="body-left">
            <div class="title">{{ run.title }}</div>
            <div class="chip-row">
              @if (run.clubName) {
                <div class="club-chip">{{ run.clubName }}</div>
              }
              @if (runTypeLabel) {
                <div class="run-type-chip {{runTypeClass}}">{{ runTypeLabel.emoji }} {{ runTypeLabel.label }}</div>
              }
              @for (tag of (run.tags ?? []); track tag) {
                <button class="tag-chip" [class.tag-active]="activeTag === tag"
                  (click)="onTagClick($event, tag)" [attr.aria-label]="'Filter by tag: ' + tag">{{ tag }}</button>
              }
            </div>
            @if (validDate) {
              <div class="meta-text">{{ validDate | date:'EEEE, d MMM' }} · {{ svc.formatTime(validDate) }}</div>
            }
            @if (run.pace) { <span class="pace-chip">{{ run.pace }}</span> }
          </div>
          <div class="body-right">
            @if (hasDistance) {
              <div class="dist-pill">{{ run.distanceKm }}km</div>
            }
            @if (run.attendees.length > 0) {
              <span class="live-badge"><span class="live-dot"></span>{{ run.attendees.length }} going</span>
            } @else {
              <span class="going-label no-going">Be first</span>
            }
          </div>
        </div>

        @if (run.maxAttendees) {
          <div class="capacity-bar">
            <div class="capacity-fill" [style.width.%]="capacityPct"></div>
          </div>
          <div class="spots-text">{{ run.attendees.length }} / {{ run.maxAttendees }} spots filled</div>
        }

        <div class="footer">
          <div class="facepile">
            @for (a of facepileAttendees; track a.id) {
              <div class="fp-circle" [title]="a.display_name">{{ (a.display_name || '?').charAt(0).toUpperCase() }}</div>
            }
            @if (extraCount > 0) {
              <div class="fp-circle fp-extra">+{{ extraCount }}</div>
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
      border-radius: var(--radius-card, 16px);
      overflow: hidden;
      cursor: pointer;
      box-shadow: var(--shadow-card, 0 1px 6px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06));
      transition: transform 0.2s var(--ease-out, ease), box-shadow 0.2s var(--ease-out, ease);
    }
    .card:active { transform: scale(0.985); }
    @media (hover: hover) {
      .card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover, 0 10px 28px rgba(13,13,12,0.10)); }
    }

    /* ── Banner ──────────────────────────────────────────────── */
    .banner { height: 60px; position: relative; overflow: visible; }

    .banner-easy     { background: linear-gradient(135deg, #1D9E75 0%, #0a5c42 100%); }
    .banner-social   { background: linear-gradient(135deg, #10B981 0%, #065f46 100%); }
    .banner-moderate { background: linear-gradient(135deg, #3B82F6 0%, #1e3a8a 100%); }
    .banner-fast     { background: linear-gradient(135deg, #EF4444 0%, #7f1d1d 100%); }
    .banner-tempo    { background: linear-gradient(135deg, #F59E0B 0%, #78350f 100%); }
    .banner-default  { background: linear-gradient(135deg, #1D9E75 0%, #0D0D0D 100%); }

    .badge-row {
      position: absolute;
      top: 8px; left: 8px;
      display: flex; gap: 5px;
      flex-wrap: wrap;
      max-width: calc(100% - 16px);
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

    /* ── Club dot (overlaps banner bottom-left) ──────────────── */
    .club-dot {
      position: absolute;
      bottom: -20px; left: 14px;
      width: 40px; height: 40px; border-radius: 50%;
      border: 2.5px solid #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 700;
      z-index: 2;
    }
    .dot-teal   { background: #CCFBF1; color: #0f766e; }
    .dot-blue   { background: #DBEAFE; color: #1e40af; }
    .dot-purple { background: #EDE9FE; color: #5b21b6; }
    .dot-orange { background: #FEF3C7; color: #92400e; }
    .dot-rose   { background: #FCE7F3; color: #9d174d; }

    /* ── Body ────────────────────────────────────────────────── */
    .body { padding: 28px 16px 16px; }

    .body-cols { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
    .body-left { flex: 1; min-width: 0; }
    .body-right { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }

    .title {
      font-size: 16px; font-weight: 600; color: #0D0D0D;
      letter-spacing: -0.01em;
      margin-bottom: 6px; line-height: 1.3;
    }

    .chip-row { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; }

    .club-chip {
      display: inline-block;
      font-size: 11px; font-weight: 600;
      background: #E1F5EE; color: #0F6E56;
      border-radius: 999px; padding: 3px 9px;
    }
    .run-type-chip {
      display: inline-block;
      font-size: 11px; font-weight: 600;
      background: #F0F0EE; color: #3A3A38;
      border-radius: 999px; padding: 3px 9px;
    }
    .chip-trail    { background: #DCFCE7; color: #166534; }
    .chip-club     { background: #DBEAFE; color: #1e40af; }
    .chip-parkrun  { background: #FEF9C3; color: #854d0e; }
    .chip-race     { background: #FCE7F3; color: #9d174d; }
    .chip-training { background: #EDE9FE; color: #5b21b6; }

    .tag-chip {
      font-size: 11px; font-weight: 500;
      background: #E1F5EE; color: #0F6E56;
      border-radius: 999px; padding: 4px 10px;
      min-height: 24px; display: inline-flex; align-items: center;
      text-transform: capitalize;
      border: none; cursor: pointer; font-family: inherit;
      transition: background 0.12s, color 0.12s;
    }
    .tag-chip:hover { background: #b9ead9; }
    .tag-chip.tag-active { background: #0F6E56; color: #fff; }

    .spots-text {
      font-size: 11px; color: #6B6B68;
      margin-bottom: 10px; margin-top: -8px;
    }

    .meta-text { font-size: 12px; color: #6B6B68; margin-bottom: 4px; }

    .pace-chip {
      display: inline-block;
      font-size: 11px; font-weight: 500;
      background: #F7F7F5; color: #6B6B68;
      border-radius: 999px; padding: 2px 8px;
      text-transform: capitalize;
    }

    /* ── Distance pill (minimal, body) ──────────────────────── */
    .dist-pill {
      background: #F7F7F5; color: #0D0D0D;
      border-radius: 999px; padding: 5px 12px;
      font-size: 13px; font-weight: 600;
      letter-spacing: 0.02em; white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    /* ── Going / live badge ──────────────────────────────────── */
    .live-badge {
      display: inline-flex; align-items: center; gap: 5px;
      background: #E1F5EE; color: #0F6E56;
      border-radius: 999px; padding: 3px 9px;
      font-size: 12px; font-weight: 600; white-space: nowrap;
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
    .going-label { font-size: 12px; white-space: nowrap; }
    .no-going { color: #6B6B68; }

    /* ── Footer ──────────────────────────────────────────────── */
    .footer { display: flex; justify-content: space-between; align-items: center; }

    .facepile { display: flex; align-items: center; gap: 2px; }
    .fp-circle {
      width: 26px; height: 26px; border-radius: 50%;
      background: #E1F5EE; color: #0F6E56;
      font-size: 10px; font-weight: 600;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff; margin-left: -6px;
    }
    .facepile .fp-circle:first-child { margin-left: 0; }
    .fp-extra { background: #F7F7F5; color: #6B6B68; font-size: 9px; }

    .join-btn {
      background: #0D0D0D; color: #fff;
      border: none; border-radius: 999px;
      padding: 9px 18px; min-height: 44px;
      font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: opacity 0.15s, transform 0.15s var(--ease-out, ease-out);
    }
    .join-btn:active { opacity: 0.85; transform: scale(0.96); }
    .join-btn.joined { background: #E1F5EE; color: #0F6E56; }

    .capacity-bar { height: 3px; background: rgba(0,0,0,0.06); border-radius: 999px; margin-bottom: 12px; overflow: hidden; }
    .capacity-fill { height: 100%; background: #1D9E75; border-radius: 999px; transition: width 0.3s ease; }
  `]
})
export class RunCardComponent {
  @Input() run!: RunEvent;
  @Input() isJoined = false;
  @Input() activeTag: string | null = null;
  @Output() cardClick = new EventEmitter<RunEvent>();
  @Output() joinToggle = new EventEmitter<string>();
  @Output() tagClick = new EventEmitter<string>();

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

  get runTypeClass(): string {
    const map: Record<string, string> = {
      trail_run:      'chip-trail',
      club_run:       'chip-club',
      parkrun_style:  'chip-parkrun',
      one_off_race:   'chip-race',
      training_group: 'chip-training',
    };
    return this.run.runType ? (map[this.run.runType] ?? '') : '';
  }

  get clubInitial(): string {
    return (this.run.clubName || '?')[0].toUpperCase();
  }

  get clubDotClass(): string {
    const idx = (this.run.clubName?.charCodeAt(0) ?? 0) % CLUB_DOT_COLORS.length;
    return CLUB_DOT_COLORS[idx];
  }

  get isNewClub(): boolean {
    if (!this.run.club_created_at) return false;
    return (Date.now() - new Date(this.run.club_created_at).getTime()) / 86400000 <= NEW_CLUB_DAYS;
  }

  get bannerClass(): string {
    const map: Record<string, string> = {
      easy:     'banner-easy',
      social:   'banner-social',
      moderate: 'banner-moderate',
      fast:     'banner-fast',
      tempo:    'banner-tempo',
    };
    return map[this.run.pace ?? ''] ?? 'banner-default';
  }

  onJoin(e: Event): void {
    e.stopPropagation();
    this.joinToggle.emit(this.run.id);
  }

  onTagClick(e: Event, tag: string): void {
    e.stopPropagation();
    this.tagClick.emit(tag);
  }
}
