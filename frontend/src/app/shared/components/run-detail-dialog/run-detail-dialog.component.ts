import { Component, Input, Output, EventEmitter, inject, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { RunEvent } from '../../../core/models/run-event.model';
import { RunsService } from '../../../core/services/runs.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../services/toast.service';

declare const google: any;

@Component({
  selector: 'app-run-detail-dialog',
  standalone: true,
  template: `
    <div class="overlay" (click)="onOverlay($event)">
      <div class="dialog">
        <div class="drag-handle"></div>
        <button class="close" (click)="close.emit()">✕</button>
        <div class="club-label">{{ run.clubName }}</div>
        <h2>{{ run.title }}</h2>
        <div class="meta">{{ svc.formatDate(run.date) }} · {{ svc.formatTime(run.date) }}</div>
        <div class="mini-map" #miniMap></div>
        <div class="route-labels">
          <div class="rl"><div class="dot green"></div><span>{{ run.startAddress }}</span></div>
          <div class="rl"><div class="dot black"></div><span>{{ run.endAddress }}</span></div>
        </div>
        <div class="stats">
          <div class="stat"><div class="sv">{{ run.distanceKm }}k</div><div class="sl">distance</div></div>
          <div class="stat"><div class="sv">~{{ run.estimatedMinutes }}m</div><div class="sl">est. time</div></div>
          <div class="stat"><div class="sv">{{ run.attendees.length }}</div><div class="sl">going</div></div>
          @if (run.maxAttendees) {
            <div class="stat"><div class="sv">{{ run.maxAttendees }}</div><div class="sl">max</div></div>
          }
        </div>
        @if (run.notes) {
          <div class="section-title">Notes</div>
          <div class="notes">{{ run.notes }}</div>
        }
        <div class="section-title">Who's going ({{ attendees.length }})</div>
        @if (attendees.length === 0) {
          <div class="empty">No one yet — be the first!</div>
        } @else {
          <div class="chips">
            @for (a of attendees; track a.id) {
              <div class="chip"><div class="chip-av">{{ a.display_name?.[0]?.toUpperCase() ?? '?' }}</div><span>{{ a.display_name }}</span></div>
            }
          </div>
        }
        <div class="action-row">
          <button class="share-btn" (click)="share()">↗ Share</button>
          <button class="join-btn" [class.joined]="isJoined" (click)="join.emit(run.id)">
            {{ isJoined ? "You're going — tap to unjoin" : "I'm coming" }}
          </button>
        </div>
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
    .route-labels { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .rl { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6B6B68; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot.green { background: #1D9E75; }
    .dot.black { background: #0D0D0D; }
    .stats { display: flex; background: #F7F7F5; border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
    .stat { flex: 1; padding: 12px 8px; text-align: center; border-right: 0.5px solid rgba(0,0,0,0.08); }
    .stat:last-child { border-right: none; }
    .sv { font-size: 18px; font-weight: 500; color: #0D0D0D; }
    .sl { font-size: 10px; color: #9B9B98; margin-top: 2px; }
    .section-title { font-size: 12px; font-weight: 500; color: #9B9B98; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
    .notes { font-size: 14px; color: #3D3D3B; line-height: 1.6; background: #F7F7F5; border-radius: 10px; padding: 12px; margin-bottom: 20px; }
    .empty { font-size: 13px; color: #9B9B98; margin-bottom: 20px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .chip { display: flex; align-items: center; gap: 6px; background: #F7F7F5; border-radius: 999px; padding: 4px 12px 4px 4px; }
    .chip-av { width: 24px; height: 24px; border-radius: 50%; background: #E1F5EE; color: #0F6E56; font-size: 11px; font-weight: 500; display: flex; align-items: center; justify-content: center; }
    .chip span { font-size: 13px; color: #0D0D0D; }
    .action-row { display: flex; gap: 10px; }
    .share-btn { background: #F7F7F5; color: #0D0D0D; border: none; border-radius: 12px; padding: 16px 20px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; white-space: nowrap; }
    .join-btn { flex: 1; background: #1D9E75; color: #E1F5EE; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .join-btn.joined { background: #F7F7F5; color: #6B6B68; }
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

  ngOnInit() { this.svc.getAttendees(this.run.id).subscribe(d => this.attendees = d); }
  ngAfterViewInit() { setTimeout(() => this.initMap(), 150); }

  initMap() {
    if (typeof google === 'undefined' || !this.miniMapEl) return;
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