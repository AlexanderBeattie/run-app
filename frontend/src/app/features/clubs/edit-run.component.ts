import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RunsService } from '../../core/services/runs.service';
import { GeocodingService } from '../../core/services/geocoding.service';

@Component({
  selector: 'app-edit-run',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back" (click)="router.navigate(['/organiser'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div class="top-title">Edit run</div>
        <div style="width:32px"></div>
      </div>
      <div class="form">
        <div class="field">
          <label>Run title <span class="required">*</span></label>
          <input [(ngModel)]="title" (blur)="titleTouched = true" [class.invalid]="titleTouched && !title" placeholder="e.g. Saturday Morning 5K" />
          @if (titleTouched && !title) { <span class="field-error">Required</span> }
        </div>

        <div class="field">
          <label>Start address <span class="required">*</span></label>
          <input [(ngModel)]="startAddress" (blur)="startAddressTouched = true" [class.invalid]="startAddressTouched && !startAddress" placeholder="e.g. Glasgow Green" />
          @if (startAddressTouched && !startAddress) { <span class="field-error">Required</span> }
        </div>

        <div class="field">
          <label>End address <span class="required">*</span></label>
          <input [(ngModel)]="endAddress" (blur)="endAddressTouched = true" [class.invalid]="endAddressTouched && !endAddress" placeholder="e.g. Same as start" />
          @if (endAddressTouched && !endAddress) { <span class="field-error">Required</span> }
        </div>

        <div class="field-row">
          <div class="field">
            <label>Date <span class="required">*</span></label>
            <input type="date" [(ngModel)]="date" (blur)="dateTouched = true" [class.invalid]="dateTouched && !date" />
            @if (dateTouched && !date) { <span class="field-error">Required</span> }
          </div>
          <div class="field">
            <label>Time <span class="required">*</span></label>
            <input type="time" [(ngModel)]="time" (blur)="timeTouched = true" [class.invalid]="timeTouched && !time" />
            @if (timeTouched && !time) { <span class="field-error">Required</span> }
          </div>
        </div>

        <div class="field-row">
          <div class="field"><label>Distance (km)</label><input type="number" [(ngModel)]="distanceKm" /></div>
          <div class="field"><label>Est. mins</label><input type="number" [(ngModel)]="estimatedMinutes" /></div>
        </div>

        <div class="field"><label>Max attendees</label><input type="number" [(ngModel)]="maxAttendees" placeholder="Optional" /></div>

        <div class="field">
          <label>Pace</label>
          <div class="chip-options">
            @for (p of paceOptions; track p.value) {
              <button type="button" class="chip-btn" [class.active]="pace === p.value" (click)="pace = p.value">
                {{ p.emoji }} {{ p.label }}
              </button>
            }
          </div>
        </div>

        <div class="field">
          <label>Run type</label>
          <div class="chip-options">
            @for (rt of runTypeOptions; track rt.value) {
              <button type="button" class="chip-btn" [class.active]="runType === rt.value" (click)="runType = rt.value">
                {{ rt.emoji }} {{ rt.label }}
              </button>
            }
          </div>
        </div>

        <div class="field">
          <label>Tags</label>
          <div class="chip-options">
            @for (t of tagOptions; track t) {
              <button type="button" class="chip-btn" [class.active]="tags.includes(t)" (click)="toggleTag(t)">{{ t }}</button>
            }
          </div>
        </div>

        <div class="field"><label>Notes</label><textarea [(ngModel)]="notes" rows="3"></textarea></div>

        @if (error) { <div class="error">{{ error }}</div> }
        <button class="submit" [disabled]="loading" (click)="submit()">{{ loading ? 'Saving...' : 'Save changes' }}</button>
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
    .required { color: #1D9E75; }
    .field-error { font-size: 12px; color: #A32D2D; margin-top: -2px; }
    input, textarea { border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 12px; font-size: 16px; font-family: inherit; color: #0D0D0D; outline: none; background: #fff; width: 100%; box-sizing: border-box; }
    input:focus, textarea:focus { border-color: #1D9E75; }
    input.invalid { border-color: #A32D2D; }
    textarea { resize: vertical; }
    .chip-options { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip-btn { border: 1px solid rgba(0,0,0,0.12); background: #fff; border-radius: 999px; padding: 8px 12px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; color: #6B6B68; white-space: nowrap; }
    .chip-btn.active { background: #0F6E56; color: #fff; border-color: #0F6E56; }
    .error { background: #FCEBEB; color: #A32D2D; border-radius: 10px; padding: 12px; font-size: 14px; }
    .submit { background: #0F6E56; color: #fff; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; width: 100%; }
    .submit:disabled { opacity: 0.6; }
  `]
})
export class EditRunComponent implements OnInit {
  runsService = inject(RunsService);
  geo = inject(GeocodingService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  runId = ''; title = ''; startAddress = ''; endAddress = ''; date = ''; time = '';
  distanceKm = 0; estimatedMinutes = 0; maxAttendees?: number; notes = '';
  pace = ''; runType = ''; tags: string[] = [];
  error = ''; loading = false;

  titleTouched = false; startAddressTouched = false; endAddressTouched = false;
  dateTouched = false; timeTouched = false;

  readonly paceOptions = [
    { value: 'social', label: 'Social', emoji: '😊' },
    { value: 'easy', label: 'Easy', emoji: '🚶' },
    { value: 'moderate', label: 'Moderate', emoji: '🏃' },
    { value: 'fast', label: 'Fast', emoji: '⚡' },
    { value: 'tempo', label: 'Tempo', emoji: '🔥' },
  ];

  readonly runTypeOptions = [
    { value: 'club_run', label: 'Club Run', emoji: '🏅' },
    { value: 'parkrun_style', label: 'Parkrun Style', emoji: '🌳' },
    { value: 'one_off_race', label: 'Race', emoji: '🏆' },
    { value: 'training_group', label: 'Training', emoji: '💪' },
    { value: 'trail_run', label: 'Trail', emoji: '🌄' },
  ];

  readonly tagOptions = ['Road', 'Trail', 'Social', 'Intervals', 'Beginner', 'Long distance'];

  ngOnInit() {
    this.runId = this.route.snapshot.paramMap.get('id') ?? '';
    this.runsService.getRunById(this.runId).subscribe((r: any) => {
      this.title = r.title;
      this.startAddress = r.start_address;
      this.endAddress = r.end_address;
      const d = new Date(r.event_date);
      this.date = d.toISOString().split('T')[0];
      this.time = d.toTimeString().slice(0, 5);
      this.distanceKm = parseFloat(r.distance_km);
      this.estimatedMinutes = r.estimated_minutes;
      this.maxAttendees = r.max_attendees;
      this.notes = r.notes ?? '';
      this.pace = r.pace ?? '';
      this.runType = r.run_type ?? '';
      this.tags = r.tags ?? [];
    });
  }

  toggleTag(t: string): void {
    if (this.tags.includes(t)) this.tags = this.tags.filter(x => x !== t);
    else this.tags = [...this.tags, t];
  }

  async submit() {
    this.titleTouched = true; this.startAddressTouched = true; this.endAddressTouched = true;
    this.dateTouched = true; this.timeTouched = true;
    if (!this.title || !this.startAddress || !this.endAddress || !this.date || !this.time) {
      this.error = 'Please fill in all required fields.'; return;
    }
    this.loading = true; this.error = '';
    const [sl, el] = await Promise.all([this.geo.geocode(this.startAddress), this.geo.geocode(this.endAddress)]);
    if (!sl || !el) { this.error = 'Could not resolve addresses.'; this.loading = false; return; }
    this.runsService.updateRun(this.runId, {
      title: this.title, startAddress: this.startAddress, endAddress: this.endAddress,
      startLocation: sl, endLocation: el,
      date: new Date(`${this.date}T${this.time}:00`).toISOString() as any,
      distanceKm: this.distanceKm, estimatedMinutes: this.estimatedMinutes,
      maxAttendees: this.maxAttendees, notes: this.notes,
      pace: this.pace || undefined, runType: this.runType || undefined, tags: this.tags,
    }).subscribe({
      next: () => this.router.navigate(['/organiser']),
      error: () => { this.error = 'Failed to save.'; this.loading = false; }
    });
  }
}
