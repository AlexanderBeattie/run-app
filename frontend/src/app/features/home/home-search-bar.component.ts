import { Component, Input, inject, signal, DestroyRef, HostListener, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RunsService } from '../../core/services/runs.service';
import { RunEvent } from '../../core/models/run-event.model';
import { gradientForPace } from '../../shared/utils/run-pace';

@Component({
  selector: 'app-home-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
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
      <button class="filter-btn" [class.active]="filtersActive">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="11" y1="18" x2="13" y2="18"/>
        </svg>
      </button>

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
  `,
  styles: [`
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
  `]
})
export class HomeSearchBarComponent {
  @Input() filtersActive = false;
  @Output() search = new EventEmitter<string>();
  @Output() resultSelected = new EventEmitter<RunEvent>();

  runsService = inject(RunsService);
  private destroyRef = inject(DestroyRef);

  searchQuery = '';
  searchResults = signal<RunEvent[]>([]);
  showDropdown = signal(false);
  searchLoading = signal(false);

  readonly gradientForPace = gradientForPace;

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(q => {
      this.search.emit(q);
      if (q.length >= 2) {
        this.searchLoading.set(true);
        this.runsService.fetchRuns({ search: q }).subscribe({
          next: runs => {
            this.searchResults.set(runs.slice(0, 6));
            this.showDropdown.set(true);
            this.searchLoading.set(false);
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.search-row')) {
      this.showDropdown.set(false);
    }
  }

  onSearchChange(q: string) {
    this.searchSubject.next(q);
  }

  onSearchFocus() {
    if (this.searchQuery.length >= 2 && this.searchResults().length > 0) {
      this.showDropdown.set(true);
    }
  }

  onSelectSearchResult(run: RunEvent) {
    this.showDropdown.set(false);
    this.resultSelected.emit(run);
  }
}
