import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const google: any;

interface Point { x: number; y: number; }

@Component({
  selector: 'app-route-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="route-preview" *ngIf="svgPath">
      <svg [attr.viewBox]="viewBox" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <path [attr.d]="svgPath" fill="none" stroke="#FC4C02" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `,
  styles: [`
    .route-preview {
      width: 100%;
      height: 72px;
      background: rgba(255,255,255,0.04);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg { width: 100%; height: 100%; }
  `]
})
export class RoutePreviewComponent implements OnChanges {
  @Input() polyline?: string;

  svgPath = '';
  viewBox = '0 0 200 72';

  ngOnChanges(): void {
    this.svgPath = '';
    if (!this.polyline) return;
    try {
      if (typeof google === 'undefined' || !google?.maps?.geometry?.encoding) return;
      const latLngs: { lat(): number; lng(): number }[] =
        google.maps.geometry.encoding.decodePath(this.polyline);
      if (latLngs.length < 2) return;
      this.buildSvgPath(latLngs);
    } catch {
      // Google Maps not ready — silently skip
    }
  }

  private buildSvgPath(latLngs: { lat(): number; lng(): number }[]): void {
    const W = 200;
    const H = 72;
    const pad = 8;

    const lngs = latLngs.map(p => p.lng());
    const lats = latLngs.map(p => p.lat());
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const rangeX = maxLng - minLng || 1;
    const rangeY = maxLat - minLat || 1;

    const pts: Point[] = latLngs.map(p => ({
      x: pad + ((p.lng() - minLng) / rangeX) * (W - pad * 2),
      // Invert Y: higher lat = higher on screen
      y: pad + ((maxLat - p.lat()) / rangeY) * (H - pad * 2)
    }));

    this.svgPath = 'M ' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
    this.viewBox = `0 0 ${W} ${H}`;
  }
}
