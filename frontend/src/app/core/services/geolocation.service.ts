import { Injectable, signal, inject, NgZone } from '@angular/core';
import { Coordinates } from '../models/run-event.model';

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

const CONSENT_KEY = 'klub-location-consent';

function safeLocalStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage?.getItem(key) ?? null;
}

function safeLocalStorageSet(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    window.localStorage?.setItem(key, value);
  }
}

function isGeolocationAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.geolocation;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private zone = inject(NgZone);

  readonly status = signal<LocationStatus>('idle');
  readonly coordinates = signal<Coordinates | null>(null);

  getStoredConsent(): 'granted' | 'denied' | null {
    return safeLocalStorageGet(CONSENT_KEY) as 'granted' | 'denied' | null;
  }

  /** Call on app init to restore previous consent without re-prompting. */
  restoreFromConsent(): void {
    const consent = this.getStoredConsent();
    if (consent === 'granted') {
      this.requestLocation();
    } else if (consent === 'denied') {
      this.status.set('denied');
    }
  }

  requestLocation(): void {
    if (!isGeolocationAvailable()) {
      this.status.set('unavailable');
      return;
    }
    this.status.set('requesting');
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.zone.run(() => {
          this.coordinates.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          this.status.set('granted');
          safeLocalStorageSet(CONSENT_KEY, 'granted');
        });
      },
      (err: GeolocationPositionError) => {
        this.zone.run(() => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              this.status.set('denied');
              safeLocalStorageSet(CONSENT_KEY, 'denied');
              break;
            case err.POSITION_UNAVAILABLE:
            case err.TIMEOUT:
            default:
              this.status.set('unavailable');
          }
        });
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  declineLocation(): void {
    this.status.set('denied');
    safeLocalStorageSet(CONSENT_KEY, 'denied');
  }
}
