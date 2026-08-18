import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Club } from '../../core/models/run-event.model';
import { clubColour } from '../../shared/utils/club-colour';

@Component({
  selector: 'app-featured-clubs',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="section-header">
      <span class="section-title">Featured Clubs</span>
      <a class="section-link" routerLink="/clubs">See all</a>
    </div>
    <div class="featured-clubs-row">
      @for (club of clubs; track club.id) {
        <a class="fc-card" [routerLink]="['/clubs', club.id]">
          <div class="fc-av" [style.background]="clubColour(club.id)">{{ club.name[0].toUpperCase() }}</div>
          <div class="fc-info">
            <div class="fc-name">{{ club.name }}</div>
            <div class="fc-meta">{{ club.member_count }} members</div>
            @if (club.pace) {
              <span class="fc-pace">{{ club.pace }}</span>
            }
          </div>
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
    .featured-clubs-row {
      display: flex;
      gap: 10px;
      padding: 0 16px 24px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .featured-clubs-row::-webkit-scrollbar { display: none; }
    .fc-card {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      background: #fff;
      border-radius: 14px;
      padding: 10px 14px;
      text-decoration: none;
      box-shadow: var(--shadow-card, 0 1px 4px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05));
      min-width: 160px;
      transition: transform 0.2s var(--ease-out, ease), box-shadow 0.2s var(--ease-out, ease);
    }
    .fc-card:active { transform: scale(0.97); }
    @media (hover: hover) {
      .fc-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover, 0 10px 28px rgba(13,13,12,0.10)); }
    }
    .fc-av {
      width: 40px; height: 40px;
      border-radius: 12px;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; color: #fff;
    }
    .fc-info { min-width: 0; }
    .fc-name {
      font-size: 13px; font-weight: 600; color: var(--klub-black, #0D0D0D);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .fc-meta { font-size: 11px; color: var(--klub-muted, #6B6B68); margin-top: 1px; }
    .fc-pace {
      display: inline-block;
      margin-top: 4px;
      font-size: 10px; font-weight: 600;
      background: var(--klub-green-light, #E1F5EE); color: var(--klub-green-dark, #0F6E56);
      border-radius: var(--radius-pill, 999px); padding: 2px 8px;
      text-transform: capitalize;
    }
  `]
})
export class FeaturedClubsComponent {
  @Input({ required: true }) clubs: Club[] = [];
  readonly clubColour = clubColour;
}
