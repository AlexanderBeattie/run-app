import { Component, inject, OnInit, ChangeDetectorRef, signal, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { ClubService } from '../../core/services/club.service';
import { ToastService } from '../../shared/services/toast.service';
import { RunCardComponent } from '../../shared/components/run-card/run-card.component';
import { RunDetailDialogComponent } from '../../shared/components/run-detail-dialog/run-detail-dialog.component';
import { RunEvent, Club } from '../../core/models/run-event.model';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RunCardComponent, RunDetailDialogComponent, RouterLink, FormsModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <div class="location-row">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path d="M6 0C3.24 0 1 2.18 1 4.86 1 8.5 6 14 6 14s5-5.5 5-9.14C11 2.18 8.76 0 6 0zm0 6.6a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5z" fill="#1D9E75"/>
            </svg>
            <span class="location-label">London</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="#9B9B98" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="greeting">Good {{ timeOfDay }}, {{ firstName }}</div>
        </div>
        <button class="icon-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" stroke-width="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
      </div>

      <!-- Search -->
      <div class="search-row">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9B98" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search runs, clubs, areas..." />
        </div>
        <button class="filter-btn" [class.active]="hasActiveFilters">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Category tiles -->
      <div class="categories">
        @for (cat of categories; track cat.label) {
          <div class="cat-wrap" (click)="setCategory(cat)">
            <div class="cat-tile" [class.cat-active]="activeCategory === cat.label" [style.background]="cat.bg">
              <span class="cat-emoji">{{ cat.emoji }}</span>
            </div>
            <div class="cat-label" [class.label-active]="activeCategory === cat.label">{{ cat.label }}</div>
          </div>
        }
      </div>

      <!-- Clubs carousel -->
      @if (clubs().length > 0) {
        <div class="section-header">
          <span class="section-title">Run Clubs</span>
          <a class="section-link" routerLink="/clubs">See all</a>
        </div>
        <div class="clubs-carousel">
          @for (club of clubs(); track club.id) {
            <a class="club-card" [routerLink]="['/clubs', club.id]">
              <div class="club-av" [style.background]="clubColor(club.id)">{{ club.name[0].toUpperCase() }}</div>
              <div class="club-name">{{ club.name }}</div>
              <div class="club-meta">{{ club.member_count }} members</div>
            </a>
          }
        </div>
      }

      <!-- Trending carousel -->
      @if (trendingRuns().length > 0) {
        <div class="section-header">
          <span class="section-title">🔥 Trending</span>
        </div>
        <div class="h-carousel">
          @for (run of trendingRuns(); track run.id) {
            <div class="h-card" (click)="openDialog(run)">
              <div class="h-banner" [style.background]="gradientForPace(run.pace)">
                <div class="h-dist">{{ run.distanceKm }}km</div>
                <div class="h-going">{{ run.attendees.length }} going</div>
              </div>
              <div class="h-body">
                <div class="h-title">{{ run.title }}</div>
                <div class="h-date">{{ runsService.formatDate(run.date) }}</div>
              </div>
            </div>
          }
        </div>
      }

      <!-- This weekend carousel -->
      @if (weekendRuns().length > 0) {
        <div class="section-header">
          <span class="section-title">📅 This Weekend</span>
        </div>
        <div class="h-carousel">
          @for (run of weekendRuns(); track run.id) {
            <div class="h-card" (click)="openDialog(run)">
              <div class="h-banner" [style.background]="gradientForPace(run.pace)">
                <div class="h-dist">{{ run.distanceKm }}km</div>
                <div class="h-going">{{ run.attendees.length }} going</div>
              </div>
              <div class="h-body">
                <div class="h-title">{{ run.title }}</div>
                <div class="h-date">{{ runsService.formatDate(run.date) }}</div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error message -->
      @if (errorMessage()) {
        <div class="error-banner">
          <div class="error-icon">⚠</div>
          <div>
            <div class="error-title">Unable to load runs</div>
            <div class="error-text">{{ errorMessage() }}</div>
          </div>
          <button class="error-close" (click)="errorMessage.set(null)">×</button>
        </div>
      }

      <!-- Feed header with My Clubs toggle -->
      <div class="feed-header">
        <div class="feed-header-top">
          @if (loaded) {
            <span class="feed-count">{{ runsService.getRuns()().length }} runs near you</span>
          } @else {
            <span class="feed-count">Finding runs...</span>
          }
          <div class="feed-toggle">
            <button class="toggle-btn" [class.toggle-active]="feedMode() === 'all'" (click)="setFeedMode('all')">All</button>
            <button class="toggle-btn" [class.toggle-active]="feedMode() === 'mine'" (click)="setFeedMode('mine')">My Clubs</button>
          </div>
        </div>
      </div>

      <div class="feed-surface">
        @if (!loaded) {
          @for (i of [1,2,3]; track i) {
            <div class="skeleton"></div>
          }
        } @else if (runsService.getRuns()().length === 0) {
          <div class="empty">
            <div class="empty-icon">🏃</div>
            <div class="empty-title">No runs found</div>
            <div class="empty-sub">Try a different filter or check back soon</div>
          </div>
        } @else {
          @for (run of runsService.getRuns()(); track run.id) {
            <app-run-card
              [run]="run"
              [isJoined]="runsService.getJoinedRunIds()().includes(run.id)"
              (cardClick)="openDialog(run)"
              (joinToggle)="onJoin($event)" />
          }
        }
      </div>

    </div>

    @if (selectedRun()) {
      <app-run-detail-dialog
        [run]="selectedRun()!"
        [isJoined]="runsService.getJoinedRunIds()().includes(selectedRun()!.id)"
        (close)="selectedRun.set(null)"
        (join)="onJoin($event)" />
    }
  `,
  styles: [`
    .page { background: #fff; min-height: 100%; }

    /* ── Header ─────────────────────────────────────────────── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 20px 14px;
    }
    .location-row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 5px;
    }
    .location-label {
      font-size: 13px;
      font-weight: 500;
      color: #0D0D0D;
    }
    .greeting {
      font-size: 22px;
      font-weight: 700;
      color: #0D0D0D;
      letter-spacing: -0.3px;
    }
    .icon-btn {
      background: #F7F7F5;
      border: none;
      width: 40px; height: 40px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      margin-top: 2px;
    }

    /* ── Search ─────────────────────────────────────────────── */
    .search-row {
      display: flex;
      gap: 10px;
      padding: 0 16px 18px;
    }
    .search-box {
      flex: 1;
      background: #F7F7F5;
      border-radius: 14px;
      padding: 13px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .search-box input {
      border: none;
      outline: none;
      background: transparent;
      color: #0D0D0D;
      font-size: 14px;
      font-family: inherit;
      flex: 1;
    }
    .search-box input::placeholder { color: #B0B0AE; }
    .filter-btn {
      background: #F7F7F5;
      border: none;
      width: 50px; height: 50px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      color: #0D0D0D;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .filter-btn.active { background: #0D0D0D; color: #fff; }

    /* ── Category tiles ─────────────────────────────────────── */
    .categories {
      display: flex;
      gap: 12px;
      padding: 0 16px 22px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .categories::-webkit-scrollbar { display: none; }

    .cat-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .cat-tile {
      width: 72px; height: 72px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s ease;
    }
    .cat-tile:active { transform: scale(0.93); }
    .cat-tile.cat-active {
      box-shadow: 0 0 0 3px #fff, 0 0 0 5px #0D0D0D;
    }

    .cat-emoji { font-size: 30px; line-height: 1; }

    .cat-label {
      font-size: 12px;
      font-weight: 500;
      color: #9B9B98;
      white-space: nowrap;
    }
    .cat-label.label-active {
      color: #0D0D0D;
      font-weight: 700;
    }

    /* ── Section headers ─────────────────────────────────────── */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px 12px;
    }
    .section-title {
      font-size: 17px;
      font-weight: 700;
      color: #0D0D0D;
      letter-spacing: -0.2px;
    }
    .section-link {
      font-size: 13px;
      font-weight: 500;
      color: #1D9E75;
      text-decoration: none;
    }

    /* ── Clubs carousel ─────────────────────────────────────── */
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
    }
    .club-name {
      font-size: 11px; font-weight: 600; color: #0D0D0D;
      text-align: center;
      max-width: 70px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .club-meta {
      font-size: 10px; color: #9B9B98;
      text-align: center;
    }

    /* ── Horizontal run carousel ─────────────────────────────── */
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
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 6px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06);
      cursor: pointer;
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
      border-radius: 999px;
      padding: 3px 9px;
      font-size: 12px; font-weight: 600;
    }
    .h-going {
      font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.9);
    }
    .h-body { padding: 10px 10px 12px; }
    .h-title {
      font-size: 13px; font-weight: 600; color: #0D0D0D;
      margin-bottom: 3px;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .h-date { font-size: 11px; color: #9B9B98; }

    /* ── Feed ───────────────────────────────────────────────── */
    .feed-header { padding: 0 20px 14px; }
    .feed-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .feed-count {
      font-size: 17px;
      font-weight: 700;
      color: #0D0D0D;
      letter-spacing: -0.2px;
    }

    .feed-toggle {
      display: flex;
      gap: 2px;
      background: #F7F7F5;
      border-radius: 999px;
      padding: 3px;
    }
    .toggle-btn {
      background: none;
      border: none;
      border-radius: 999px;
      padding: 5px 12px;
      font-size: 12px; font-weight: 500;
      color: #9B9B98;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s, color 0.15s;
    }
    .toggle-btn.toggle-active {
      background: #fff;
      color: #0D0D0D;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .feed-surface {
      background: #F7F7F5;
      border-radius: 24px 24px 0 0;
      padding: 16px 14px 120px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 300px;
    }

    .skeleton {
      height: 220px;
      background: rgba(0,0,0,0.05);
      border-radius: 18px;
      animation: shimmer 1.6s ease-in-out infinite;
    }
    @keyframes shimmer {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.45; }
    }

    .empty {
      text-align: center;
      padding: 60px 20px;
    }
    .empty-icon { font-size: 40px; margin-bottom: 12px; }
    .empty-title { font-size: 16px; font-weight: 600; color: #0D0D0D; margin-bottom: 6px; }
    .empty-sub { font-size: 14px; color: #9B9B98; }

    /* ── Error banner ─────────────────────────────────────────── */
    .error-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin: 14px 16px;
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
  `]
})
export class HomeComponent implements OnInit {
  runsService = inject(RunsService);
  auth = inject(AuthService);
  clubService = inject(ClubService);
  toast = inject(ToastService);
  cdr = inject(ChangeDetectorRef);
  destroyRef = inject(DestroyRef);

  selectedRun = signal<RunEvent | null>(null);
  errorMessage = signal<string | null>(null);
  trendingRuns = signal<RunEvent[]>([]);
  weekendRuns = signal<RunEvent[]>([]);
  clubs = signal<Club[]>([]);
  feedMode = signal<'all' | 'mine'>('all');
  loaded = false;
  searchQuery = '';
  activeCategory = 'All';

  private searchSubject = new Subject<string>();
  private currentParams: any = {};

  private readonly clubColours = [
    '#1D9E75', '#3B82F6', '#F59E0B', '#EC4899',
    '#8B5CF6', '#EF4444', '#10B981', '#6366F1',
  ];

  categories = [
    { label: 'All',      emoji: '🏃', bg: '#0D0D0D', params: {} },
    { label: '5K',       emoji: '🎯', bg: '#3B82F6', params: { tags: '5k' } },
    { label: 'Trail',    emoji: '🌲', bg: '#10B981', params: { tags: 'trail' } },
    { label: 'Race',     emoji: '🏅', bg: '#F59E0B', params: { tags: 'race' } },
    { label: 'Social',   emoji: '👥', bg: '#EC4899', params: { pace: 'social' } },
    { label: 'Shakeout', emoji: '🌿', bg: '#1D9E75', params: { tags: 'shakeout' } },
    { label: 'Easy',     emoji: '😌', bg: '#6366F1', params: { pace: 'easy' } },
    { label: 'Fast',     emoji: '⚡', bg: '#EF4444', params: { pace: 'fast' } },
  ];

  get timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  get firstName(): string {
    return (this.auth.getUser()()?.displayName ?? 'there').split(' ')[0];
  }

  get hasActiveFilters(): boolean {
    return this.activeCategory !== 'All' || !!this.searchQuery;
  }

  ngOnInit() {
    this.loadWithParams();
    this.loadCarousels();
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(q => {
      this.currentParams = { ...this.currentParams, search: q || undefined };
      this.loadWithParams();
    });
  }

  private loadCarousels() {
    this.clubService.listClubs().subscribe({ next: clubs => this.clubs.set(clubs.slice(0, 12)), error: (e) => console.error('Failed to load clubs carousel', e) });

    this.runsService.fetchRuns({ trending: true }).subscribe({ next: runs => this.trendingRuns.set(runs.slice(0, 8)), error: (e) => console.error('Failed to load trending runs', e) });

    const { dateFrom, dateTo } = this.getWeekendDates();
    this.runsService.fetchRuns({ date_from: dateFrom, date_to: dateTo }).subscribe({ next: runs => this.weekendRuns.set(runs.slice(0, 8)), error: (e) => console.error('Failed to load weekend runs', e) });
  }

  private getWeekendDates(): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const day = now.getDay();
    const daysToSat = day === 6 ? 0 : (6 - day);
    const sat = new Date(now);
    sat.setDate(now.getDate() + daysToSat);
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { dateFrom: fmt(sat), dateTo: fmt(sun) };
  }

  onSearchChange(q: string) {
    this.searchSubject.next(q);
  }

  setCategory(cat: { label: string; params: any }) {
    this.activeCategory = cat.label;
    this.currentParams = { ...cat.params };
    if (this.searchQuery) this.currentParams.search = this.searchQuery;
    this.loadWithParams();
  }

  setFeedMode(mode: 'all' | 'mine') {
    this.feedMode.set(mode);
    if (mode === 'mine') {
      this.clubService.getMineClubs().subscribe({
        next: myClubs => {
          if (myClubs.length === 0) {
            this.runsService.loadRuns({ ...this.currentParams });
          } else {
            const clubIds = myClubs.map(c => c.id).join(',');
            this.runsService.loadRuns({ ...this.currentParams, club_ids: clubIds });
          }
          setTimeout(() => { this.loaded = true; this.cdr.markForCheck(); }, 400);
        },
        error: () => this.loadWithParams()
      });
      this.loaded = false;
    } else {
      this.loadWithParams();
    }
  }

  private loadWithParams() {
    this.loaded = false;
    this.runsService.loadRuns(this.currentParams);
    setTimeout(() => { this.loaded = true; this.cdr.markForCheck(); }, 600);
  }

  openDialog(run: RunEvent) { this.selectedRun.set(run); }

  onJoin(runId: string) {
    this.runsService.toggleJoin(runId, this.auth.getUser()()?.id ?? 'guest');
    const isJoined = this.runsService.getJoinedRunIds()().includes(runId);
    this.toast.show(isJoined ? 'Left the run' : "You're in!");
  }

  gradientForPace(pace?: string): string {
    const g: Record<string, string> = {
      easy:     'linear-gradient(135deg, #1D9E75 0%, #0a5c42 100%)',
      social:   'linear-gradient(135deg, #10B981 0%, #065f46 100%)',
      moderate: 'linear-gradient(135deg, #3B82F6 0%, #1e3a8a 100%)',
      fast:     'linear-gradient(135deg, #EF4444 0%, #7f1d1d 100%)',
      tempo:    'linear-gradient(135deg, #F59E0B 0%, #78350f 100%)',
    };
    return g[pace ?? ''] ?? 'linear-gradient(135deg, #1D9E75 0%, #0D0D0D 100%)';
  }

  clubColor(clubId: string): string {
    let hash = 0;
    for (let i = 0; i < clubId.length; i++) { hash = (hash * 31 + clubId.charCodeAt(i)) >>> 0; }
    return this.clubColours[hash % this.clubColours.length];
  }
}
