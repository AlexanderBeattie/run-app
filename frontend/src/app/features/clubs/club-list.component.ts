import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClubService } from '../../core/services/club.service';
import { AuthService } from '../../core/services/auth.service';
import { Club } from '../../core/models/run-event.model';

@Component({
    selector: 'app-club-list',
    standalone: true,
    imports: [RouterLink, FormsModule],
    template: `
    <div class="page">
      <div class="header">
        <div>
          <div class="title">Clubs</div>
          <div class="subtitle">{{ filteredClubs.length }} clubs near you</div>
        </div>
        @if (auth.isOrganizer()) {
          <a routerLink="/clubs/create" class="create-btn">+ New club</a>
        }
      </div>

      <div class="search-row">
        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search clubs..." (input)="filterClubs()" />
        </div>
      </div>

      <div class="content">
        @if (!loaded) {
          <div class="loading">
            @for (i of [1,2,3]; track i) { <div class="skeleton"></div> }
          </div>
        } @else if (filteredClubs.length === 0) {
          <div class="empty">No clubs found. Check back soon!</div>
        } @else {
          <div class="list">
            @for (club of filteredClubs; track club.id) {
              <a [routerLink]="['/clubs', club.id]" class="club-card">
                <div class="club-avatar">{{ club.name[0]?.toUpperCase() }}</div>
                <div class="club-info">
                  <div class="club-name">{{ club.name }}</div>
                  @if (club.city) { <div class="club-city">{{ club.city }}</div> }
                  <div class="club-meta">
                    <span>{{ club.member_count }} members</span>
                    @if (club.pace) { <span class="pace-tag">{{ club.pace }}</span> }
                  </div>
                </div>
                <div class="club-right">
                  @if (club.next_run_date) {
                    <div class="next-run">Next run</div>
                    <div class="next-date">{{ formatDate(club.next_run_date) }}</div>
                  }
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .page { background: #F7F7F5; min-height: 100%; }
    .header { background: #0D0D0D; padding: 16px 20px 18px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 18px; font-weight: 500; color: #fff; }
    .subtitle { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
    .create-btn { font-size: 13px; font-weight: 500; color: #1D9E75; text-decoration: none; background: rgba(29,158,117,0.15); padding: 8px 14px; border-radius: 8px; }
    .search-row { padding: 14px 16px 0; }
    .search-box { background: #fff; border: 0.5px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
    .search-box input { border: none; outline: none; font-size: 14px; font-family: inherit; flex: 1; background: transparent; color: #0D0D0D; }
    .content { padding: 14px 12px 24px; }
    .loading { display: flex; flex-direction: column; gap: 10px; }
    .skeleton { height: 80px; background: rgba(0,0,0,0.06); border-radius: 14px; }
    .empty { text-align: center; padding: 60px 20px; font-size: 14px; color: #9B9B98; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .club-card { display: flex; align-items: center; gap: 14px; background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 14px; padding: 14px; text-decoration: none; color: inherit; }
    .club-avatar { width: 44px; height: 44px; border-radius: 12px; background: #E1F5EE; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; color: #0F6E56; flex-shrink: 0; }
    .club-info { flex: 1; min-width: 0; }
    .club-name { font-size: 15px; font-weight: 500; color: #0D0D0D; margin-bottom: 2px; }
    .club-city { font-size: 12px; color: #6B6B68; margin-bottom: 4px; }
    .club-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #9B9B98; }
    .pace-tag { background: #F7F7F5; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; color: #6B6B68; }
    .club-right { text-align: right; flex-shrink: 0; }
    .next-run { font-size: 10px; color: #9B9B98; text-transform: uppercase; letter-spacing: 0.04em; }
    .next-date { font-size: 13px; font-weight: 500; color: #1D9E75; }
  `]
})
export class ClubListComponent implements OnInit {
    clubService = inject(ClubService);
    auth = inject(AuthService);
    cdr = inject(ChangeDetectorRef);
    clubs: Club[] = [];
    filteredClubs: Club[] = [];
    searchQuery = '';
    loaded = false;

    ngOnInit() {
        this.clubService.listClubs().subscribe(data => {
            this.clubs = data;
            this.filteredClubs = data;
            this.loaded = true;
            this.cdr.markForCheck();
        });
    }

    filterClubs() {
        const q = this.searchQuery.toLowerCase().trim();
        if (!q) { this.filteredClubs = this.clubs; return; }
        this.filteredClubs = this.clubs.filter(c =>
            c.name.toLowerCase().includes(q) || (c.city?.toLowerCase().includes(q) ?? false)
        );
    }

    formatDate(dateStr: string) {
        const d = new Date(dateStr);
        const diff = d.getTime() - Date.now();
        const days = Math.floor(diff / 86400000);
        if (days <= 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }
}