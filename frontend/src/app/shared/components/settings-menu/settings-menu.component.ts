import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-settings-menu',
  standalone: true,
  template: `
    <div class="overlay" (click)="close.emit()"></div>
    <div class="sheet" role="dialog" aria-label="Settings">
      <div class="sheet-header">
        <span class="sheet-title">Settings</span>
        <button class="close-btn" (click)="close.emit()" aria-label="Close settings">×</button>
      </div>

      <div class="section-label">Integrations</div>
      <div class="section-card">
        @if (stravaConnected) {
          <div class="integration-row">
            <svg class="strava-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" fill="#FC4C02"/>
            </svg>
            <span class="integration-name">Strava</span>
            <span class="connected-badge">Connected ✓</span>
          </div>
        } @else {
          <button class="strava-btn" (click)="connectStrava.emit()" aria-label="Connect with Strava">
            <svg class="strava-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" fill="#fff"/>
            </svg>
            Connect with Strava
          </button>
        }
      </div>

      <div class="section-label">Account</div>
      <div class="section-card">
        <button class="logout-btn" (click)="logout.emit()">Log out</button>
      </div>

      <div class="safe-bottom"></div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 100;
      animation: fade-in 0.2s ease;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    .sheet {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #F7F7F5;
      border-radius: var(--radius-sheet, 24px) var(--radius-sheet, 24px) 0 0;
      z-index: 101;
      animation: slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1);
    }
    @keyframes slide-up {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }

    .sheet-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 20px 16px;
      border-bottom: 0.5px solid rgba(0,0,0,0.1);
    }
    .sheet-title { font-size: 17px; font-weight: 600; color: #0D0D0D; }
    .close-btn {
      width: 44px; height: 44px;
      background: rgba(0,0,0,0.06); border: none; border-radius: 50%;
      font-size: 20px; color: #6B6B68; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-family: inherit; flex-shrink: 0;
    }
    .close-btn:active { background: rgba(0,0,0,0.12); }

    .section-label {
      font-size: 11px; font-weight: 500; color: #6B6B68;
      text-transform: uppercase; letter-spacing: 0.06em;
      padding: 20px 20px 8px;
    }
    .section-card {
      margin: 0 16px;
      background: #fff;
      border: 0.5px solid rgba(0,0,0,0.08);
      border-radius: 14px;
      overflow: hidden;
    }

    .integration-row {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; min-height: 44px;
    }
    .strava-icon { width: 20px; height: 20px; flex-shrink: 0; }
    .integration-name { font-size: 15px; font-weight: 500; color: #0D0D0D; flex: 1; }
    .connected-badge { font-size: 13px; color: #1D9E75; font-weight: 600; }

    .strava-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; min-height: 44px;
      background: #FC4C02; border: none;
      color: #fff; font-size: 15px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      padding: 12px 16px;
    }
    .strava-btn:active { opacity: 0.85; }

    .logout-btn {
      display: block; width: 100%; min-height: 44px;
      background: none; border: none;
      color: #E53E3E; font-size: 15px; font-weight: 500;
      cursor: pointer; font-family: inherit;
      padding: 12px 16px; text-align: left;
    }
    .logout-btn:active { background: rgba(229,62,62,0.06); }

    .safe-bottom { height: 16px; }

    @media (min-width: 640px) {
      .sheet {
        bottom: auto;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400px;
        border-radius: 20px;
        animation: modal-in 0.22s cubic-bezier(0.32, 0.72, 0, 1);
      }
      @keyframes modal-in {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
        to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
    }
  `]
})
export class SettingsMenuComponent {
  @Input() stravaConnected = false;
  @Output() close = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() connectStrava = new EventEmitter<void>();
}
