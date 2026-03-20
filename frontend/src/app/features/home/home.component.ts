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
      <div class="header">
        <div>
          <div class="greeting">Good morning</div>
          <div class="name">{{ auth.getUser()()?.displayName }}</div>
        </div>
        <div class="avatar">{{ initials }}</div>
      </div>

      <div class="search-row">
        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" placeholder="Find runs near you..." />
        </div>
      </div>

      <div class="filter-row">
        @for (f of filters; track f.label) {
          <button class="chip" [class.active]="activeFilter === f.label" (click)="setFilter(f)">{{ f.label }}</button>
        }
      </div>

      <div class="section-label">Upcoming near you</div>

      @if (!loaded) {
        <div class="loading-state">
          @for (i of [1,2,3]; track i) { <div class="skeleton"></div> }
        </div>
      } @else if (runsService.getRuns()().length === 0) {
        <div class="empty">No runs found. Check back soon!</div>
      } @else {
        <div class="feed">
          @for (run of runsService.getRuns()(); track run.id) {
            <app-run-card
              [run]="run"
              [isJoined]="runsService.getJoinedRunIds()().includes(run.id)"
              (cardClick)="openDialog(run)"
              (joinToggle)="onJoin($event)" />
          }
        </div>
      }
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
    .page { background: #0D0D0D; min-height: 100%; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px 12px; }
    .greeting { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 2px; }
    .name { font-size: 18px; font-weight: 500; color: #fff; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: #E1F5EE; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: #0F6E56; }
    .search-row { padding: 0 16px 14px; }
    .search-box { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; }
    .search-box input { border: none; outline: none; background: transparent; color: #fff; font-size: 14px; font-family: inherit; flex: 1; }
    .search-box input::placeholder { color: rgba(255,255,255,0.35); }
    .filter-row { display: flex; gap: 8px; padding: 0 16px 16px; overflow-x: auto; }
    .filter-row::-webkit-scrollbar { display: none; }
    .chip { border-radius: 999px; padding: 7px 16px; font-size: 13px; font-weight: 500; white-space: nowrap; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.6); font-family: inherit; cursor: pointer; }
    .chip.active { background: #1D9E75; color: #E1F5EE; border-color: #1D9E75; }
    .section-label { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.06em; padding: 0 20px 12px; }
    .feed { display: flex; flex-direction: column; gap: 12px; padding: 0 12px 24px; background: #F7F7F5; border-radius: 20px 20px 0 0; padding-top: 20px; }
    .loading-state { background: #F7F7F5; border-radius: 20px 20px 0 0; padding: 20px 12px; display: flex; flex-direction: column; gap: 12px; }
    .skeleton { height: 180px; background: rgba(0,0,0,0.06); border-radius: 16px; }
    .empty { background: #F7F7F5; border-radius: 20px 20px 0 0; padding: 60px 20px; text-align: center; font-size: 14px; color: #9B9B98; }
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
  activeFilter = 'All runs';

  private searchSubject = new Subject<string>();

  filters = [
    { label: 'All runs', params: {} },
    { label: 'Today', params: { date: 'today' } },
    { label: 'This week', params: { date: 'week' } },
    { label: '5k+', params: { distance_min: 5 } },
    { label: '10k+', params: { distance_min: 10 } },
  ];

  private currentParams: any = {};

  get initials() {
    return (this.auth.getUser()()?.displayName ?? '').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
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

  setFilter(f: { label: string; params: any }) {
    this.activeFilter = f.label;
    this.currentParams = { ...f.params };
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