import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { GeocodingService } from '../../core/services/geocoding.service';
import { ClubService } from '../../core/services/club.service';
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
            <label>Post under club</label>
            <select [(ngModel)]="selectedClubId">
              <option [ngValue]="null">Independent run</option>
              @for (club of myClubs; track club.id) {
                <option [ngValue]="club.id">{{ club.name }}</option>
              }
            </select>
          </div>
        }

        <div class="field">
          <label>Run title</label>
          <input [(ngModel)]="title" placeholder="e.g. Sunday morning 10k" />
        </div>

        <div class="field">
          <label>Start address</label>
          <input [(ngModel)]="startAddress" placeholder="e.g. Victoria Park, London" />
        </div>

        <div class="field">
          <label>End address</label>
          <input [(ngModel)]="endAddress" placeholder="e.g. Canary Wharf, London" />
        </div>

        <div class="field-row">
          <div class="field">
            <label>Date</label>
            <input type="date" [(ngModel)]="date" />
          </div>
          <div class="field">
            <label>Time</label>
            <input type="time" [(ngModel)]="time" />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Distance (km)</label>
            <input type="number" [(ngModel)]="distanceKm" placeholder="8" />
          </div>
          <div class="field">
            <label>Est. mins</label>
            <input type="number" [(ngModel)]="estimatedMinutes" placeholder="50" />
          </div>
        </div>

        <div class="field">
          <label>Max attendees</label>
          <input type="number" [(ngModel)]="maxAttendees" placeholder="Optional" />
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
    .page { min-height: 100%; background: #F7F7F5; }
    .top-bar { background: #0D0D0D; padding: 16px 16px 14px; display: flex; align-items: center; justify-content: space-between; }
    .back { background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; padding: 4px; }
    .top-title { font-size: 16px; font-weight: 500; color: #fff; }
    .form { padding: 20px 16px 40px; display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    label { font-size: 13px; font-weight: 500; color: #3D3D3B; }
    input, textarea, select {
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 10px;
      padding: 12px;
      font-size: 16px;
      font-family: inherit;
      color: #0D0D0D;
      outline: none;
      background: #fff;
    }
    input:focus, textarea:focus, select:focus { border-color: #1D9E75; }
    textarea { resize: vertical; }
    .error { background: #FCEBEB; color: #A32D2D; border-radius: 10px; padding: 12px; font-size: 14px; }
    .info { background: #E1F5EE; color: #0F6E56; border-radius: 10px; padding: 12px; font-size: 14px; }
    .submit { background: #1D9E75; color: #E1F5EE; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .submit:disabled { opacity: 0.6; }
  `]
})
export class CreateRunComponent implements OnInit {
  runsService = inject(RunsService);
  auth = inject(AuthService);
  router = inject(Router);
  geo = inject(GeocodingService);
  clubService = inject(ClubService);

  title = '';
  startAddress = '';
  endAddress = '';
  date = '';
  time = '';
  distanceKm = 0;
  estimatedMinutes = 0;
  maxAttendees?: number;
  notes = '';
  error = '';
  loading = false;

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
      notes: this.notes
    }).subscribe({
      next: () => this.router.navigate(['/organiser']),
      error: () => {
        this.error = 'Failed to post run.';
        this.loading = false;
      }
    });
  }
}