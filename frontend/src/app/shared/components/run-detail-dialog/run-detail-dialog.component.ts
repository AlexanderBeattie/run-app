import { Component, Input, Output, EventEmitter, inject, OnInit, AfterViewInit, ElementRef, ViewChild, signal, computed } from '@angular/core';
import { RunnerProfileDialogComponent } from '../runner-profile-dialog/runner-profile-dialog.component';
import { ShareCardModalComponent } from '../share-card-modal/share-card-modal.component';
import { StravaSelectorModalComponent } from '../strava-selector-modal/strava-selector-modal.component';
import { RunEvent, StravaActivity } from '../../../core/models/run-event.model';
import { RunsService } from '../../../core/services/runs.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../services/toast.service';

declare const google: any;

@Component({
  selector: 'app-run-detail-dialog',
  standalone: true,
  imports: [RunnerProfileDialogComponent, ShareCardModalComponent, StravaSelectorModalComponent],
  template: `
    <div class="overlay" (click)="onOverlay($event)">
      <div class="dialog">
        <div class="drag-handle"></div>
        <button class="close" (click)="close.emit()">✕</button>
        <div class="club-label">{{ run.clubName }}</div>
        <h2>{{ run.title }}</h2>
        @if (validDate) {
          <div class="meta">{{ svc.formatDate(validDate) }} · {{ svc.formatTime(validDate) }}</div>
        }
        <div class="mini-map" #miniMap></div>
        <div class="route-labels">
          <div class="rl"><div class="dot green"></div><span>{{ run.startAddress }}</span></div>
          <div class="rl"><div class="dot black"></div><span>{{ run.endAddress }}</span></div>
        </div>
        <div class="maps-row">
          <a class="maps-btn" [href]="googleMapsUrl" target="_blank" rel="noopener">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Google Maps
          </a>
          <a class="maps-btn" [href]="appleMapsUrl" target="_blank" rel="noopener">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Apple Maps
          </a>
          <button class="maps-btn directions-btn" (click)="getDirections()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            Directions
          </button>
        </div>
        @if (run.pace) {
          <div class="pace-row">
            <span class="pace-chip" [attr.data-pace]="run.pace">{{ run.pace }}</span>
            @for (tag of (run.tags ?? []); track tag) {
              <span class="tag-chip">{{ tag }}</span>
            }
          </div>
        }
        <div class="stats">
          <div class="stat"><div class="sv">{{ run.distanceKm ? run.distanceKm + 'k' : '—' }}</div><div class="sl">distance</div></div>
          <div class="stat"><div class="sv">{{ estimatedTimeLabel }}</div><div class="sl">est. time</div></div>
          <div class="stat"><div class="sv">{{ run.attendees.length }}</div><div class="sl">going</div></div>
          @if (run.maxAttendees) {
            <div class="stat"><div class="sv">{{ run.maxAttendees - run.attendees.length }}</div><div class="sl">spots left</div></div>
          }
        </div>
        @if (run.notes) {
          <div class="section-title">Notes</div>
          <div class="notes">{{ run.notes }}</div>
        }
        @if (kitItems.length > 0) {
          <div class="section-title">What to bring</div>
          <div class="kit-list">
            @for (item of kitItems; track item) {
              <div class="kit-item">
                <svg class="kit-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>{{ item }}</span>
              </div>
            }
          </div>
        }
        <div class="section-title">Who's going ({{ attendees.length }})</div>
        @if (attendees.length === 0) {
          <div class="empty">No one yet — be the first!</div>
        } @else {
          <div class="chips">
            @for (a of attendees; track a.id) {
              <button class="chip" (click)="onAttendeeClick(a.id)" [attr.aria-label]="'View profile for ' + a.display_name">
                <div class="chip-av">{{ a.display_name?.[0]?.toUpperCase() ?? '?' }}</div>
                <span>{{ a.display_name }}</span>
              </button>
            }
          </div>
        }
        @if (selectedProfileUserId()) {
          <app-runner-profile-dialog
            [userId]="selectedProfileUserId()!"
            (close)="selectedProfileUserId.set(null)" />
        }
        @if (nextRun()) {
          <div class="next-run-footer">
            <div class="nr-label">Next run by {{ run.clubName }}</div>
            <div class="nr-card">
              <div class="nr-info">
                <div class="nr-title">{{ nextRun()!.title }}</div>
                <div class="nr-meta">{{ svc.formatDate(nextRun()!.date) }} · {{ svc.formatTime(nextRun()!.date) }}{{ nextRun()!.distanceKm ? ' · ' + nextRun()!.distanceKm + 'k' : '' }}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        }
        <div class="action-row">
          @if (isRunPassed()) {
            <button class="share-btn share-card-btn" (click)="showShareCard.set(true)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>
              Share Card
            </button>
            @if (canLinkStrava()) {
              <button class="strava-btn" (click)="showStravaModal.set(true)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Strava
              </button>
            }
          } @else {
            <button class="share-btn" (click)="share()">↗ Share</button>
          }
          <button class="join-btn" [class.joined]="isJoined" (click)="join.emit(run.id)">
            {{ isJoined ? "You're going — tap to unjoin" : "I'm coming" }}
          </button>
        </div>
        @if (showShareCard()) {
          <app-share-card-modal [run]="run" (close)="showShareCard.set(false)" />
        }
        @if (showStravaModal()) {
          <app-strava-selector-modal
            (close)="showStravaModal.set(false)"
            (selected)="onStravaActivitySelected($event)" />
        }
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; justify-content: center; z-index: 500; }
    .dialog { background: #fff; border-radius: 20px 20px 0 0; width: 100%; max-width: 560px; max-height: 92dvh; overflow-y: auto; padding: 8px 20px 40px; position: relative; }
    .drag-handle { width: 40px; height: 4px; background: rgba(0,0,0,0.15); border-radius: 2px; margin: 8px auto 16px; }
    .close { position: absolute; top: 20px; right: 16px; background: #F7F7F5; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 14px; cursor: pointer; color: #6B6B68; display: flex; align-items: center; justify-content: center; }
    .club-label { font-size: 12px; font-weight: 500; color: #1D9E75; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    h2 { font-size: 20px; font-weight: 500; color: #0D0D0D; margin-bottom: 4px; padding-right: 36px; }
    .meta { font-size: 13px; color: #6B6B68; margin-bottom: 14px; }
    .mini-map { width: 100%; height: 180px; border-radius: 12px; background: #ddeedd; margin-bottom: 10px; overflow: hidden; }
    .route-labels { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
    .rl { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6B6B68; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot.green { background: #1D9E75; }
    .dot.black { background: #0D0D0D; }
    .maps-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .maps-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; color: #1D9E75; background: #E1F5EE; border-radius: 999px; padding: 5px 12px; text-decoration: none; }
    .directions-btn { border: none; cursor: pointer; font-family: inherit; }
    .pace-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
    .pace-chip { font-size: 12px; font-weight: 600; border-radius: 999px; padding: 4px 12px; text-transform: capitalize; background: #F0F0EE; color: #3A3A38; }
    .pace-chip[data-pace="easy"]     { background: #E1F5EE; color: #0F6E56; }
    .pace-chip[data-pace="social"]   { background: #D1FAE5; color: #065f46; }
    .pace-chip[data-pace="moderate"] { background: #DBEAFE; color: #1e3a8a; }
    .pace-chip[data-pace="fast"]     { background: #FEE2E2; color: #7f1d1d; }
    .pace-chip[data-pace="tempo"]    { background: #FEF3C7; color: #78350f; }
    .tag-chip { font-size: 11px; font-weight: 500; background: #F0F0EE; color: #3A3A38; border-radius: 999px; padding: 3px 10px; text-transform: capitalize; }
    .stats { display: flex; background: #F7F7F5; border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
    .stat { flex: 1; padding: 12px 8px; text-align: center; border-right: 0.5px solid rgba(0,0,0,0.08); }
    .stat:last-child { border-right: none; }
    .sv { font-size: 18px; font-weight: 500; color: #0D0D0D; }
    .sl { font-size: 10px; color: #9B9B98; margin-top: 2px; }
    .section-title { font-size: 12px; font-weight: 500; color: #9B9B98; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
    .notes { font-size: 14px; color: #3D3D3B; line-height: 1.6; background: #F7F7F5; border-radius: 10px; padding: 12px; margin-bottom: 20px; }
    .empty { font-size: 13px; color: #9B9B98; margin-bottom: 20px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .chip { display: flex; align-items: center; gap: 6px; background: #F7F7F5; border-radius: 999px; padding: 4px 12px 4px 4px; border: none; cursor: pointer; font-family: inherit; }
    .chip:hover { background: #EAEAE8; }
    .chip:focus-visible { outline: 2px solid #1D9E75; outline-offset: 2px; }
    .chip-av { width: 24px; height: 24px; border-radius: 50%; background: #E1F5EE; color: #0F6E56; font-size: 11px; font-weight: 500; display: flex; align-items: center; justify-content: center; }
    .chip span { font-size: 13px; color: #0D0D0D; }
    .kit-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .kit-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #3D3D3B; }
    .kit-icon { color: #1D9E75; flex-shrink: 0; }
    .next-run-footer { margin-bottom: 16px; }
    .nr-label { font-size: 11px; font-weight: 500; color: #9B9B98; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .nr-card { display: flex; align-items: center; justify-content: space-between; background: #F7F7F5; border-radius: 12px; padding: 12px 14px; border: 1px solid rgba(29,158,117,0.15); cursor: pointer; }
    .nr-info { display: flex; flex-direction: column; gap: 2px; }
    .nr-title { font-size: 14px; font-weight: 500; color: #0D0D0D; }
    .nr-meta { font-size: 12px; color: #6B6B68; }
    .action-row { display: flex; gap: 10px; }
    .share-btn { background: #F7F7F5; color: #0D0D0D; border: none; border-radius: 12px; padding: 16px 20px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; white-space: nowrap; }
    .share-card-btn { display: inline-flex; align-items: center; gap: 6px; }
    .join-btn { flex: 1; background: #1D9E75; color: #E1F5EE; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .join-btn.joined { background: #F7F7F5; color: #6B6B68; }
    .strava-btn { display: inline-flex; align-items: center; gap: 5px; background: #FFF1EC; color: #FC4C02; border: 1px solid #FC4C02; border-radius: 12px; padding: 16px 16px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; white-space: nowrap; }
    .strava-btn:hover { background: #FFE4D8; }
    @media (min-width: 600px) {
      .overlay { align-items: center; padding: 20px; }
      .dialog { border-radius: 20px; max-height: 90vh; }
    }
  `]
})
export class RunDetailDialogComponent implements OnInit, AfterViewInit {
  @Input() run!: RunEvent;
  @Input() isJoined = false;
  @Output() close = new EventEmitter<void>();
  @Output() join = new EventEmitter<string>();
  @ViewChild('miniMap') miniMapEl!: ElementRef;
  svc = inject(RunsService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  attendees: { id: string; display_name: string }[] = [];
  selectedProfileUserId = signal<string | null>(null);
  nextRun = signal<RunEvent | null>(null);
  showShareCard = signal(false);
  showStravaModal = signal(false);
  isRunPassed = computed(() => new Date(this.run.date) < new Date());
  canLinkStrava = computed(() =>
    this.isRunPassed() && this.isJoined && !!(this.auth.getUser()()?.stravaConnected)
  );

  get validDate(): Date | null {
    const d = new Date(this.run.date);
    return isNaN(d.getTime()) ? null : d;
  }

  get estimatedTimeLabel(): string {
    if (!this.run.estimatedMinutes) return '—';
    const h = Math.floor(this.run.estimatedMinutes / 60);
    const m = this.run.estimatedMinutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  get googleMapsUrl(): string {
    if (!this.run?.startLocation || !this.run?.endLocation) return '#';
    const { lat, lng } = this.run.startLocation;
    return `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${this.run.endLocation.lat},${this.run.endLocation.lng}&travelmode=walking`;
  }

  get appleMapsUrl(): string {
    if (!this.run?.startLocation || !this.run?.endLocation) return '#';
    const { lat, lng } = this.run.startLocation;
    return `https://maps.apple.com/?saddr=${lat},${lng}&daddr=${this.run.endLocation.lat},${this.run.endLocation.lng}&dirflg=w`;
  }

  get kitItems(): string[] {
    const items: string[] = [];
    const tags = this.run.tags ?? [];
    const hour = new Date(this.run.date).getHours();
    const dist = this.run.distanceKm;
    if (this.run.runType === 'trail_run' || tags.includes('trail')) items.push('Trail shoes');
    if (hour < 7 || hour >= 18) items.push('Headtorch');
    if (dist >= 15) { items.push('Nutrition/gels'); items.push('Hydration vest or bottle'); }
    else if (dist >= 10) items.push('Water bottle');
    if (tags.includes('hills') || tags.includes('elevation')) items.push('Poles (optional)');
    return items;
  }

  ngOnInit() {
    this.svc.getAttendees(this.run.id).subscribe(d => this.attendees = d);
    if (this.run.clubId) {
      this.svc.getNextRunByClub(this.run.clubId, this.run.id).subscribe(r => this.nextRun.set(r));
    }
  }
  ngAfterViewInit() { setTimeout(() => this.initMap(), 150); }

  initMap() {
    if (typeof google === 'undefined' || !this.miniMapEl || !this.run?.startLocation || !this.run?.endLocation) return;
    const map = new google.maps.Map(this.miniMapEl.nativeElement, {
      center: this.run.startLocation, zoom: 13, disableDefaultUI: true,
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }]
    });
    new google.maps.Marker({ position: this.run.startLocation, map, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#1D9E75', fillOpacity: 1, strokeColor: '#0F6E56', strokeWeight: 2 } });
    new google.maps.Marker({ position: this.run.endLocation, map, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#0D0D0D', fillOpacity: 1, strokeColor: '#0D0D0D', strokeWeight: 2 } });
    const ds = new google.maps.DirectionsService();
    const dr = new google.maps.DirectionsRenderer({ map, suppressMarkers: true, polylineOptions: { strokeColor: '#1D9E75', strokeWeight: 3 } });
    ds.route({ origin: this.run.startLocation, destination: this.run.endLocation, travelMode: google.maps.TravelMode.WALKING }, (r: any, s: any) => { if (s === 'OK') dr.setDirections(r); });
    const b = new google.maps.LatLngBounds();
    b.extend(this.run.startLocation); b.extend(this.run.endLocation);
    map.fitBounds(b, 40);
  }

  getDirections() {
    if (!this.run?.startLocation) {
      this.toast.show('Location data unavailable for this run');
      return;
    }
    if (!navigator.geolocation) {
      window.open(this.googleMapsUrl, '_blank', 'noopener');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const { lat: dLat, lng: dLng } = this.run.startLocation;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${dLat},${dLng}&travelmode=walking`;
        window.open(url, '_blank', 'noopener');
      },
      () => {
        this.toast.show('Location unavailable — opening start point');
        window.open(this.googleMapsUrl, '_blank', 'noopener');
      },
      { timeout: 8000 }
    );
  }

  onStravaActivitySelected(activity: StravaActivity) {
    this.showStravaModal.set(false);
    this.svc.linkStravaActivity(this.run.id, {
      strava_activity_id: activity.id,
      strava_distance: activity.distance,
      strava_moving_time: activity.moving_time,
      strava_average_speed: activity.average_speed,
      strava_polyline: activity.polyline,
    }).subscribe({
      next: () => this.toast.show('Strava run linked!'),
      error: () => this.toast.show('Failed to link Strava run'),
    });
  }

  onAttendeeClick(userId: string) { this.selectedProfileUserId.set(userId); }

  onOverlay(e: MouseEvent) { if ((e.target as HTMLElement).classList.contains('overlay')) this.close.emit(); }

  async share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: this.run.title, text: `Join me for a run: ${this.run.title}`, url });
      } catch (e: any) {
        if (e.name !== 'AbortError') { await this.copyToClipboard(url); }
      }
    } else {
      await this.copyToClipboard(url);
    }
  }

  private async copyToClipboard(text: string) {
    try { await navigator.clipboard.writeText(text); this.toast.show('Link copied!'); }
    catch { this.toast.show('Unable to share'); }
  }
}