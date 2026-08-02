import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WizardService } from './wizard.service';

interface VibeOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
  desc: string;
}

@Component({
  selector: 'app-step-vibe',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-container">
      <h2 class="step-title">The Vibe</h2>
      <p class="step-sub">Set the energy. What kind of run is this?</p>

      <div class="section-label">Pace</div>
      <div class="vibe-grid">
        <button
          *ngFor="let opt of paceOptions"
          class="vibe-card"
          [class.selected]="wiz.formData().pace === opt.value"
          [style.--accent]="opt.color"
          (click)="wiz.patch({ pace: opt.value })"
        >
          <span class="vibe-emoji">{{ opt.emoji }}</span>
          <span class="vibe-label">{{ opt.label }}</span>
          <span class="vibe-desc">{{ opt.desc }}</span>
        </button>
      </div>

      <div class="section-label" style="margin-top: 24px;">Run Type</div>
      <div class="vibe-grid">
        <button
          *ngFor="let opt of runTypeOptions"
          class="vibe-card"
          [class.selected]="wiz.formData().runType === opt.value"
          [style.--accent]="opt.color"
          (click)="wiz.patch({ runType: opt.value })"
        >
          <span class="vibe-emoji">{{ opt.emoji }}</span>
          <span class="vibe-label">{{ opt.label }}</span>
          <span class="vibe-desc">{{ opt.desc }}</span>
        </button>
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

    .section-label {
      font-size: 13px;
      font-weight: 600;
      color: #ccccdd;
      margin-bottom: 10px;
    }

    .vibe-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .vibe-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 16px 10px;
      background: #1a1a2e;
      border: 2px solid #2a2a4a;
      border-radius: 14px;
      cursor: pointer;
      transition: border-color 0.2s, transform 0.15s, background 0.2s;
      text-align: center;
    }

    .vibe-card:active {
      transform: scale(0.97);
    }

    .vibe-card.selected {
      border-color: var(--accent, #1D9E75);
      background: color-mix(in srgb, var(--accent, #1D9E75) 12%, #1a1a2e);
    }

    .vibe-emoji {
      font-size: 26px;
      line-height: 1;
    }

    .vibe-label {
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
    }

    .vibe-desc {
      font-size: 11px;
      color: #8888aa;
    }
  `],
})
export class StepVibeComponent {
  wiz = inject(WizardService);

  paceOptions: VibeOption[] = [
    { value: 'easy', label: 'Easy', emoji: '🌿', color: '#0d9488', desc: 'Walk/jog friendly' },
    { value: 'social', label: 'Social', emoji: '💬', color: '#16a34a', desc: 'Chat the whole way' },
    { value: 'moderate', label: 'Moderate', emoji: '🎯', color: '#2563eb', desc: 'Steady effort' },
    { value: 'fast', label: 'Fast', emoji: '🔥', color: '#dc2626', desc: 'Push yourself' },
    { value: 'tempo', label: 'Tempo', emoji: '⚡', color: '#d97706', desc: 'Race-pace effort' },
  ];

  runTypeOptions: VibeOption[] = [
    { value: 'road', label: 'Road', emoji: '🏙️', color: '#6366f1', desc: 'Streets & pavements' },
    { value: 'trail', label: 'Trail', emoji: '🌲', color: '#16a34a', desc: 'Off-road adventure' },
    { value: 'track', label: 'Track', emoji: '🏟️', color: '#2563eb', desc: 'Oval track laps' },
    { value: 'race', label: 'Race', emoji: '🏆', color: '#d97706', desc: 'Competitive event' },
    { value: 'virtual', label: 'Virtual', emoji: '📱', color: '#8b5cf6', desc: 'Run anywhere' },
  ];
}
