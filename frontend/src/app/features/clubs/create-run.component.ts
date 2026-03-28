import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { GeocodingService } from '../../core/services/geocoding.service';
import { ClubService } from '../../core/services/club.service';
import { ToastService } from '../../shared/services/toast.service';
import { Club } from '../../core/models/run-event.model';

@Component({
  selector: 'app-create-run',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back" (click)="router.navigate(['/organiser'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div class="top-title">Post a run</div>
        <div style="width:32px"></div>
      </div>

      <div class="form">
        @if (auth.isOrganizer() && myClubs.length > 0) {
          <div class="field">
            <label>Post as club</label>
            <p class="field-hint">The run will appear under the selected club's name</p>
            <select [(ngModel)]="selectedClubId">
              <option [ngValue]="null">Independent run (no club)</option>
              @for (club of myClubs; track club.id) {
                <option [ngValue]="club.id">{{ club.name }}</option>
              }
            </select>
          </div>
        }

        <div class="field">
          <label>Run title</label>
          <input [(ngModel)]="title" (blur)="touched.title = true" [class.invalid]="touched.title && !title" placeholder="e.g. Sunday morning 10k" />
          @if (touched.title && !title) { <span class="field-error">Required</span> }
        </div>

        <div class="field">
          <label>Start address</label>
          <input [(ngModel)]="startAddress" (blur)="touched.startAddress = true" [class.invalid]="touched.startAddress && !startAddress" placeholder="e.g. Victoria Park, London" />
          @if (touched.startAddress && !startAddress) { <span class="field-error">Required</span> }
        </div>

        <div class="field">
          <label>End address</label>
          <input [(ngModel)]="endAddress" (blur)="touched.endAddress = true" [class.invalid]="touched.endAddress && !endAddress" placeholder="e.g. Canary Wharf, London" />
          @if (touched.endAddress && !endAddress) { <span class="field-error">Required</span> }
        </div>

        <div class="field-row">
          <div class="field">
            <label>Date</label>
            <input type="date" [(ngModel)]="date" (blur)="touched.date = true" [class.invalid]="touched.date && !date" />
            @if (touched.date && !date) { <span class="field-error">Required</span> }
          </div>
          <div class="field">
            <label>Time</label>
            <input type="time" [(ngModel)]="time" (blur)="touched.time = true" [class.invalid]="touched.time && !time" />
            @if (touched.time && !time) { <span class="field-error">Required</span> }
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Distance (km)</label>
            <input type="number" [value]="distanceKm || ''" readonly class="readonly" placeholder="Auto-calculated" />
          </div>
          <div class="field">
            <label>Est. time</label>
            <input type="text" [value]="estimatedTimeLabel" readonly class="readonly" placeholder="Auto-calculated" />
          </div>
        </div>

        <div class="field">
          <label>Max attendees</label>
          <input type="number" [(ngModel)]="maxAttendees" placeholder="Optional" />
        </div>

        <div class="field">
          <label>Run type <span class="optional">(optional)</span></label>
          <div class="type-pills">
            @for (t of runTypes; track t.value) {
              <button type="button" class="type-pill"
                [class.active]="runType === t.value"
                (click)="runType = runType === t.value ? null : t.value">
                {{ t.emoji }} {{ t.label }}
              </button>
            }
          </div>
        </div>

        <div class="field">
          <label>Pace <span class="optional">(optional)</span></label>
          <div class="type-pills">
            @for (p of paceOptions; track p.value) {
              <button type="button" class="type-pill"
                [class.active]="pace === p.value"
                [attr.aria-label]="p.label + ': ' + p.effort"
                (click)="pace = pace === p.value ? null : p.value">
                {{ p.label }} <span class="pill-effort">· {{ p.effort }}</span>
              </button>
            }
          </div>
          @if (paceHintLabel) {
            <p class="pace-hint">{{ paceHintLabel }}</p>
          }
        </div>

        <div class="field">
          <label>Tags <span class="optional">(optional)</span></label>
          <div class="type-pills">
            @for (t of tagOptions; track t) {
              <button type="button" class="type-pill"
                [class.active]="tags.includes(t)"
                (click)="toggleTag(t)">
                {{ t }}
              </button>
            }
          </div>
        </div>

        <div class="field">
          <label>Notes</label>
          <textarea [(ngModel)]="notes" rows="3" placeholder="Pace, meeting point..."></textarea>
        </div>

        @if (error) {
          <div class="error">{{ error }}</div>
        }

        @if (loading) {
          <div class="info">Finding addresses...</div>
        }

        <button class="submit" [disabled]="loading" (click)="submit()">
          {{ loading ? 'Posting...' : 'Post run' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100%; background: #F7F7F5; overflow-x: hidden; }
    .top-bar { background: #0D0D0D; padding: 16px 16px 14px; display: flex; align-items: center; justify-content: space-between; }
    .back { background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; padding: 4px; flex-shrink: 0; }
    .top-title { font-size: 16px; font-weight: 500; color: #fff; flex: 1; text-align: center; }
    .form { padding: 20px 16px 40px; display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    label { font-size: 13px; font-weight: 500; color: #3D3D3B; }
    .field-hint { font-size: 12px; color: #9B9B98; margin: -2px 0 4px 0; font-style: italic; }
    input, textarea, select {
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 10px;
      padding: 12px;
      font-size: 16px;
      font-family: inherit;
      color: #0D0D0D;
      outline: none;
      background: #fff;
      width: 100%;
      box-sizing: border-box;
      -webkit-appearance: none;
      appearance: none;
    }
    input:focus, textarea:focus, select:focus { border-color: #1D9E75; }
    input.invalid, textarea.invalid { border-color: #A32D2D; }
    input.readonly { background: #F7F7F5; color: #6B6B68; cursor: default; }
    textarea { resize: vertical; }
    .field-error { font-size: 12px; color: #A32D2D; margin-top: -2px; }
    .error { background: #FCEBEB; color: #A32D2D; border-radius: 10px; padding: 12px; font-size: 14px; }
    .info { background: #E1F5EE; color: #0F6E56; border-radius: 10px; padding: 12px; font-size: 14px; }
    .optional { font-weight: 400; color: #9B9B98; }
    .type-pills { display: flex; flex-wrap: wrap; gap: 8px; }
    .type-pill {
      background: #fff; border: 1.5px solid rgba(0,0,0,0.12);
      border-radius: 999px; padding: 7px 14px;
      font-size: 13px; font-weight: 500; font-family: inherit;
      color: #3D3D3B; cursor: pointer;
      transition: background 0.12s, border-color 0.12s, color 0.12s;
    }
    .type-pill.active { background: #1D9E75; border-color: #1D9E75; color: #fff; }
    .pill-effort { font-size: 11px; opacity: 0.7; }
    .submit { background: #1D9E75; color: #E1F5EE; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; width: 100%; }
    .submit:disabled { opacity: 0.6; }
    .pace-hint { font-size: 12px; color: #6B6B68; margin-top: -2px; font-style: italic; }
  `]
})
export class CreateRunComponent implements OnInit {
  runsService = inject(RunsService);
  auth = inject(AuthService);
  router = inject(Router);
  geo = inject(GeocodingService);
  clubService = inject(ClubService);
  toast = inject(ToastService);

  title = '';
  startAddress = '';
  endAddress = '';
  date = '';
  time = '';
  distanceKm = 0;
  estimatedMinutes = 0;
  maxAttendees?: number;
  notes = '';
  runType: string | null = null;
  pace: string | null = null;
  tags: string[] = [];
  error = '';
  loading = false;

  readonly paceOptions = [
    { value: 'social',   label: 'Social',   effort: 'chatty pace' },
    { value: 'easy',     label: 'Easy',     effort: 'relaxed pace' },
    { value: 'moderate', label: 'Moderate', effort: 'steady effort' },
    { value: 'fast',     label: 'Fast',     effort: 'push pace' },
    { value: 'tempo',    label: 'Tempo',    effort: 'race effort' },
  ];

  readonly paceMinPerKmLookup: Record<string, number> = {
    social: 7, easy: 6.5, moderate: 6, fast: 5, tempo: 4.5
  };

  readonly tagOptions = [
    'beginner-friendly', 'social', 'scenic', 'trail', 'hills',
    'flat', 'evening', 'morning', 'dog-friendly', 'timed',
    'point-to-point', 'muddy', 'pub-after', 'medal', 'structured',
  ];

  toggleTag(tag: string) {
    this.tags = this.tags.includes(tag)
      ? this.tags.filter(t => t !== tag)
      : [...this.tags, tag];
  }

  readonly runTypes = [
    { value: 'club_run',       label: 'Club Run',   emoji: '🏃' },
    { value: 'parkrun_style',  label: 'Parkrun',    emoji: '🅿️' },
    { value: 'one_off_race',   label: 'Race',       emoji: '🏅' },
    { value: 'training_group', label: 'Training',   emoji: '💪' },
    { value: 'trail_run',      label: 'Trail',      emoji: '🌲' },
  ];

  get estimatedTimeLabel(): string {
    if (!this.estimatedMinutes) return '';
    const h = Math.floor(this.estimatedMinutes / 60);
    const m = this.estimatedMinutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  get paceMinPerKm(): number {
    return this.pace ? (this.paceMinPerKmLookup[this.pace] ?? 6) : 6;
  }

  get paceHintLabel(): string {
    if (!this.pace) return '';
    const option = this.paceOptions.find(p => p.value === this.pace);
    const label = option?.label ?? this.pace;
    const minPerKm = this.paceMinPerKm;
    if (this.distanceKm <= 0) return `${label} pace · ~${minPerKm} min/km`;
    const estMins = Math.round(this.distanceKm * minPerKm);
    const h = Math.floor(estMins / 60);
    const m = estMins % 60;
    const estLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
    return `${label} pace · ~${minPerKm} min/km · Est. ${estLabel}`;
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  touched = { title: false, startAddress: false, endAddress: false, date: false, time: false };

  myClubs: Club[] = [];
  selectedClubId: string | null = null;

  ngOnInit() {
    if (this.auth.isOrganizer()) {
      this.clubService.getMyClubs().subscribe({
        next: (clubs) => {
          this.myClubs = clubs;
        },
        error: () => {
          this.myClubs = [];
        }
      });
    }
  }

  async submit() {
    if (!this.title || !this.startAddress || !this.endAddress || !this.date || !this.time) {
      this.touched = { title: true, startAddress: true, endAddress: true, date: true, time: true };
      this.error = 'Please fill in all required fields.';
      return;
    }

    this.loading = true;
    this.error = '';

    const [sl, el] = await Promise.all([
      this.geo.geocode(this.startAddress),
      this.geo.geocode(this.endAddress)
    ]);

    if (!sl) {
      this.error = 'Could not find start address.';
      this.loading = false;
      return;
    }

    if (!el) {
      this.error = 'Could not find end address.';
      this.loading = false;
      return;
    }

    const rawKm = this.haversineKm(sl.lat, sl.lng, el.lat, el.lng);
    this.distanceKm = Math.round(rawKm * 10) / 10;
    this.estimatedMinutes = Math.round(this.distanceKm * this.paceMinPerKm);

    this.runsService.createRun({
      clubId: this.selectedClubId,
      clubName: '',
      title: this.title,
      startAddress: this.startAddress,
      endAddress: this.endAddress,
      startLocation: sl,
      endLocation: el,
      date: new Date(`${this.date}T${this.time}:00`).toISOString() as any,
      distanceKm: this.distanceKm,
      estimatedMinutes: this.estimatedMinutes,
      maxAttendees: this.maxAttendees,
      notes: this.notes,
      pace: this.pace ?? undefined,
      tags: this.tags.length ? this.tags : undefined,
      runType: this.runType ?? undefined
    }).subscribe({
      next: () => { this.toast.show('Run posted!'); this.router.navigate(['/profile']); },
      error: () => {
        this.error = 'Failed to post run.';
        this.loading = false;
      }
    });
  }
}