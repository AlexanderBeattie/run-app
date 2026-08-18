import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RunsService } from '../../../core/services/runs.service';
import { AuthService } from '../../../core/services/auth.service';
import { GeocodingService } from '../../../core/services/geocoding.service';
import { ClubService } from '../../../core/services/club.service';
import { ToastService } from '../../../shared/services/toast.service';
import { WizardService } from './wizard.service';
import { PaceCategory } from '../../../core/models/run-event.model';
import { StepLogisticsComponent } from './step-logistics.component';
import { StepScheduleComponent } from './step-schedule.component';
import { StepVibeComponent } from './step-vibe.component';
import { StepDetailsComponent } from './step-details.component';

const PACE_MIN_PER_KM: Record<string, number> = {
  social: 7, easy: 6.5, moderate: 6, fast: 5, tempo: 4.5,
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const STEP_LABELS = ['Logistics', 'Schedule', 'The Vibe', 'Details'];

@Component({
  selector: 'app-create-run-wizard',
  standalone: true,
  imports: [
    CommonModule,
    StepLogisticsComponent,
    StepScheduleComponent,
    StepVibeComponent,
    StepDetailsComponent,
  ],
  providers: [WizardService],
  template: `
    <div class="wizard-page">
      <!-- Progress bar -->
      <div class="progress-bar-track">
        <div class="progress-bar-fill" [style.width.%]="(wiz.currentStep() / 4) * 100"></div>
      </div>

      <!-- Step label -->
      <div class="step-indicator">
        <span class="step-num">Step {{ wiz.currentStep() }} of 4</span>
        <span class="step-name">{{ stepLabel() }}</span>
      </div>

      <!-- Step content -->
      <div class="step-content">
        @if (wiz.currentStep() === 1) {
          <app-step-logistics />
        }
        @if (wiz.currentStep() === 2) {
          <app-step-schedule />
        }
        @if (wiz.currentStep() === 3) {
          <app-step-vibe />
        }
        @if (wiz.currentStep() === 4) {
          <app-step-details />
        }
      </div>

      <!-- Error -->
      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      <!-- Navigation -->
      <div class="wizard-nav">
        <button
          class="btn-back"
          [disabled]="wiz.currentStep() === 1"
          (click)="wiz.prevStep()"
        >
          Back
        </button>

        @if (wiz.currentStep() < 4) {
          <button
            class="btn-next"
            [disabled]="!canAdvance()"
            (click)="advance()"
          >
            Next
          </button>
        } @else {
          <button
            class="btn-submit"
            [disabled]="loading()"
            (click)="submit()"
          >
            {{ loading() ? 'Posting...' : 'Post Run' }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .wizard-page {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      background: #0a0a1a;
      padding-bottom: 32px;
    }

    .progress-bar-track {
      height: 3px;
      background: #1a1a2e;
    }

    .progress-bar-fill {
      height: 100%;
      background: #1D9E75;
      transition: width 0.3s ease;
    }

    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px 6px;
    }

    .step-num {
      font-size: 12px;
      color: #5555aa;
      font-weight: 500;
    }

    .step-name {
      font-size: 13px;
      color: #1D9E75;
      font-weight: 600;
    }

    .step-content {
      flex: 1;
      padding: 16px 20px 24px;
      overflow-y: auto;
    }

    .error-banner {
      margin: 0 20px 12px;
      background: rgba(248, 113, 113, 0.12);
      border: 1px solid rgba(248, 113, 113, 0.3);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 13px;
      color: #f87171;
    }

    .wizard-nav {
      display: flex;
      gap: 12px;
      padding: 0 20px;
    }

    .btn-back {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid #2a2a4a;
      background: transparent;
      color: #8888aa;
      font-size: 15px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;
    }

    .btn-back:not(:disabled):hover {
      color: #ffffff;
      border-color: #4a4a7a;
    }

    .btn-back:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .btn-next, .btn-submit {
      flex: 2;
      padding: 14px;
      border-radius: 12px;
      border: none;
      background: #0F6E56;
      color: #ffffff;
      font-size: 15px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-next:disabled, .btn-submit:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `],
})
export class CreateRunWizardComponent implements OnInit {
  wiz = inject(WizardService);
  private runsService = inject(RunsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private geo = inject(GeocodingService);
  private clubService = inject(ClubService);
  private toast = inject(ToastService);

  loading = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.wiz.reset();
    if (this.auth.isOrganizer()) {
      this.clubService.getMyClubs().subscribe({
        next: (clubs) => this.wiz.myClubs.set(clubs),
        error: () => this.wiz.myClubs.set([]),
      });
    }
  }

  stepLabel(): string {
    return STEP_LABELS[this.wiz.currentStep() - 1];
  }

  canAdvance(): boolean {
    switch (this.wiz.currentStep()) {
      case 1: return this.wiz.isStep1Valid();
      case 2: return this.wiz.isStep2Valid();
      default: return true;
    }
  }

  advance(): void {
    if (this.wiz.currentStep() === 1) {
      this.wiz.touch('title');
      this.wiz.touch('startAddress');
      this.wiz.touch('endAddress');
    }
    if (this.wiz.currentStep() === 2) {
      this.wiz.touch('date');
      this.wiz.touch('time');
    }
    if (this.canAdvance()) {
      this.wiz.nextStep();
      this.error.set('');
    }
  }

  private safeParseDatetime(dateStr: string, timeStr: string): string {
    try {
      return new Date(`${dateStr}T${timeStr}:00`).toISOString();
    } catch {
      this.error.set('Invalid date/time format. Please try again.');
      this.loading.set(false);
      throw new Error('Date parsing failed');
    }
  }

  async submit(): Promise<void> {
    const d = this.wiz.formData();
    this.loading.set(true);
    this.error.set('');

    const [sl, el] = await Promise.all([
      this.geo.geocode(d.startAddress),
      this.geo.geocode(d.endAddress),
    ]);

    if (!sl) {
      this.error.set('Could not find start address.');
      this.loading.set(false);
      return;
    }
    if (!el) {
      this.error.set('Could not find end address.');
      this.loading.set(false);
      return;
    }

    const paceMinPerKm = d.pace ? (PACE_MIN_PER_KM[d.pace] ?? 6) : 6;
    const rawKm = haversineKm(sl.lat, sl.lng, el.lat, el.lng);
    const distanceKm = Math.round(rawKm * 10) / 10;
    const estimatedMinutes = Math.round(distanceKm * paceMinPerKm);

    this.runsService.createRun({
      clubId: d.clubId,
      clubName: '',
      title: d.title,
      startAddress: d.startAddress,
      endAddress: d.endAddress,
      startLocation: sl,
      endLocation: el,
      date: this.safeParseDatetime(d.date, d.time),
      distanceKm,
      estimatedMinutes,
      maxAttendees: d.maxAttendees,
      notes: d.notes,
      pace: (d.pace as PaceCategory) ?? undefined,
      tags: d.tags.length ? d.tags : undefined,
      runType: d.runType ?? undefined,
    }).subscribe({
      next: () => {
        this.toast.show('Run posted!');
        this.wiz.reset();
        this.router.navigate(['/profile']);
      },
      error: () => {
        this.error.set('Failed to post run. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
