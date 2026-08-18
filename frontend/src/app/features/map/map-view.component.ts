import { Component, inject, ViewChild, ElementRef, AfterViewInit, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { RunDetailDialogComponent } from '../../shared/components/run-detail-dialog/run-detail-dialog.component';
import { RunCardCarouselComponent } from '../../shared/components/run-card-carousel/run-card-carousel.component';
import { RunEvent } from '../../core/models/run-event.model';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

declare const google: any;

const GLASGOW_DEFAULT = { lat: 55.8642, lng: -4.2518 };
const LOCATION_KEY = 'klub_last_location';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, RunDetailDialogComponent, RunCardCarouselComponent, RouterLink],
  template: `
    <div class="map-wrap">
      <div #mapEl class="map-el"></div>

      <div class="map-header">
        <div class="map-title">KLUB</div>
        <div class="runs-count">{{ runsService.getRuns()().length }} runs near you</div>
      </div>

      @if (auth.isOrganizer()) {
        <a routerLink="/clubs/create-run" class="fab">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </a>
      }

      <button class="locate-btn" (click)="locateUser()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/>
        </svg>
      </button>

      @if (runsService.getRuns()().length > 0) {
        <div class="carousel-dock">
          <app-run-card-carousel
            [runs]="runsService.getRuns()()"
            [selectedRunId]="selectedCarouselId()"
            (cardTapped)="onCarouselTap($event)"
            (scrollFocused)="onCarouselScroll($event)"
          />
        </div>
      }
    </div>

    @if (dialogRun()) {
      <app-run-detail-dialog
        [run]="dialogRun()!"
        [isJoined]="runsService.getJoinedRunIds()().includes(dialogRun()!.id)"
        (close)="dialogRun.set(null)"
        (join)="onJoin($event)" />
    }
  `,
  styles: [`
    .map-wrap { height: 100%; position: relative; display: flex; flex-direction: column; }
    .map-el { flex: 1; background: #ddeedd; }
    .map-header { position: absolute; top: 0; left: 0; right: 0; padding: 16px 16px 12px; background: linear-gradient(to bottom, rgba(13,13,13,0.8), transparent); pointer-events: none; }
    .map-title { font-size: 18px; font-weight: 700; letter-spacing: 0.18em; color: #1D9E75; }
    .runs-count { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; }
    .fab { position: absolute; bottom: 196px; right: 16px; width: 52px; height: 52px; border-radius: 50%; background: #1D9E75; display: flex; align-items: center; justify-content: center; text-decoration: none; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .locate-btn { position: absolute; bottom: 196px; left: 16px; width: 44px; height: 44px; border-radius: 50%; background: #fff; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; color: #0D0D0D; }
    .carousel-dock {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 20%;
      min-height: 148px;
      background: linear-gradient(to top, rgba(10,10,26,0.95) 60%, transparent);
      display: flex;
      align-items: flex-end;
      padding-bottom: 8px;
      z-index: 10;
    }
    .carousel-dock app-run-card-carousel {
      width: 100%;
    }
  `]
})
export class MapViewComponent implements OnInit, AfterViewInit {
  @ViewChild('mapEl') mapEl!: ElementRef;
  runsService = inject(RunsService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);
  map: any;
  userMarker: any;
  selectedCarouselId = signal<string | null>(null);
  dialogRun = signal<RunEvent | null>(null);

  private getStoredLocation(): { lat: number; lng: number } {
    try {
      const stored = localStorage.getItem(LOCATION_KEY);
      if (stored) return JSON.parse(stored);
    } catch { }
    return GLASGOW_DEFAULT;
  }

  private storeLocation(coords: { lat: number; lng: number }): void {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(coords));
  }

  ngOnInit(): void { this.runsService.loadRuns(); }

  ngAfterViewInit(): void {
    if (typeof google !== 'undefined') { this.initMap(); return; }
    const existing = document.querySelector<HTMLScriptElement>('script[data-klub-maps]');
    if (existing) {
      (window as any).__klubMapsReady = () => this.initMap();
      return;
    }
    (window as any).__klubMapsReady = () => this.initMap();
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=marker&loading=async&callback=__klubMapsReady`;
    s.async = true;
    s.defer = true;
    s.dataset['klubMaps'] = '1';
    document.head.appendChild(s);
  }

  initMap(): void {
    const startLocation = this.getStoredLocation();
    this.map = new google.maps.Map(this.mapEl.nativeElement, {
      center: startLocation, zoom: 13,
      disableDefaultUI: true, zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP },
      mapId: 'KLUB_MAP'
    });

    this.addRunMarkers();
    this.locateUser(true);
  }

  addRunMarkers(): void {
    this.runsService.getRuns()().forEach(run => {
      const pin = new google.maps.marker.PinElement({
        background: '#1D9E75', borderColor: '#0F6E56', glyphColor: '#fff', scale: 0.9
      });
      const m = new google.maps.marker.AdvancedMarkerElement({
        position: run.startLocation, map: this.map, title: run.clubName, content: pin
      });
      m.addListener('gmp-click', () => {
        this.selectedCarouselId.set(run.id);
        this.panToWithOffset(run.startLocation);
      });
    });
  }

  onCarouselTap(runId: string): void {
    const run = this.runsService.getRuns()().find(r => r.id === runId);
    if (run) {
      this.selectedCarouselId.set(runId);
      this.dialogRun.set(run);
    }
  }

  onCarouselScroll(runId: string): void {
    if (!this.map) return;
    if (runId === this.selectedCarouselId()) return;
    const run = this.runsService.getRuns()().find(r => r.id === runId);
    if (run?.startLocation) {
      this.selectedCarouselId.set(runId);
      this.panToWithOffset(run.startLocation);
    }
  }

  // silent: automatic locate on map load — don't toast if the fix fails; the
  // stored/default centre is already a sensible fallback. Explicit button taps toast.
  locateUser(silent = false): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.storeLocation(coords);
        this.map.panTo(coords);
        this.map.setZoom(13);
        this.setUserMarker(coords);
      },
      (err) => {
        console.warn('[KLUB] Geolocation error:', err.code, err.message);
        if (silent) return;
        this.toast.show(err.code === 1
          ? 'Location blocked. Check your browser permission settings'
          : 'Could not get your location');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  private panToWithOffset(location: { lat: number; lng: number }): void {
    const projection = this.map.getProjection();
    if (!projection) {
      this.map.panTo(location);
      return;
    }
    const point = projection.fromLatLngToPoint(new google.maps.LatLng(location.lat, location.lng));
    const offsetPoint = new google.maps.Point(point.x, point.y - 80 / Math.pow(2, this.map.getZoom()));
    const offsetLatLng = projection.fromPointToLatLng(offsetPoint);
    this.map.panTo(offsetLatLng);
  }

  private setUserMarker(coords: { lat: number; lng: number }): void {
    if (this.userMarker) {
      this.userMarker.position = coords;
    } else {
      const pin = new google.maps.marker.PinElement({
        background: '#4285F4', borderColor: '#fff', glyphColor: '#fff', scale: 0.75
      });
      this.userMarker = new google.maps.marker.AdvancedMarkerElement({
        position: coords, map: this.map, title: 'You', content: pin, zIndex: 999
      });
    }
  }

  onJoin(runId: string): void {
    const user = this.auth.getUser()();
    if (!user) {
      this.toast.show('Sign in to join runs');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/map' } });
      return;
    }
    const wasJoined = this.runsService.getJoinedRunIds()().includes(runId);
    this.runsService.toggleJoin(runId, user.id);
    this.toast.show(wasJoined ? 'Left the run' : "You're in!");
  }
}
