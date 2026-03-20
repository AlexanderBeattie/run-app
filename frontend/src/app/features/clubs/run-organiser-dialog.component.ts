import { Component, Input, Output, EventEmitter, inject, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RunsService } from '../../core/services/runs.service';

declare const google: any;

@Component({
  selector: 'app-run-organiser-dialog',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="overlay" (click)="onOverlay($event)">
      <div class="dialog">
        <div class="drag-handle"></div>
        <button class="close" (click)="close.emit()">✕</button>
        <div class="header-row">
          <h2>{{ run.title }}</h2>
          <span class="badge" [class.active]="run.status !== 'cancelled'" [class.cancelled]="run.status === 'cancelled'">
            {{ run.status === 'cancelled' ? 'Cancelled' : 'Active' }}
          </span>
        </div>
        <div class="meta">{{ formatDate(run.event_date) }} · {{ formatTime(run.event_date) }}</div>
        <div class="mini-map" #miniMap></div>
        <div class="route-labels">
          <div class="rl"><div class="dot green"></div><span>{{ run.start_address }}</span></div>
          <div class="rl"><div class="dot black"></div><span>{{ run.end_address }}</span></div>
        </div>
        <div class="capacity-card">
          <div class="cap-row">
            <span class="cap-label">Signups</span>
            <span class="cap-val">{{ run.attendees?.length ?? 0 }}{{ run.max_attendees ? ' / ' + run.max_attendees : '' }}</span>
          </div>
          @if (run.max_attendees) {
            <div class="cap-bar"><div class="cap-fill" [style.width.%]="capacityPercent"></div></div>
            <div class="cap-sub">{{ run.max_attendees - (run.attendees?.length ?? 0) }} spots remaining</div>
          }
        </div>
        <div class="section-title">Attendees ({{ attendees.length }})</div>
        @if (attendees.length === 0) {
          <div class="empty">No one signed up yet.</div>
        } @else {
          <div class="attendee-list">
            @for (a of attendees; track a.id) {
              <div class="attendee-row">
                <div class="av">{{ a.display_name[0].toUpperCase() }}</div>
                <span class="aname">{{ a.display_name }}</span>
                <span class="adate">{{ formatJoinDate(a.joined_at) }}</span>
              </div>
            }
          </div>
        }
        <div class="actions">
          <a [routerLink]="['/clubs/edit-run', run.id]" class="btn-sm" (click)="close.emit()">Edit</a>
          @if (run.status !== 'cancelled') {
            <button class="btn-sm warn" (click)="onCancel()">Cancel run</button>
          }
          <button class="btn-sm danger" (click)="onDelete()">Delete</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; justify-content: center; z-index: 500; }
    .dialog { background: #fff; border-radius: 20px 20px 0 0; width: 100%; max-width: 560px; max-height: 92dvh; overflow-y: auto; padding: 8px 20px 40px; }
    .drag-handle { width: 40px; height: 4px; background: rgba(0,0,0,0.15); border-radius: 2px; margin: 8px auto 16px; }
    .close { position: absolute; margin-top: -44px; float: right; background: #F7F7F5; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 14px; cursor: pointer; color: #6B6B68; }
    .header-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; flex-wrap: wrap; }
    h2 { font-size: 20px; font-weight: 500; color: #0D0D0D; }
    .meta { font-size: 13px; color: #6B6B68; margin-bottom: 14px; }
    .badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 500; }
    .badge.active { background: #E1F5EE; color: #0F6E56; }
    .badge.cancelled { background: #FCEBEB; color: #A32D2D; }
    .mini-map { width: 100%; height: 160px; border-radius: 12px; background: #ddeedd; margin-bottom: 10px; overflow: hidden; }
    .route-labels { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .rl { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6B6B68; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot.green { background: #1D9E75; }
    .dot.black { background: #0D0D0D; }
    .capacity-card { background: #F7F7F5; border-radius: 12px; padding: 14px; margin-bottom: 20px; }
    .cap-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .cap-label { font-size: 12px; color: #9B9B98; }
    .cap-val { font-size: 13px; font-weight: 500; color: #0D0D0D; }
    .cap-bar { height: 6px; background: rgba(0,0,0,0.08); border-radius: 999px; overflow: hidden; margin-bottom: 6px; }
    .cap-fill { height: 100%; background: #1D9E75; border-radius: 999px; }
    .cap-sub { font-size: 12px; color: #6B6B68; }
    .section-title { font-size: 12px; font-weight: 500; color: #9B9B98; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
    .empty { font-size: 13px; color: #9B9B98; margin-bottom: 16px; }
    .attendee-list { display: flex; flex-direction: column; margin-bottom: 20px; }
    .attendee-row { display: flex; align-items: center; gap: 10px; padding: 8px 6px; border-radius: 8px; }
    .attendee-row:hover { background: #F7F7F5; }
    .av { width: 28px; height: 28px; border-radius: 50%; background: #E1F5EE; color: #0F6E56; font-size: 12px; font-weight: 500; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .aname { font-size: 14px; color: #0D0D0D; flex: 1; }
    .adate { font-size: 12px; color: #9B9B98; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-sm { background: transparent; border: 0.5px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 10px 16px; font-size: 13px; cursor: pointer; font-family: inherit; color: #6B6B68; text-decoration: none; }
    .btn-sm.warn { color: #BA7517; border-color: #BA7517; }
    .btn-sm.danger { color: #A32D2D; border-color: #A32D2D; }
    @media (min-width: 600px) {
      .overlay { align-items: center; padding: 20px; }
      .dialog { border-radius: 20px; }
    }
  `]
})
export class RunOrganiserDialogComponent implements OnInit, AfterViewInit {
  @Input() run!: any;
  @Output() close = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<string>();
  @Output() deleted = new EventEmitter<string>();
  @ViewChild('miniMap') miniMapEl!: ElementRef;
  svc = inject(RunsService);
  attendees: any[] = [];

  get capacityPercent() {
    if (!this.run.max_attendees) return 0;
    return Math.min(100, Math.round(((this.run.attendees?.length ?? 0) / this.run.max_attendees) * 100));
  }

  ngOnInit() { this.svc.getAttendees(this.run.id).subscribe(d => this.attendees = d); }
  ngAfterViewInit() { setTimeout(() => this.initMap(), 150); }

  initMap() {
    if (typeof google === 'undefined' || !this.miniMapEl) return;
    const sl = { lat: parseFloat(this.run.start_lat), lng: parseFloat(this.run.start_lng) };
    const el = { lat: parseFloat(this.run.end_lat), lng: parseFloat(this.run.end_lng) };
    const map = new google.maps.Map(this.miniMapEl.nativeElement, { center: sl, zoom: 13, disableDefaultUI: true, styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }] });
    new google.maps.Marker({ position: sl, map, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#1D9E75', fillOpacity: 1, strokeColor: '#0F6E56', strokeWeight: 2 } });
    new google.maps.Marker({ position: el, map, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#0D0D0D', fillOpacity: 1, strokeColor: '#0D0D0D', strokeWeight: 2 } });
    const ds = new google.maps.DirectionsService();
    const dr = new google.maps.DirectionsRenderer({ map, suppressMarkers: true, polylineOptions: { strokeColor: '#1D9E75', strokeWeight: 3 } });
    ds.route({ origin: sl, destination: el, travelMode: google.maps.TravelMode.WALKING }, (r: any, s: any) => { if (s === 'OK') dr.setDirections(r); });
    const b = new google.maps.LatLngBounds(); b.extend(sl); b.extend(el); map.fitBounds(b, 40);
  }

  formatDate(date: string) { const d = new Date(date); const diff = d.getTime() - Date.now(); const days = Math.floor(diff/86400000); if (days===0) return 'Today'; if (days===1) return 'Tomorrow'; return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  formatTime(date: string) { return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  formatJoinDate(date: string) { return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }

  onCancel() { if (!confirm('Cancel run?')) return; this.svc.cancelRun(this.run.id).subscribe(() => this.cancelled.emit(this.run.id)); }
  onDelete() { if (!confirm('Delete run?')) return; this.svc.deleteRun(this.run.id).subscribe(() => this.deleted.emit(this.run.id)); }
  onOverlay(e: MouseEvent) { if ((e.target as HTMLElement).classList.contains('overlay')) this.close.emit(); }
}