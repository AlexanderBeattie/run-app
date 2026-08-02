import { Component, Output, EventEmitter, inject, effect } from '@angular/core';
import { GeolocationService } from '../../../core/services/geolocation.service';

@Component({
  selector: 'app-location-welcome-modal',
  standalone: true,
  template: `
    <div class="overlay" (click)="onOverlayClick($event)">
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="location-modal-title">

        <div class="icon-wrap">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" fill="#E1F5EE"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#1D9E75"/>
          </svg>
        </div>

        <h2 class="title" id="location-modal-title">Find runs near you</h2>
        <p class="sub">Share your location to discover clubs starting right where you are.</p>

        @if (status() === 'idle' || status() === 'requesting') {
          <button class="cta" [disabled]="status() === 'requesting'" (click)="onEnable()">
            @if (status() === 'requesting') {
              <span class="spinner"></span> Locating...
            } @else {
              Enable Location
            }
          </button>
          <button class="skip" (click)="onSkip()">Skip for now</button>
        }

        @if (status() === 'denied') {
          <div class="error-msg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A32D2D" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Location access was denied. You can enable it in your browser settings.
          </div>
          <button class="skip" (click)="onSkip()">Continue without location</button>
        }

        @if (status() === 'unavailable') {
          <div class="error-msg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A32D2D" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Could not determine your location. Check your device's location settings.
          </div>
          <button class="cta secondary" (click)="onEnable()">Try Again</button>
          <button class="skip" (click)="onSkip()">Continue without location</button>
        }

      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 300;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .sheet {
      background: #fff;
      border-radius: var(--radius-sheet, 24px) var(--radius-sheet, 24px) 0 0;
      padding: 28px 24px 40px;
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0;
    }
    .icon-wrap {
      margin-bottom: 16px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #0D0D0D;
      margin: 0 0 8px;
    }
    .sub {
      font-size: 14px;
      color: #6B6B68;
      margin: 0 0 28px;
      line-height: 1.5;
    }
    .cta {
      width: 100%;
      background: #0F6E56;
      color: #fff;
      border: none;
      border-radius: 14px;
      padding: 15px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.15s;
    }
    .cta:disabled {
      opacity: 0.7;
      cursor: default;
    }
    .cta.secondary {
      background: #F7F7F5;
      color: #0D0D0D;
      margin-top: 10px;
    }
    .skip {
      background: none;
      border: none;
      color: #6B6B68;
      font-size: 14px;
      font-family: inherit;
      cursor: pointer;
      padding: 12px;
      margin-top: 4px;
    }
    .error-msg {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #FCEBEB;
      border: 1px solid #E89999;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 13px;
      color: #8B2828;
      text-align: left;
      width: 100%;
      margin-bottom: 12px;
    }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.6);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LocationWelcomeModalComponent {
  @Output() locationGranted = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  private geoService = inject(GeolocationService);
  readonly status = this.geoService.status;

  constructor() {
    effect(() => {
      // Only emit after the user has actively gone through the request flow
      if (this.status() === 'granted') {
        this.locationGranted.emit();
      }
    });
  }

  onEnable(): void {
    this.geoService.requestLocation();
  }

  onSkip(): void {
    this.geoService.declineLocation();
    this.dismissed.emit();
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay')) {
      this.onSkip();
    }
  }
}
