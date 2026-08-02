import { Component, inject, OnInit, ChangeDetectorRef, signal, computed, DestroyRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { ClubService } from '../../core/services/club.service';
import { ToastService } from '../../shared/services/toast.service';
import { GeoService } from '../../core/services/geo.service';
import { Coordinates } from '../../core/models/run-event.model';
import { RunCardComponent } from '../../shared/components/run-card/run-card.component';
import { RunDetailDialogComponent } from '../../shared/components/run-detail-dialog/run-detail-dialog.component';
import { OnboardingComponent, OnboardingPrefs } from '../onboarding/onboarding.component';
import { LocationWelcomeModalComponent } from '../../shared/components/location-welcome-modal/location-welcome-modal.component';
import { FirstRunCtaBlockComponent } from '../../shared/components/first-run-cta-block/first-run-cta-block.component';
import { GeolocationService } from '../../core/services/geolocation.service';
import { RunEvent, Club } from '../../core/models/run-event.model';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { RunMiniCarouselComponent } from './run-mini-carousel.component';
import { CategoryTilesComponent, HomeCategory } from './category-tiles.component';
import { ClubsStripComponent } from './clubs-strip.component';
import { FeaturedClubsComponent } from './featured-clubs.component';
import { gradientForPace } from '../../shared/utils/run-pace';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RunCardComponent, RunDetailDialogComponent, OnboardingComponent, LocationWelcomeModalComponent,
    FirstRunCtaBlockComponent, FormsModule,
    RunMiniCarouselComponent, CategoryTilesComponent, ClubsStripComponent, FeaturedClubsComponent,
  ],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <div class="location-row">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path d="M6 0C3.24 0 1 2.18 1 4.86 1 8.5 6 14 6 14s5-5.5 5-9.14C11 2.18 8.76 0 6 0zm0 6.6a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5z" fill="#1D9E75"/>
            </svg>
            <span class="location-label">{{ locationLabel() }}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="#6B6B68" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B68" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            (focus)="onSearchFocus()"
            placeholder="Search runs, clubs, areas..." />
        </div>
        <button class="filter-btn" [class.active]="hasActiveFilters">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
        </button>

        <!-- Search dropdown -->
        @if (showDropdown() && searchResults().length > 0) {
          <div class="search-dropdown">
            @for (result of searchResults(); track result.id) {
              <div class="search-result-row" (click)="onSelectSearchResult(result)">
                <div class="sr-left">
                  <div class="sr-icon" [style.background]="gradientForPace(result.pace)"></div>
                  <div class="sr-info">
                    <div class="sr-title">{{ result.title }}</div>
                    <div class="sr-meta">{{ runsService.formatDate(result.date) }} · {{ result.distanceKm }}km</div>
                  </div>
                </div>
                <div class="sr-pace" [class]="'sr-pace-' + (result.pace ?? 'default')">{{ result.pace ?? '' }}</div>
              </div>
            }
          </div>
        }
        @if (showDropdown() && searchQuery.length >= 2 && searchResults().length === 0 && !searchLoading()) {
          <div class="search-dropdown search-dropdown-empty">
            <div class="sr-empty">No runs found for "{{ searchQuery }}"</div>
          </div>
        }
      </div>

      <!-- Category tiles -->
      <app-category-tiles [categories]="categories" [active]="activeCategory" (select)="setCategory($event)" />

      <!-- Clubs carousel -->
      @if (clubs().length > 0) {
        <app-clubs-strip [clubs]="clubs()" />
      }

      <!-- Trending carousel -->
      @if (trendingRuns().length > 0) {
        <app-run-mini-carousel title="🔥 Trending" [runs]="trendingRuns()" (runClick)="openDialog($event)" />
      }

      <!-- This weekend carousel -->
      @if (weekendRuns().length > 0) {
        <app-run-mini-carousel title="📅 This Weekend" [runs]="weekendRuns()" (runClick)="openDialog($event)" />
      }

      <!-- Featured clubs -->
      @if (featuredClubs().length > 0) {
        <app-featured-clubs [clubs]="featuredClubs()" />
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
            <span class="feed-count">
              @if (nearMeEnabled()) {
                {{ feedRuns().length }} within {{ radiusMiles() }}mi
              } @else {
                {{ feedRuns().length }} runs
              }
            </span>
          } @else {
            <span class="feed-count">Finding runs...</span>
          }
          <div class="feed-toggle">
            <button class="toggle-btn" [class.toggle-active]="feedMode() === 'all'" (click)="setFeedMode('all')">All</button>
            <button class="toggle-btn" [class.toggle-active]="feedMode() === 'mine'" (click)="setFeedMode('mine')">My Clubs</button>
          </div>
        </div>

        <!-- Near Me toggle row -->
        <div class="near-me-row">
          <button class="near-me-btn" [class.near-me-active]="nearMeEnabled()" (click)="toggleNearMe()">
            Near Me
          </button>
          @if (nearMeEnabled()) {
            <div class="radius-control">
              <input class="radius-slider" type="range" min="1" max="25" step="1"
                [value]="radiusMiles()"
                (input)="setRadius(+$any($event.target).value)" />
              <span class="radius-label">{{ radiusMiles() }} mi</span>
            </div>
          }
        </div>

        <!-- Run type filter pills -->
        <div class="type-pills-row">
          <button class="type-pill" [class.active]="activeRunType() === null" aria-label="Show all run types" (click)="setRunType(null)">All</button>
          @for (t of runTypePills; track t.value) {
            <button class="type-pill" [class.active]="activeRunType() === t.value" [attr.aria-label]="'Filter by ' + t.label" (click)="setRunType(t.value)">
              {{ t.emoji }} {{ t.label }}
            </button>
          }
        </div>

        <!-- Pace filter pills -->
        <div class="pace-pills-row">
          <button class="pace-pill" [class.pace-active]="activePace() === null" aria-label="Show all paces" (click)="setPace(null)">All paces</button>
          @for (p of pacePills; track p.value) {
            <button class="pace-pill"
              [class.pace-active]="activePace() === p.value"
              [style.background]="activePace() === p.value ? p.color : ''"
              [style.borderColor]="activePace() === p.value ? p.color : ''"
              [style.color]="activePace() === p.value ? '#fff' : ''"
              [attr.aria-label]="p.label + ' pace · ' + p.effort"
              (click)="setPace(p.value)">
              {{ p.label }}
            </button>
          }
        </div>
      </div>

      <div class="feed-surface">
        @if (showFirstRunCta()) {
          <app-first-run-cta-block
            [runs]="nearbyRuns()"
            (runClick)="openDialog($event)"
            (dismissed)="showFirstRunCta.set(false)" />
        }

        @if (!loaded) {
          @for (i of [1,2,3]; track i) {
            <div class="skeleton"></div>
          }
        } @else if (feedRuns().length === 0) {
          <div class="empty">
            <div class="empty-icon">🏃</div>
            <div class="empty-title">No runs found</div>
            <div class="empty-sub">Try a different filter or check back soon</div>
            @if (hasFiltersToClear) {
              <button class="empty-btn" (click)="clearAllFilters()">Clear all filters</button>
            }
          </div>
        } @else {
          @if (activeTag()) {
            <div class="active-tag-row">
              <span class="active-tag-chip">#{{ activeTag() }}</span>
              <button class="clear-tag-btn" (click)="setActiveTag(null)">✕ Clear filter</button>
            </div>
          }
          @for (run of feedRuns(); track run.id) {
            <app-run-card
              [run]="run"
              [isJoined]="runsService.getJoinedRunIds()().includes(run.id)"
              [activeTag]="activeTag()"
              (cardClick)="openDialog(run)"
              (joinToggle)="onJoin($event)"
              (tagClick)="setActiveTag($event)" />
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

    @if (showOnboarding()) {
      <app-onboarding (complete)="onOnboardingComplete($event)" />
    }

    @if (showLocationModal()) {
      <app-location-welcome-modal
        (locationGranted)="onLocationGranted()"
        (dismissed)="showLocationModal.set(false)" />
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
      position: relative;
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
    .search-box input::placeholder { color: #6B6B68; }
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

    /* ── Search dropdown ─────────────────────────────────────── */
    .search-dropdown {
      position: absolute;
      top: calc(100% - 10px);
      left: 16px;
      right: 76px;
      background: #fff;
      border-radius: 14px;
      box-shadow: var(--shadow-overlay, 0 8px 32px rgba(13,13,12,0.16)), 0 0 0 0.5px rgba(0,0,0,0.08);
      z-index: 200;
      overflow: hidden;
    }
    .search-dropdown-empty {
      padding: 16px;
    }
    .sr-empty {
      font-size: 13px;
      color: #6B6B68;
      text-align: center;
    }
    .search-result-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      cursor: pointer;
      border-bottom: 0.5px solid rgba(0,0,0,0.06);
      transition: background 0.1s;
    }
    .search-result-row:last-child { border-bottom: none; }
    .search-result-row:active { background: #F7F7F5; }
    .sr-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }
    .sr-icon {
      width: 32px; height: 32px;
      border-radius: 10px;
      flex-shrink: 0;
    }
    .sr-info { min-width: 0; }
    .sr-title {
      font-size: 14px;
      font-weight: 500;
      color: #0D0D0D;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sr-meta {
      font-size: 12px;
      color: #6B6B68;
      margin-top: 1px;
    }
    .sr-pace {
      font-size: 10px;
      font-weight: 600;
      border-radius: 999px;
      padding: 2px 8px;
      text-transform: capitalize;
      flex-shrink: 0;
      margin-left: 8px;
    }
    .sr-pace-easy, .sr-pace-social { background: #E1F5EE; color: #0F6E56; }
    .sr-pace-moderate { background: #EFF6FF; color: #1e3a8a; }
    .sr-pace-fast, .sr-pace-tempo { background: #FEF2F2; color: #7f1d1d; }
    .sr-pace-default { display: none; }

    /* ── Feed ───────────────────────────────────────────────── */
    .feed-header { padding: 0 20px 14px; }

    .type-pills-row, .pace-pills-row {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding: 12px 20px 0;
      margin: 0 -20px;
    }
    .pace-pills-row { padding-top: 10px; }
    .type-pills-row::-webkit-scrollbar, .pace-pills-row::-webkit-scrollbar { display: none; }

    .active-tag-row {
      display: flex; align-items: center; gap: 8px;
      padding: 0 20px 12px;
    }
    .active-tag-chip {
      font-size: 12px; font-weight: 600;
      background: #0F6E56; color: #fff;
      border-radius: 999px; padding: 4px 12px;
    }
    .clear-tag-btn {
      font-size: 12px; font-weight: 500; color: #6B6B68;
      background: #F7F7F5; border: none; border-radius: 999px;
      padding: 4px 10px; cursor: pointer; font-family: inherit;
    }
    .clear-tag-btn:hover { background: #EAEAE8; }

    .pace-pill, .type-pill, .near-me-btn {
      flex-shrink: 0;
      background: #F7F7F5;
      border: 1.5px solid transparent;
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 13px; font-weight: 500;
      color: #6B6B68;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.12s, color 0.12s, border-color 0.12s;
      white-space: nowrap;
    }
    .pace-pill.pace-active {
      border-color: currentColor;
    }
    .type-pill.active {
      background: #0D0D0D;
      color: #fff;
      border-color: #0D0D0D;
    }
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
      color: #6B6B68;
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
      border-radius: var(--radius-sheet, 24px) var(--radius-sheet, 24px) 0 0;
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
      padding: 48px 20px 56px;
    }
    .empty-icon {
      font-size: 34px; line-height: 1;
      width: 76px; height: 76px;
      margin: 0 auto 16px;
      background: var(--klub-green-light, #E1F5EE);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .empty-title { font-size: 17px; font-weight: 700; color: #0D0D0D; margin-bottom: 6px; letter-spacing: -0.01em; }
    .empty-sub { font-size: 14px; color: #6B6B68; }
    .empty-btn {
      margin-top: 18px;
      background: var(--klub-black, #0D0D0D); color: #fff;
      border: none; border-radius: var(--radius-pill, 999px);
      padding: 11px 22px; min-height: 44px;
      font-size: 14px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: transform 0.15s var(--ease-out, ease-out);
    }
    .empty-btn:active { transform: scale(0.96); }

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

    /* ── Near Me ─────────────────────────────────────────────── */
    .near-me-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-top: 10px;
    }
    .near-me-btn.near-me-active {
      background: #E1F5EE;
      color: #0F6E56;
      border-color: #1D9E75;
    }
    .radius-control {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    .radius-slider {
      flex: 1;
      accent-color: #1D9E75;
      cursor: pointer;
    }
    .radius-label {
      font-size: 12px;
      font-weight: 600;
      color: #0F6E56;
      min-width: 32px;
      text-align: right;
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
  private http = inject(HttpClient);
  private geoService = inject(GeoService);
  private geolocationService = inject(GeolocationService);

  selectedRun = signal<RunEvent | null>(null);
  errorMessage = signal<string | null>(null);
  trendingRuns = signal<RunEvent[]>([]);
  weekendRuns = signal<RunEvent[]>([]);
  clubs = signal<Club[]>([]);
  feedMode = signal<'all' | 'mine'>('all');
  activeRunType = signal<string | null>(null);
  activePace = signal<string | null>(null);
  activeTag = signal<string | null>(null);
  showOnboarding = signal(false);
  userCoordinates = signal<Coordinates | null>(null);
  nearMeEnabled = signal(false);
  radiusMiles = signal(10);

  // Onboarding funnel
  showLocationModal = signal(false);
  nearbyRuns = signal<RunEvent[]>([]);
  showFirstRunCta = signal(false);

  readonly feedRuns = computed(() => {
    const pace = this.activePace();
    let runs = this.runsService.getRuns()();

    if (this.nearMeEnabled()) {
      const coords = this.userCoordinates();
      if (coords) {
        const radiusKm = this.geoService.milesToKilometers(this.radiusMiles());
        runs = runs.filter(r => {
          const loc = r.startLocation;
          if (!loc || isNaN(loc.lat) || isNaN(loc.lng)) return false;
          return this.geoService.calculateDistance(coords, loc) <= radiusKm;
        });
      }
    }

    if (pace) runs = runs.filter(r => r.pace === pace);
    const tag = this.activeTag();
    if (tag) runs = runs.filter(r => (r.tags ?? []).some(t => t.toLowerCase() === tag.toLowerCase()));
    return runs;
  });

  readonly featuredClubs = computed(() => this.clubs().slice(0, 4));
  locationLabel = signal('Locating...');
  searchResults = signal<RunEvent[]>([]);
  showDropdown = signal(false);
  searchLoading = signal(false);
  loaded = false;
  searchQuery = '';
  activeCategory = 'All';

  private searchSubject = new Subject<string>();
  private currentParams: any = {};

  readonly gradientForPace = gradientForPace;

  readonly pacePills = [
    { value: 'social',   label: 'Social',   color: '#10B981', effort: 'chatty pace' },
    { value: 'easy',     label: 'Easy',     color: '#1D9E75', effort: 'relaxed pace' },
    { value: 'moderate', label: 'Moderate', color: '#3B82F6', effort: 'steady effort' },
    { value: 'fast',     label: 'Fast',     color: '#EF4444', effort: 'push pace' },
    { value: 'tempo',    label: 'Tempo',    color: '#F59E0B', effort: 'race effort' },
  ];

  readonly runTypePills = [
    { value: 'club_run',       label: 'Club Run',  emoji: '🏃' },
    { value: 'parkrun_style',  label: 'Parkrun',   emoji: '🅿️' },
    { value: 'one_off_race',   label: 'Race',      emoji: '🏅' },
    { value: 'training_group', label: 'Training',  emoji: '💪' },
    { value: 'trail_run',      label: 'Trail',     emoji: '🌲' },
  ];

  categories: HomeCategory[] = [
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

  get hasFiltersToClear(): boolean {
    return this.hasActiveFilters || !!this.activePace() || !!this.activeRunType() || !!this.activeTag() || this.nearMeEnabled();
  }

  clearAllFilters(): void {
    this.activePace.set(null);
    this.activeRunType.set(null);
    this.activeTag.set(null);
    this.searchQuery = '';
    this.activeCategory = 'All';
    this.currentParams = {};
    if (this.nearMeEnabled()) {
      this.nearMeEnabled.set(false);
      localStorage.setItem('nearMeEnabled', 'false');
    }
    this.loadWithParams();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.search-row')) {
      this.showDropdown.set(false);
    }
  }

  onOnboardingComplete(prefs: OnboardingPrefs) {
    this.showOnboarding.set(false);
    if (prefs.pace) this.activePace.set(prefs.pace);
  }

  ngOnInit() {
    if (!localStorage.getItem('onboarded')) this.showOnboarding.set(true);
    this.loadGeoPreferences();
    this.initLocationFunnel();
    this.detectLocation();
    this.loadWithParams();
    this.loadCarousels();

    // Main feed search subscription
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(q => {
      this.currentParams = { ...this.currentParams, search: q || undefined };
      this.loadWithParams();

      // Dropdown search subscription
      if (q.length >= 2) {
        this.searchLoading.set(true);
        this.runsService.fetchRuns({ search: q }).subscribe({
          next: runs => {
            this.searchResults.set(runs.slice(0, 6));
            this.showDropdown.set(true);
            this.searchLoading.set(false);
            this.cdr.markForCheck();
          },
          error: () => {
            this.searchResults.set([]);
            this.searchLoading.set(false);
          }
        });
      } else {
        this.searchResults.set([]);
        this.showDropdown.set(false);
      }
    });
  }

  private loadGeoPreferences() {
    const enabled = localStorage.getItem('nearMeEnabled');
    const radius = localStorage.getItem('nearMeRadius');
    if (enabled === 'true') this.nearMeEnabled.set(true);
    if (radius) this.radiusMiles.set(Number(radius));
  }

  toggleNearMe() {
    if (!this.nearMeEnabled() && !this.userCoordinates()) {
      this.toast.show('Enable location to use Near Me filter');
      return;
    }
    const next = !this.nearMeEnabled();
    this.nearMeEnabled.set(next);
    localStorage.setItem('nearMeEnabled', String(next));
  }

  setRadius(miles: number) {
    this.radiusMiles.set(miles);
    localStorage.setItem('nearMeRadius', String(miles));
  }

  private detectLocation() {
    const status = this.geolocationService.status();
    const coords = this.geolocationService.coordinates();
    if (status === 'granted' && coords) {
      this.applyCoordinates(coords.lat, coords.lng);
      return;
    }
    if (status === 'denied') {
      this.locationLabel.set('Near you');
      return;
    }
    // Fallback silent detection (for users who granted via browser directly)
    if (!navigator.geolocation) {
      this.locationLabel.set('Near you');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        this.applyCoordinates(latitude, longitude);
      },
      () => this.locationLabel.set('Near you'),
      { timeout: 8000, maximumAge: 300000 }
    );
  }

  private applyCoordinates(latitude: number, longitude: number) {
    this.userCoordinates.set({ lat: latitude, lng: longitude });
    this.http.get<{ formatted_address: string }>(`${environment.apiUrl}/geocode?address=${latitude},${longitude}`)
      .subscribe({
        next: r => {
          const city = this.parseCityFromAddress(r.formatted_address);
          this.locationLabel.set(city);
          this.cdr.markForCheck();
        },
        error: () => this.locationLabel.set('Near you')
      });
  }

  private initLocationFunnel() {
    // Only show modal if user hasn't made a consent decision yet
    // and hasn't dismissed the first-run CTA before (proxy for "new user")
    const consent = this.geolocationService.getStoredConsent();
    const ctaDismissed = typeof window !== 'undefined'
      && window.localStorage?.getItem('klub-first-run-dismissed') === '1';

    if (!consent && !ctaDismissed) {
      this.showLocationModal.set(true);
      return;
    }

    // Restore previous grant silently
    if (consent === 'granted') {
      this.geolocationService.restoreFromConsent();
    }
  }

  onLocationGranted() {
    this.showLocationModal.set(false);
    const coords = this.geolocationService.coordinates();
    if (!coords) return;
    this.applyCoordinates(coords.lat, coords.lng);
    this.runsService.getNearbyRuns(coords.lat, coords.lng, 3)
      .subscribe({
        next: runs => {
          this.nearbyRuns.set(runs);
          this.showFirstRunCta.set(runs.length > 0);
          this.cdr.markForCheck();
        },
        error: () => { /* silently skip CTA on error */ }
      });
  }

  private parseCityFromAddress(address: string): string {
    // Google formatted_address is typically "Street, City, Region, Country"
    // We want the first component that looks like a city (not a street number)
    const parts = address.split(',').map(p => p.trim());
    // Skip parts that start with a number (street addresses)
    const cityPart = parts.find(p => !/^\d/.test(p) && p.length > 1);
    return cityPart ?? parts[0] ?? 'Near you';
  }

  onSearchFocus() {
    if (this.searchQuery.length >= 2 && this.searchResults().length > 0) {
      this.showDropdown.set(true);
    }
  }

  onSelectSearchResult(run: RunEvent) {
    this.showDropdown.set(false);
    this.openDialog(run);
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

  setRunType(type: string | null) {
    this.activeRunType.set(type);
    this.loadWithParams();
  }

  setPace(pace: string | null) { this.activePace.set(pace); }

  setActiveTag(tag: string | null) {
    this.activeTag.set(this.activeTag() === tag ? null : tag);
  }

  private loadWithParams() {
    this.loaded = false;
    const runType = this.activeRunType();
    this.runsService.loadRuns({ ...this.currentParams, ...(runType ? { run_type: runType } : {}) });
    setTimeout(() => { this.loaded = true; this.cdr.markForCheck(); }, 600);
  }

  openDialog(run: RunEvent) { this.selectedRun.set(run); }

  onJoin(runId: string) {
    this.runsService.toggleJoin(runId, this.auth.getUser()()?.id ?? 'guest');
    const isJoined = this.runsService.getJoinedRunIds()().includes(runId);
    this.toast.show(isJoined ? 'Left the run' : "You're in!");
  }

}
