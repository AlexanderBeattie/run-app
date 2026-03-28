import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
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
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search clubs..." (input)="onSearchInput()" (blur)="saveRecentSearch()" (keydown.enter)="saveRecentSearch()" />
          @if (searchQuery) {
            <button class="search-clear" (click)="clearSearch()">×</button>
          }
        </div>
        @if (!searchQuery && recentSearches().length > 0) {
          <div class="recent-chips">
            @for (q of recentSearches(); track q) {
              <button class="chip" (click)="applyRecent(q)">{{ q }}</button>
              <button class="chip-remove" (click)="removeRecent(q)">×</button>
            }
          </div>
        }
      </div>

      <div class="content">
        @if (errorMessage()) {
          <div class="error-banner">
            <div class="error-icon">⚠</div>
            <div>
              <div class="error-title">Unable to load clubs</div>
              <div class="error-text">{{ errorMessage() }}</div>
            </div>
            <button class="error-close" (click)="errorMessage.set(null)">×</button>
          </div>
        }

        @if (loading()) {
          <div class="loading">
            @for (i of [1,2,3]; track i) {
              <div class="skeleton-card">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-content">
                  <div class="skeleton-title"></div>
                  <div class="skeleton-text"></div>
                  <div class="skeleton-meta"></div>
                </div>
              </div>
            }
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
    .page { background: #F7F7F5; min-height: 100%; overflow-x: hidden; }
    .header { background: #0D0D0D; padding: 16px 16px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
    .title { font-size: 18px; font-weight: 500; color: #fff; }
    .subtitle { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
    .create-btn { font-size: 13px; font-weight: 500; color: #1D9E75; text-decoration: none; background: rgba(29,158,117,0.15); padding: 8px 12px; border-radius: 8px; white-space: nowrap; flex-shrink: 0; }
    .search-row { padding: 14px 12px 0; }
    .search-box { background: #fff; border: 0.5px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 10px 12px; display: flex; align-items: center; gap: 8px; }
    .search-box input { border: none; outline: none; font-size: 14px; font-family: inherit; flex: 1; background: transparent; color: #0D0D0D; min-width: 0; }
    .search-clear { background: none; border: none; font-size: 18px; color: rgba(0,0,0,0.3); cursor: pointer; padding: 0; line-height: 1; flex-shrink: 0; }
    .recent-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; align-items: center; }
    .chip { background: #fff; border: 0.5px solid rgba(0,0,0,0.12); border-radius: 999px; padding: 5px 10px; font-size: 12px; color: #6B6B68; font-family: inherit; cursor: pointer; }
    .chip-remove { background: none; border: none; font-size: 14px; color: rgba(0,0,0,0.25); cursor: pointer; padding: 0 2px; margin-left: -4px; font-family: inherit; }
    .content { padding: 14px 12px 24px; }

    /* ── Error banner ─────────────────────────────────────────── */
    .error-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin: 0 0 14px 0;
      background: #FCEBEB;
      border: 1px solid #E89999;
      border-radius: 12px;
      padding: 12px 14px;
    }
    .error-icon { font-size: 18px; flex-shrink: 0; }
    .error-title { font-size: 14px; font-weight: 600; color: #A32D2D; margin-bottom: 2px; }
    .error-text { font-size: 13px; color: #8B2828; }
    .error-close {
      background: none;
      border: none;
      color: #A32D2D;
      cursor: pointer;
      font-size: 20px;
      padding: 0;
      margin-left: auto;
      flex-shrink: 0;
    }

    /* ── Loading skeletons ──────────────────────────────────────── */
    .loading { display: flex; flex-direction: column; gap: 8px; }
    .skeleton-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff;
      border: 0.5px solid rgba(0,0,0,0.08);
      border-radius: 14px;
      padding: 14px;
    }
    .skeleton-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(0,0,0,0.06);
      flex-shrink: 0;
      animation: shimmer 1.6s ease-in-out infinite;
    }
    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .skeleton-title {
      height: 15px;
      background: rgba(0,0,0,0.06);
      border-radius: 4px;
      width: 60%;
      animation: shimmer 1.6s ease-in-out infinite;
    }
    .skeleton-text {
      height: 12px;
      background: rgba(0,0,0,0.04);
      border-radius: 3px;
      width: 40%;
      animation: shimmer 1.6s ease-in-out infinite;
    }
    .skeleton-meta {
      height: 11px;
      background: rgba(0,0,0,0.04);
      border-radius: 3px;
      width: 50%;
      animation: shimmer 1.6s ease-in-out infinite;
    }
    @keyframes shimmer {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.45; }
    }

    .empty { text-align: center; padding: 60px 20px; font-size: 14px; color: #9B9B98; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .club-card { display: flex; align-items: center; gap: 14px; background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 14px; padding: 14px; text-decoration: none; color: inherit; }
    .club-avatar { width: 44px; height: 44px; border-radius: 12px; background: #E1F5EE; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; color: #0F6E56; flex-shrink: 0; }
    .club-info { flex: 1; min-width: 0; }
    .club-name { font-size: 15px; font-weight: 500; color: #0D0D0D; margin-bottom: 2px; }
    .club-city { font-size: 12px; color: #6B6B68; margin-bottom: 4px; }
    .club-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #9B9B98; }
    .pace-tag { background: #F7F7F5; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; color: #6B6B68; text-transform: capitalize; }
    .club-right { text-align: right; flex-shrink: 0; }
    .next-run { font-size: 10px; color: #9B9B98; text-transform: uppercase; letter-spacing: 0.04em; }
    .next-date { font-size: 13px; font-weight: 500; color: #1D9E75; }
  `]
})
export class ClubListComponent implements OnInit {
    clubService = inject(ClubService);
    auth = inject(AuthService);
    cdr = inject(ChangeDetectorRef);
    private static readonly STORAGE_KEY = 'klub_recent_searches';
    private static readonly MAX_RECENT = 5;

    clubs: Club[] = [];
    filteredClubs: Club[] = [];
    searchQuery = '';
    loaded = false;
    loading = signal(false);
    errorMessage = signal<string | null>(null);
    recentSearches = signal<string[]>([]);

    ngOnInit() {
        this.recentSearches.set(this.loadRecentSearches());
        this.loading.set(true);
        this.clubService.listClubs().subscribe({
            next: (data) => {
                this.clubs = data;
                this.filteredClubs = data;
                this.loaded = true;
                this.loading.set(false);
                this.errorMessage.set(null);
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.loaded = true;
                this.loading.set(false);
                this.errorMessage.set('Failed to load clubs. Please try again.');
                this.cdr.markForCheck();
            }
        });
    }

    onSearchInput() {
        this.filterClubs();
    }

    filterClubs() {
        const q = this.searchQuery.toLowerCase().trim();
        if (!q) { this.filteredClubs = this.clubs; return; }
        this.filteredClubs = this.clubs.filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.city?.toLowerCase().includes(q) ?? false) ||
            (c.pace?.toLowerCase().includes(q) ?? false) ||
            (c.tags?.some(t => t.toLowerCase().includes(q)) ?? false)
        );
    }

    saveRecentSearch() {
        const q = this.searchQuery.trim();
        if (!q) return;
        const updated = [q, ...this.loadRecentSearches().filter(r => r !== q)]
            .slice(0, ClubListComponent.MAX_RECENT);
        localStorage.setItem(ClubListComponent.STORAGE_KEY, JSON.stringify(updated));
        this.recentSearches.set(updated);
    }

    applyRecent(q: string) {
        this.searchQuery = q;
        this.filterClubs();
    }

    removeRecent(q: string) {
        const updated = this.loadRecentSearches().filter(r => r !== q);
        localStorage.setItem(ClubListComponent.STORAGE_KEY, JSON.stringify(updated));
        this.recentSearches.set(updated);
    }

    clearSearch() {
        this.searchQuery = '';
        this.filterClubs();
    }

    private loadRecentSearches(): string[] {
        try {
            return JSON.parse(localStorage.getItem(ClubListComponent.STORAGE_KEY) ?? '[]');
        } catch {
            return [];
        }
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