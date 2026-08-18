import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WizardService } from './wizard.service';

@Component({
  selector: 'app-step-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Schedule</h2>
      <p class="step-sub">When does the run kick off?</p>

      <div class="field-group">
        <label class="field-label">Date <span class="required">*</span></label>
        <input
          type="date"
          [class.field-input--error]="isFieldInvalid('date') || isDateInPast()"
          class="field-input"
          [ngModel]="wiz.formData().date"
          (ngModelChange)="wiz.patch({ date: $event })"
          (blur)="wiz.touch('date')"
        />
        <span class="field-error" *ngIf="wiz.touched().date && !wiz.formData().date">
          Date is required
        </span>
        <span class="field-error" *ngIf="wiz.formData().date && isDateInPast()">
          Date must be in the future
        </span>
      </div>

      <div class="field-group">
        <label class="field-label">Start Time <span class="required">*</span></label>
        <input
          type="time"
          [class.field-input--error]="isFieldInvalid('time')"
          class="field-input"
          [ngModel]="wiz.formData().time"
          (ngModelChange)="wiz.patch({ time: $event })"
          (blur)="wiz.touch('time')"
        />
        <span class="field-error" *ngIf="wiz.touched().time && !wiz.formData().time">
          Start time is required
        </span>
      </div>

      <div class="hint-box">
        <span class="hint-icon">📅</span>
        <span>Runners will see this in their local timezone.</span>
      </div>
    </div>
  `,
  styles: [`
    .step-container {
      padding: 8px 0;
    }

    .step-title {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 4px;
    }

    .step-sub {
      font-size: 14px;
      color: #8888aa;
      margin: 0 0 24px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 20px;
    }

    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: #ccccdd;
    }

    .required {
      color: #1D9E75;
    }

    .field-input {
      background: #1a1a2e;
      border: 1px solid #2a2a4a;
      border-radius: 10px;
      padding: 12px 14px;
      color: #ffffff;
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s;
      color-scheme: dark;
    }

    .field-input:focus {
      border-color: #1D9E75;
    }

    .field-error {
      font-size: 12px;
      color: #f87171;
    }

    .field-input--error {
      border-color: #f87171;
    }

    .hint-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #1a1a2e;
      border: 1px solid #2a2a4a;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 13px;
      color: #8888aa;
      margin-top: 8px;
    }

    .hint-icon {
      font-size: 16px;
    }
  `],
})
export class StepScheduleComponent {
  wiz = inject(WizardService);

  isFieldInvalid(field: 'date' | 'time'): boolean {
    return !!(this.wiz.touched()[field] && !this.wiz.formData()[field]);
  }

  isDateInPast(): boolean {
    return this.wiz.isDateInPast(this.wiz.formData().date);
  }
}
