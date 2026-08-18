import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RunEvent } from '../../core/models/run-event.model';
import { RunsService } from '../../core/services/runs.service';
import { gradientForPace } from '../../shared/utils/run-pace';

@Component({
  selector: 'app-run-mini-carousel',
  standalone: true,
  template: `
    <div class="section-header">
      <span class="section-title">{{ title }}</span>
    </div>
    <div class="h-carousel">
      @for (run of runs; track run.id) {
        <button class="h-card" [attr.aria-label]="'View run: ' + run.title" (click)="runClick.emit(run)">
          <div class="h-banner" [style.background]="gradientForPace(run.pace)">
            <div class="h-dist">{{ run.distanceKm }}km</div>
            <div class="h-going">{{ run.attendees.length }} going</div>
          </div>
          <div class="h-body">
            <div class="h-title">{{ run.title }}</div>
            <div class="h-date">{{ svc.formatDate(run.date) }}</div>
          </div>
        </button>
      }
    </div>
  `,
  styles: [`
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px 12px;
    }
    .section-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--klub-black, #0D0D0D);
      letter-spacing: -0.2px;
    }
    .h-carousel {
      display: flex;
      gap: 12px;
      padding: 0 16px 24px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .h-carousel::-webkit-scrollbar { display: none; }
    .h-card {
      flex-shrink: 0;
      width: 200px;
      background: #fff;
      border: none;
      border-radius: var(--radius-card, 16px);
      overflow: hidden;
      box-shadow: var(--shadow-card, 0 1px 6px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06));
      cursor: pointer;
      padding: 0;
      text-align: left;
      font-family: inherit;
      transition: transform 0.2s var(--ease-out, ease), box-shadow 0.2s var(--ease-out, ease);
    }
    .h-card:active { transform: scale(0.97); }
    @media (hover: hover) {
      .h-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover, 0 10px 28px rgba(13,13,12,0.10)); }
    }
    .h-banner {
      height: 90px;
      position: relative;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 8px 10px;
    }
    .h-dist {
      background: rgba(0,0,0,0.28);
      backdrop-filter: blur(6px);
      color: #fff;
      border-radius: var(--radius-pill, 999px);
      padding: 3px 9px;
      font-size: 12px; font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .h-going {
      font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.9);
    }
    .h-body { padding: 10px 10px 12px; }
    .h-title {
      font-size: 13px; font-weight: 600; color: var(--klub-black, #0D0D0D);
      margin-bottom: 3px;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .h-date { font-size: 11px; color: var(--klub-muted, #6B6B68); }
  `]
})
export class RunMiniCarouselComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) runs: RunEvent[] = [];
  @Output() runClick = new EventEmitter<RunEvent>();

  svc = inject(RunsService);
  readonly gradientForPace = gradientForPace;
}
