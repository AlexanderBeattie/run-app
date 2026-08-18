import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weather-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="weather-badge" *ngIf="temp !== null">
      <span class="weather-icon">{{ icon }}</span>
      <span class="weather-temp">{{ temp }}°C</span>
      <span class="weather-condition">{{ condition }}</span>
    </div>
  `,
  styles: [`
    .weather-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 0.82rem;
      color: #fff;
    }
    .weather-icon { font-size: 1rem; }
    .weather-temp { font-weight: 600; }
    .weather-condition { opacity: 0.8; }
  `]
})
export class WeatherBadgeComponent {
  @Input() temp: number | null = null;
  @Input() condition = '';
  @Input() icon = '';
}
