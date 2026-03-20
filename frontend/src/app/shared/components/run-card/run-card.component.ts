import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RunEvent } from '../../../core/models/run-event.model';
import { RunsService } from '../../../core/services/runs.service';

@Component({
  selector: 'app-run-card',
  standalone: true,
  template: `
    <div class="card" (click)="cardClick.emit(run)">
      <div class="card-thumb">
        <div class="thumb-bg">
          <div class="route-line"></div>
          <div class="route-dot start"></div>
          <div class="route-dot end"></div>
        </div>
        <div class="dist-badge">{{ run.distanceKm }}k</div>
      </div>
      <div class="card-body">
        <div class="club-name">{{ run.clubName }}</div>
        <div class="title">{{ run.title }}</div>
        <div class="meta">{{ svc.formatDate(run.date) }} · {{ svc.formatTime(run.date) }}</div>
        <div class="footer">
          <div class="going"><div class="going-dot"></div>{{ run.attendees.length }} going</div>
          <button class="join-btn" [class.joined]="isJoined" (click)="onJoin($event)">
            {{ isJoined ? 'Going' : "I'm coming" }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 16px; overflow: hidden; cursor: pointer; active:opacity-90; }
    .card-thumb { height: 100px; position: relative; }
    .thumb-bg { width: 100%; height: 100%; background: #ddeedd; }
    .route-line { position: absolute; top: 50%; left: 16%; right: 16%; height: 2px; background: #1D9E75; border-radius: 1px; transform: translateY(-50%); }
    .route-dot { position: absolute; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #fff; top: 50%; transform: translateY(-50%); }
    .route-dot.start { left: 16%; background: #1D9E75; }
    .route-dot.end { right: 16%; background: #0D0D0D; }
    .dist-badge { position: absolute; top: 8px; right: 10px; background: #0D0D0D; color: #fff; border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 500; }
    .card-body { padding: 12px 14px 14px; }
    .club-name { font-size: 11px; color: #1D9E75; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px; }
    .title { font-size: 15px; font-weight: 500; color: #0D0D0D; margin-bottom: 4px; }
    .meta { font-size: 13px; color: #6B6B68; margin-bottom: 10px; }
    .footer { display: flex; justify-content: space-between; align-items: center; }
    .going { font-size: 13px; color: #6B6B68; display: flex; align-items: center; gap: 5px; }
    .going-dot { width: 7px; height: 7px; border-radius: 50%; background: #1D9E75; }
    .join-btn { background: #1D9E75; color: #E1F5EE; border: none; border-radius: 999px; padding: 7px 16px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .join-btn.joined { background: #E1F5EE; color: #0F6E56; }
  `]
})
export class RunCardComponent {
  @Input() run!: RunEvent;
  @Input() isJoined = false;
  @Output() cardClick = new EventEmitter<RunEvent>();
  @Output() joinToggle = new EventEmitter<string>();
  svc = inject(RunsService);
  onJoin(e: Event) { e.stopPropagation(); this.joinToggle.emit(this.run.id); }
}