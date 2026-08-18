import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WizardService } from './wizard.service';

const AVAILABLE_TAGS = [
  'beginner-friendly', 'dogs-welcome', 'stroller-ok', 'coffee-after',
  'beer-after', 'hills', 'flat', 'night-run', 'morning', 'charity',
];

@Component({
  selector: 'app-step-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">Details</h2>
      <p class="step-sub">Add any finishing touches, all optional.</p>

      <div class="field-group">
        <label class="field-label">Max Attendees</label>
        <input
          type="number"
          class="field-input"
          placeholder="Leave blank for unlimited"
          min="1"
          [ngModel]="wiz.formData().maxAttendees"
          (ngModelChange)="wiz.patch({ maxAttendees: $event || undefined })"
        />
      </div>

      <div class="field-group">
        <label class="field-label">Tags</label>
        <div class="tags-grid">
          <button
            *ngFor="let tag of availableTags"
            class="tag-pill"
            [class.active]="isTagSelected(tag)"
            (click)="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <div class="field-group">
        <label class="field-label">Notes for Runners</label>
        <textarea
          class="field-input field-textarea"
          placeholder="Anything runners should know: kit, terrain, meeting point details..."
          rows="4"
          [ngModel]="wiz.formData().notes"
          (ngModelChange)="wiz.patch({ notes: $event })"
        ></textarea>
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

    .field-textarea {
      resize: vertical;
      font-family: inherit;
      line-height: 1.5;
    }

    .tags-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag-pill {
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid #2a2a4a;
      background: #1a1a2e;
      color: #8888aa;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tag-pill.active {
      border-color: #1D9E75;
      background: rgba(29, 158, 117, 0.15);
      color: #1D9E75;
    }
  `],
})
export class StepDetailsComponent {
  wiz = inject(WizardService);
  availableTags = AVAILABLE_TAGS;

  isTagSelected(tag: string): boolean {
    return this.wiz.formData().tags.includes(tag);
  }

  toggleTag(tag: string): void {
    const current = this.wiz.formData().tags;
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    this.wiz.patch({ tags: updated });
  }
}
