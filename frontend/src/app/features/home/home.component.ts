import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { RunCardComponent } from '../../shared/components/run-card/run-card.component';
import { RunDetailDialogComponent } from '../../shared/components/run-detail-dialog/run-detail-dialog.component';
import { RunEvent } from '../../core/models/run-event.model';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

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

      <!-- Feed section -->
      <div class="feed-header">
        @if (loaded) {
          <span class="feed-count">{{ runsService.getRuns()().length }} runs near you</span>
        } @else {
          <span class="feed-count">Finding runs...</span>
        }
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
      position: relative;
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

    /* ── Feed ───────────────────────────────────────────────── */
    .feed-header { padding: 0 20px 14px; }
    .feed-count {
      font-size: 17px;
      font-weight: 700;
      color: #0D0D0D;
      letter-spacing: -0.2px;
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
  `]
})
export class HomeComponent implements OnInit {
  runsService = inject(RunsService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  selectedRun = signal<RunEvent | null>(null);
  loaded = false;
  searchQuery = '';
  activeCategory = 'All';

  private searchSubject = new Subject<string>();
  private currentParams: any = {};

  categories = [
    { label: 'All',    emoji: '🏃',  bg: '#0D0D0D', params: {} },
    { label: '5K',     emoji: '🎯',  bg: '#3B82F6', params: { distance_min: 3 } },
    { label: '10K',    emoji: '💪',  bg: '#8B5CF6', params: { distance_min: 8 } },
    { label: 'Half',   emoji: '🏅',  bg: '#F59E0B', params: { distance_min: 18 } },
    { label: 'Social', emoji: '👥',  bg: '#EC4899', params: { pace: 'social' } },
    { label: 'Easy',   emoji: '🌿',  bg: '#1D9E75', params: { pace: 'easy' } },
    { label: 'Fast',   emoji: '⚡',  bg: '#EF4444', params: { pace: 'fast' } },
    { label: 'Today',  emoji: '📅',  bg: '#6366F1', params: { date: 'today' } },
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
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
      this.currentParams = { ...this.currentParams, search: q || undefined };
      this.loadWithParams();
    });
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
}
