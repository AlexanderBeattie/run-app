import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RunEvent } from '../../../core/models/run-event.model';

@Component({
  selector: 'app-run-card-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="carousel-wrapper">
      <div
        #scrollContainer
        class="scroll-container"
        (scroll)="onScroll()"
      >
        <div
          *ngFor="let run of runs; let i = index"
          #cardEl
          class="mini-card"
          [class.active]="run.id === selectedRunId"
          (click)="onCardTap(run.id)"
        >
          <div class="card-banner" [style.background]="getBannerColor(run.pace)"></div>
          <div class="card-body">
            <div class="card-title">{{ run.title }}</div>
            <div class="card-meta">{{ run.clubName }}</div>
            <div class="card-meta">{{ run.date | date:'EEE, MMM d · h:mm a' }}</div>
            <div class="card-footer">
              <span class="going-badge">{{ run.attendees.length }} going</span>
              <span class="pace-badge" [style.color]="getBannerColor(run.pace)">{{ run.pace }}</span>
            </div>
          </div>
        </div>
        <div class="carousel-end-spacer"></div>
      </div>
    </div>
  `,
  styles: [`
    .carousel-wrapper {
      width: 100%;
      overflow: hidden;
    }

    .scroll-container {
      display: flex;
      gap: 12px;
      padding: 8px 16px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .scroll-container::-webkit-scrollbar {
      display: none;
    }

    .mini-card {
      flex-shrink: 0;
      width: 220px;
      border-radius: 14px;
      background: #1a1a2e;
      border: 2px solid transparent;
      overflow: hidden;
      cursor: pointer;
      scroll-snap-align: start;
      transition: border-color 0.2s ease, transform 0.15s ease;
    }

    .mini-card.active {
      border-color: #1D9E75;
      transform: scale(1.05) translateY(-2px);
      box-shadow: 0 0 16px rgba(29, 158, 117, 0.4);
    }

    .card-banner {
      height: 6px;
      width: 100%;
    }

    .card-body {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-meta {
      font-size: 11px;
      color: #8888aa;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }

    .going-badge {
      font-size: 11px;
      color: #1D9E75;
      font-weight: 500;
    }

    .pace-badge {
      font-size: 10px;
      font-weight: 600;
      text-transform: capitalize;
    }

    .carousel-end-spacer {
      flex-shrink: 0;
      width: 4px;
    }
  `],
})
export class RunCardCarouselComponent implements OnChanges, OnDestroy {
  @Input() runs: RunEvent[] = [];
  @Input() selectedRunId: string | null = null;

  @Output() cardTapped = new EventEmitter<string>();
  @Output() scrollFocused = new EventEmitter<string>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('cardEl') cardEls!: QueryList<ElementRef<HTMLDivElement>>;

  private scrollTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedRunId'] && !changes['selectedRunId'].firstChange) {
      setTimeout(() => this.scrollToSelected(), 0);
    }
  }

  ngOnDestroy(): void {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
  }

  onCardTap(id: string): void {
    this.cardTapped.emit(id);
  }

  onScroll(): void {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => this.emitCenteredRun(), 200);
  }

  private scrollToSelected(): void {
    if (!this.selectedRunId || !this.cardEls) return;
    const idx = this.runs.findIndex(r => r.id === this.selectedRunId);
    if (idx === -1) return;
    const cards = this.cardEls.toArray();
    if (cards[idx]) {
      cards[idx].nativeElement.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }

  private emitCenteredRun(): void {
    if (!this.scrollContainer || !this.cardEls) return;
    const container = this.scrollContainer.nativeElement;
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    const cards = this.cardEls.toArray();
    let closestIdx = 0;
    let closestDist = Infinity;
    cards.forEach((cardRef, i) => {
      const el = cardRef.nativeElement;
      const cardCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(containerCenter - cardCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });
    const centeredRun = this.runs[closestIdx];
    if (centeredRun) {
      this.scrollFocused.emit(centeredRun.id);
    }
  }

  getBannerColor(pace: string | undefined): string {
    switch (pace) {
      case 'easy': return '#0d9488';
      case 'social': return '#16a34a';
      case 'moderate': return '#2563eb';
      case 'fast': return '#dc2626';
      case 'tempo': return '#d97706';
      default: return '#4b5563';
    }
  }
}
