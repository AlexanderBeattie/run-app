import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Club } from '../../core/models/run-event.model';
import { clubColour } from '../../shared/utils/club-colour';

@Component({
  selector: 'app-clubs-strip',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="section-header">
      <span class="section-title">Run Clubs</span>
      <a class="section-link" routerLink="/clubs">See all</a>
    </div>
    <div class="clubs-carousel">
      @for (club of clubs; track club.id) {
        <a class="club-card" [routerLink]="['/clubs', club.id]">
          <div class="club-av" [style.background]="clubColour(club.id)">{{ club.name[0].toUpperCase() }}</div>
          <div class="club-name">{{ club.name }}</div>
          <div class="club-meta">{{ club.member_count }} members</div>
        </a>
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
    .section-link {
      font-size: 13px;
      font-weight: 500;
      color: var(--klub-green, #1D9E75);
      text-decoration: none;
    }
    .clubs-carousel {
      display: flex;
      gap: 12px;
      padding: 0 16px 24px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .clubs-carousel::-webkit-scrollbar { display: none; }
    .club-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
      cursor: pointer;
      text-decoration: none;
      width: 72px;
    }
    .club-av {
      width: 56px; height: 56px;
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 700; color: #fff;
      transition: transform 0.15s var(--ease-out, ease);
    }
    .club-card:active .club-av { transform: scale(0.93); }
    .club-name {
      font-size: 11px; font-weight: 600; color: var(--klub-black, #0D0D0D);
      text-align: center;
      max-width: 70px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .club-meta {
      font-size: 10px; color: var(--klub-muted, #6B6B68);
      text-align: center;
    }
  `]
})
export class ClubsStripComponent {
  @Input({ required: true }) clubs: Club[] = [];
  readonly clubColour = clubColour;
}
