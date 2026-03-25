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
        <div class="field"><label>Run title</label><input [(ngModel)]="title" /></div>
        <div class="field"><label>Start address</label><input [(ngModel)]="startAddress" /></div>
        <div class="field"><label>End address</label><input [(ngModel)]="endAddress" /></div>
        <div class="field-row">
          <div class="field"><label>Date</label><input type="date" [(ngModel)]="date" /></div>
          <div class="field"><label>Time</label><input type="time" [(ngModel)]="time" /></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Distance (km)</label><input type="number" [(ngModel)]="distanceKm" /></div>
          <div class="field"><label>Est. mins</label><input type="number" [(ngModel)]="estimatedMinutes" /></div>
        </div>
        <div class="field"><label>Max attendees</label><input type="number" [(ngModel)]="maxAttendees" placeholder="Optional" /></div>
        <div class="field"><label>Notes</label><textarea [(ngModel)]="notes" rows="3"></textarea></div>
        @if (error) { <div class="error">{{ error }}</div> }
        @if (loading) { <div class="info">Saving...</div> }
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
    input, textarea { border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 12px; font-size: 16px; font-family: inherit; color: #0D0D0D; outline: none; background: #fff; width: 100%; box-sizing: border-box; }
    input:focus, textarea:focus { border-color: #1D9E75; }
    textarea { resize: vertical; }
    .error { background: #FCEBEB; color: #A32D2D; border-radius: 10px; padding: 12px; font-size: 14px; }
    .info { background: #E1F5EE; color: #0F6E56; border-radius: 10px; padding: 12px; font-size: 14px; }
    .submit { background: #1D9E75; color: #E1F5EE; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; width: 100%; }
    .submit:disabled { opacity: 0.6; }
  `]
})
export class EditRunComponent implements OnInit {
  runsService = inject(RunsService);
  geo = inject(GeocodingService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  runId=''; title=''; startAddress=''; endAddress=''; date=''; time='';
  distanceKm=0; estimatedMinutes=0; maxAttendees?: number; notes='';
  error=''; loading=false;

  ngOnInit() {
    this.runId = this.route.snapshot.paramMap.get('id') ?? '';
    this.runsService.getRunById(this.runId).subscribe((r: any) => {
      this.title = r.title; this.startAddress = r.start_address; this.endAddress = r.end_address;
      const d = new Date(r.event_date);
      this.date = d.toISOString().split('T')[0];
      this.time = d.toTimeString().slice(0,5);
      this.distanceKm = parseFloat(r.distance_km); this.estimatedMinutes = r.estimated_minutes;
      this.maxAttendees = r.max_attendees; this.notes = r.notes ?? '';
    });
  }

  async submit() {
    if (!this.title || !this.startAddress || !this.endAddress || !this.date || !this.time) { this.error = 'Please fill in all fields.'; return; }
    this.loading = true; this.error = '';
    const [sl, el] = await Promise.all([this.geo.geocode(this.startAddress), this.geo.geocode(this.endAddress)]);
    if (!sl || !el) { this.error = 'Could not resolve addresses.'; this.loading = false; return; }
    this.runsService.updateRun(this.runId, {
      title: this.title, startAddress: this.startAddress, endAddress: this.endAddress,
      startLocation: sl, endLocation: el,
      date: new Date(`${this.date}T${this.time}:00`).toISOString() as any,
      distanceKm: this.distanceKm, estimatedMinutes: this.estimatedMinutes,
      maxAttendees: this.maxAttendees, notes: this.notes
    }).subscribe({
      next: () => this.router.navigate(['/organiser']),
      error: () => { this.error = 'Failed to save.'; this.loading = false; }
    });
  }
}