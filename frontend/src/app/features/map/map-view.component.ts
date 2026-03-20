import { Component, inject, ViewChild, ElementRef, AfterViewInit, OnInit, signal } from '@angular/core';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { RunDetailDialogComponent } from '../../shared/components/run-detail-dialog/run-detail-dialog.component';
import { RunEvent } from '../../core/models/run-event.model';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [RunDetailDialogComponent, RouterLink],
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

      <div class="sheet" [class.expanded]="sheetOpen()">
        <div class="sheet-handle" (click)="sheetOpen.set(!sheetOpen())">
          <div class="handle-bar"></div>
          <span>{{ sheetOpen() ? 'Nearby runs' : 'View ' + runsService.getRuns()().length + ' runs' }}</span>
        </div>
        <div class="sheet-list">
          @for (run of runsService.getRuns()(); track run.id) {
            <div class="sheet-item" (click)="openDialog(run)">
              <div class="item-left">
                <div class="item-club">{{ run.clubName }}</div>
                <div class="item-title">{{ run.title }}</div>
                <div class="item-meta">{{ runsService.formatDate(run.date) }} · {{ run.distanceKm }}k</div>
              </div>
              <div class="item-right">
                <div class="item-going">{{ run.attendees.length }}</div>
                <div class="item-going-label">going</div>
              </div>
            </div>
          }
        </div>
      </div>
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
    .fab { position: absolute; bottom: 220px; right: 16px; width: 52px; height: 52px; border-radius: 50%; background: #1D9E75; display: flex; align-items: center; justify-content: center; text-decoration: none; z-index: 10; }
    .sheet { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; border-radius: 20px 20px 0 0; max-height: 70%; transition: transform 0.3s ease; transform: translateY(calc(100% - 72px)); z-index: 10; display: flex; flex-direction: column; }
    .sheet.expanded { transform: translateY(0); }
    .sheet-handle { padding: 10px 16px 8px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0; }
    .handle-bar { width: 40px; height: 4px; background: rgba(0,0,0,0.15); border-radius: 2px; }
    .sheet-handle span { font-size: 13px; font-weight: 500; color: #0D0D0D; }
    .sheet-list { overflow-y: auto; padding: 0 16px 24px; display: flex; flex-direction: column; gap: 2px; }
    .sheet-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 10px; border-radius: 10px; cursor: pointer; }
    .sheet-item:hover { background: #F7F7F5; }
    .item-club { font-size: 11px; color: #1D9E75; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px; }
    .item-title { font-size: 14px; font-weight: 500; color: #0D0D0D; margin-bottom: 2px; }
    .item-meta { font-size: 12px; color: #6B6B68; }
    .item-right { text-align: center; flex-shrink: 0; margin-left: 12px; }
    .item-going { font-size: 18px; font-weight: 500; color: #0D0D0D; }
    .item-going-label { font-size: 10px; color: #9B9B98; }
  `]
})
export class MapViewComponent implements OnInit, AfterViewInit {
  @ViewChild('mapEl') mapEl!: ElementRef;
  runsService = inject(RunsService);
  auth = inject(AuthService);
  map: any;
  sheetOpen = signal(false);
  dialogRun = signal<RunEvent | null>(null);

  ngOnInit() { this.runsService.loadRuns(); }

  ngAfterViewInit() {
    if (typeof google !== 'undefined') { this.initMap(); return; }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}`;
    s.onload = () => this.initMap();
    document.head.appendChild(s);
  }

  initMap() {
    this.map = new google.maps.Map(this.mapEl.nativeElement, {
      center: { lat: 51.515, lng: -0.08 }, zoom: 12,
      disableDefaultUI: true, zoomControl: true,
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }]
    });
    this.runsService.getRuns()().forEach(run => {
      const m = new google.maps.Marker({
        position: run.startLocation, map: this.map, title: run.clubName,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#1D9E75', fillOpacity: 1, strokeColor: '#0F6E56', strokeWeight: 2 }
      });
      m.addListener('click', () => this.dialogRun.set(run));
    });
  }

  openDialog(run: RunEvent) { this.dialogRun.set(run); this.sheetOpen.set(false); }
  onJoin(runId: string) { this.runsService.toggleJoin(runId, this.auth.getUser()()?.id ?? 'guest'); }
}