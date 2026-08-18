import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WizardService } from './wizard.service';

@Component({
  selector: 'app-step-logistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Logistics</h2>
      <p class="step-sub">The essentials: where and what.</p>

      <div class="field-group">
        <label class="field-label">Club <span class="required">*</span></label>
        <select
          class="field-input"
          [ngModel]="wiz.formData().clubId"
          (ngModelChange)="wiz.patch({ clubId: $event }); wiz.touch('clubId')"
        >
          <option [value]="null">Independent Run (no club)</option>
          <option *ngFor="let club of wiz.myClubs()" [value]="club.id">{{ club.name }}</option>
        </select>
      </div>

      <div class="field-group">
        <label class="field-label">Run Name <span class="required">*</span></label>
        <input
          type="text"
          [class.field-input--error]="isFieldInvalid('title')"
          class="field-input"
          placeholder="e.g. Saturday Morning 10K"
          [ngModel]="wiz.formData().title"
          (ngModelChange)="wiz.patch({ title: $event })"
          (blur)="wiz.touch('title')"
        />
        <span class="field-error" *ngIf="wiz.touched().title && !wiz.formData().title">
          Run name is required
        </span>
      </div>

      <div class="field-group">
        <label class="field-label">Start Address <span class="required">*</span></label>
        <input
          type="text"
          [class.field-input--error]="isFieldInvalid('startAddress')"
          class="field-input"
          placeholder="e.g. Central Park South Entrance"
          [ngModel]="wiz.formData().startAddress"
          (ngModelChange)="wiz.patch({ startAddress: $event })"
          (blur)="wiz.touch('startAddress')"
        />
        <span class="field-error" *ngIf="wiz.touched().startAddress && !wiz.formData().startAddress">
          Start address is required
        </span>
      </div>

      <div class="field-group">
        <label class="field-label">End Address <span class="required">*</span></label>
        <input
          type="text"
          [class.field-input--error]="isFieldInvalid('endAddress')"
          class="field-input"
          placeholder="e.g. Central Park Boathouse"
          [ngModel]="wiz.formData().endAddress"
          (ngModelChange)="wiz.patch({ endAddress: $event })"
          (blur)="wiz.touch('endAddress')"
        />
        <span class="field-error" *ngIf="wiz.touched().endAddress && !wiz.formData().endAddress">
          End address is required
        </span>
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
    }

    .field-input:focus {
      border-color: #1D9E75;
    }

    .field-input option {
      background: #1a1a2e;
    }

    .field-error {
      font-size: 12px;
      color: #f87171;
    }

    .field-input--error {
      border-color: #f87171;
    }
  `],
})
export class StepLogisticsComponent {
  wiz = inject(WizardService);

  isFieldInvalid(field: 'title' | 'startAddress' | 'endAddress'): boolean {
    return !!(this.wiz.touched()[field] && !this.wiz.formData()[field]);
  }
}
