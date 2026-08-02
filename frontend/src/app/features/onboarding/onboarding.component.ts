import { Component, Output, EventEmitter, signal } from '@angular/core';

export interface OnboardingPrefs {
  pace?: string;
  distance?: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  template: `
    <div class="overlay">
      <div class="sheet">

        <!-- Screen 1: Welcome -->
        @if (screen() === 1) {
          <div class="screen">
            <div class="logo">KLUB</div>
            <div class="headline">Discover running<br>clubs near you</div>
            <div class="sub">Find your pace, join a community,<br>and go further together.</div>
            <div class="art">
              <svg viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="120" cy="60" r="55" fill="#E1F5EE"/>
                <path d="M60 80 Q90 30 120 70 Q150 110 180 50" stroke="#1D9E75" stroke-width="3" fill="none" stroke-linecap="round"/>
                <circle cx="60" cy="80" r="6" fill="#1D9E75"/>
                <circle cx="180" cy="50" r="6" fill="#0D0D0D" stroke="#fff" stroke-width="2"/>
              </svg>
            </div>
            <button class="cta" (click)="screen.set(2)">Get started</button>
            <button class="skip" (click)="finish()">Skip for now</button>
          </div>
        }

        <!-- Screen 2: Pace preference -->
        @if (screen() === 2) {
          <div class="screen">
            <div class="step-dots">
              <span class="dot active"></span><span class="dot"></span>
            </div>
            <div class="headline small">What's your pace?</div>
            <div class="sub">We'll show you runs that match your style.</div>
            <div class="pills">
              @for (p of paceOptions; track p.value) {
                <button class="pill"
                  [class.selected]="selectedPace() === p.value"
                  (click)="selectedPace.set(selectedPace() === p.value ? null : p.value)">
                  <span class="pill-label">{{ p.label }}</span>
                  <span class="pill-effort">{{ p.effort }}</span>
                </button>
              }
            </div>
            <button class="cta" (click)="screen.set(3)">Next</button>
            <button class="skip" (click)="screen.set(3)">Skip</button>
          </div>
        }

        <!-- Screen 3: Distance preference -->
        @if (screen() === 3) {
          <div class="screen">
            <div class="step-dots">
              <span class="dot active"></span><span class="dot active"></span>
            </div>
            <div class="headline small">How far do you usually run?</div>
            <div class="sub">Helps us surface the right routes for you.</div>
            <div class="pills">
              @for (d of distanceOptions; track d.value) {
                <button class="pill"
                  [class.selected]="selectedDistance() === d.value"
                  (click)="selectedDistance.set(selectedDistance() === d.value ? null : d.value)">
                  <span class="pill-label">{{ d.label }}</span>
                  <span class="pill-effort">{{ d.range }}</span>
                </button>
              }
            </div>
            <button class="cta" (click)="finish()">Let's go!</button>
            <button class="skip" (click)="finish()">Skip</button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: flex-end; justify-content: center;
      z-index: 600;
    }
    .sheet {
      background: #fff;
      border-radius: var(--radius-sheet, 24px) var(--radius-sheet, 24px) 0 0;
      width: 100%; max-width: 560px;
      padding: 32px 24px 48px;
      animation: slideUp 0.35s cubic-bezier(0.32,0.72,0,1);
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }

    .screen {
      display: flex; flex-direction: column; align-items: center;
      text-align: center;
    }

    .logo {
      font-size: 13px; font-weight: 700; letter-spacing: 0.2em;
      color: #1D9E75; margin-bottom: 24px;
    }

    .art {
      width: 200px; height: 100px; margin: 20px 0 28px;
    }
    .art svg { width: 100%; height: 100%; }

    .headline {
      font-size: 28px; font-weight: 700; color: #0D0D0D;
      line-height: 1.2; letter-spacing: -0.4px; margin-bottom: 12px;
    }
    .headline.small { font-size: 22px; margin-bottom: 8px; }

    .sub {
      font-size: 15px; color: #6B6B68; line-height: 1.5; margin-bottom: 8px;
    }

    .step-dots {
      display: flex; gap: 6px; margin-bottom: 28px;
    }
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(0,0,0,0.1);
    }
    .dot.active { background: #1D9E75; }

    .pills {
      display: flex; flex-direction: column; gap: 10px;
      width: 100%; margin: 20px 0 28px;
    }

    .pill {
      display: flex; align-items: center; justify-content: space-between;
      background: #F7F7F5; border: 2px solid transparent;
      border-radius: 14px; padding: 14px 18px;
      cursor: pointer; font-family: inherit;
      transition: border-color 0.15s, background 0.15s;
      text-align: left; width: 100%;
    }
    .pill.selected {
      border-color: #1D9E75; background: #E1F5EE;
    }
    .pill-label {
      font-size: 15px; font-weight: 600; color: #0D0D0D;
    }
    .pill-effort {
      font-size: 13px; color: #6B6B68;
    }
    .pill.selected .pill-label { color: #0F6E56; }
    .pill.selected .pill-effort { color: #1D9E75; }

    .cta {
      background: #0F6E56; color: #fff;
      border: none; border-radius: 14px;
      padding: 16px; font-size: 16px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      width: 100%; margin-bottom: 12px;
    }
    .skip {
      background: none; border: none;
      font-size: 14px; color: #6B6B68;
      cursor: pointer; font-family: inherit;
      padding: 4px;
    }
  `]
})
export class OnboardingComponent {
  @Output() complete = new EventEmitter<OnboardingPrefs>();

  screen = signal(1);
  selectedPace = signal<string | null>(null);
  selectedDistance = signal<string | null>(null);

  readonly paceOptions = [
    { value: 'social',   label: 'Social',   effort: 'chatty pace' },
    { value: 'easy',     label: 'Easy',     effort: 'relaxed pace' },
    { value: 'moderate', label: 'Moderate', effort: 'steady effort' },
    { value: 'fast',     label: 'Fast',     effort: 'push pace' },
    { value: 'tempo',    label: 'Tempo',    effort: 'race effort' },
  ];

  readonly distanceOptions = [
    { value: 'short',  label: 'Short',  range: 'up to 5 km' },
    { value: 'medium', label: 'Medium', range: '5 – 15 km' },
    { value: 'long',   label: 'Long',   range: '15 km+' },
  ];

  finish() {
    const pace = this.selectedPace() ?? undefined;
    const distance = this.selectedDistance() ?? undefined;
    localStorage.setItem('onboarded', 'true');
    if (pace) localStorage.setItem('onboarding_pace', pace);
    if (distance) localStorage.setItem('onboarding_distance', distance);
    this.complete.emit({ pace, distance });
  }
}
