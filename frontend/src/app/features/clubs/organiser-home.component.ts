import { Component, inject, OnInit, ChangeDetectorRef, signal, Input } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { RunOrganiserDialogComponent } from './run-organiser-dialog.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-organiser-home',
  standalone: true,
  imports: [RouterLink, RunOrganiserDialogComponent, ConfirmModalComponent],
  template: `
    <div class="page" [class.embedded]="embedded" (click)="menuOpen && closeMenu($event)">
      @if (!embedded) {
      <div class="header">
        <div class="header-top">
          <div>
            <div class="greeting">{{ greeting }}</div>
            <div class="club-name">{{ auth.getUser()()?.displayName }}</div>
          </div>
          <div class="header-actions">
            <div class="avatar-wrap">
              <button class="avatar" (click)="$event.stopPropagation(); menuOpen = !menuOpen">{{ initials }}</button>
              @if (menuOpen) {
                <div class="avatar-menu">
                  <button class="menu-item logout" (click)="logout()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Log out
                  </button>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Active runs</div>
            <div class="stat-val">{{ activeRuns }}</div>
            <div class="stat-sub">posted</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total signups</div>
            <div class="stat-val">{{ totalSignups }}</div>
            <div class="stat-sub">across all runs</div>
          </div>
        </div>

        @if (nextRun) {
          <div class="next-run-banner">
            <div>
              <div class="next-label">Next run</div>
              <div class="next-title">{{ nextRun.title }}</div>
              <div class="next-meta">{{ formatDate(nextRun.event_date) }} · {{ formatTime(nextRun.event_date) }}</div>
            </div>
            <div class="next-going">{{ nextRun.attendees?.length ?? 0 }} going</div>
          </div>
        }
      </div>
      } <!-- /if !embedded -->

      <div class="content">
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

        <div class="content-header">
          <div class="section-title">Your runs</div>
          <a routerLink="/clubs/create-run" class="post-btn">+ Post run</a>
        </div>

        <div class="tabs">
          <button class="tab" [class.active]="activeTab === 'upcoming'" (click)="activeTab = 'upcoming'">
            Upcoming <span class="tab-count">{{ upcomingRuns.length }}</span>
          </button>
          <button class="tab" [class.active]="activeTab === 'past'" (click)="activeTab = 'past'">
            Past <span class="tab-count">{{ pastRuns.length }}</span>
          </button>
          <button class="tab" [class.active]="activeTab === 'cancelled'" (click)="activeTab = 'cancelled'">
            Cancelled <span class="tab-count">{{ cancelledRuns.length }}</span>
          </button>
        </div>

        @if (!loaded) {
          <div class="empty">Loading...</div>
        } @else if (filteredRuns.length === 0) {
          <div class="empty">{{ emptyMessage }}</div>
        } @else {
          <div class="list">
            @for (run of filteredRuns; track run.id) {
              <div class="run-card" [class.cancelled]="run.status === 'cancelled'" (click)="openDialog(run)">
                <div class="run-main">
                  <div class="run-info">
                    <div class="run-title">{{ run.title }}</div>
                    <div class="run-meta">
                      {{ formatDate(run.event_date) }} · {{ formatTime(run.event_date) }} · {{ run.distance_km }}k
                      <span class="run-signups"> · {{ run.attendees?.length ?? 0 }}{{ run.max_attendees ? '/' + run.max_attendees : '' }} going</span>
                    </div>
                  </div>
                  @if (run.max_attendees) {
                    <div class="cap-pill" [style.--pct]="getCapacity(run) + '%'">{{ getCapacity(run) }}%</div>
                  }
                </div>
                <div class="run-actions" (click)="$event.stopPropagation()">
                  <a [routerLink]="['/clubs/edit-run', run.id]" class="btn-sm">Edit</a>
                  @if (run.status !== 'cancelled') {
                    <button class="btn-sm warn" (click)="cancel(run.id)">Cancel</button>
                  }
                  <button class="btn-sm danger" (click)="delete(run.id)">Delete</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    @if (selectedRun) {
      <app-run-organiser-dialog
        [run]="selectedRun"
        (close)="selectedRun = null"
        (cancelled)="onCancelled($event)"
        (deleted)="onDeleted($event)" />
    }

    @if (confirmModal.mode !== null) {
      <app-confirm-modal
        [title]="confirmModal.title"
        [message]="confirmModal.message"
        [confirmLabel]="confirmModal.confirmLabel"
        [destructive]="confirmModal.destructive"
        (confirmed)="onConfirmed()"
        (cancelled)="onCancelledModal()" />
    }
  `,
  styles: [`
    .page { background: #0D0D0D; min-height: 100%; }
    .page.embedded { background: transparent; }
    .header { padding: 16px 20px 20px; }
    .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .greeting { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 2px; }
    .club-name { font-size: 18px; font-weight: 500; color: #fff; }
    .header-actions { display: flex; align-items: center; gap: 10px; }
    .avatar-wrap { position: relative; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; background: #E1F5EE; border: none; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; color: #0F6E56; cursor: pointer; }
    .avatar-menu { position: absolute; top: calc(100% + 8px); right: 0; background: #1A1A1A; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 6px; min-width: 140px; z-index: 100; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    .menu-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; border: none; background: none; color: rgba(255,255,255,0.7); font-size: 14px; font-family: inherit; cursor: pointer; border-radius: 8px; text-align: left; }
    .menu-item:hover { background: rgba(255,255,255,0.08); }
    .menu-item.logout { color: #F87171; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .stat-card { background: rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; }
    .stat-label { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .stat-val { font-size: 26px; font-weight: 500; color: #fff; line-height: 1; }
    .stat-sub { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 3px; }
    .next-run-banner { background: rgba(29,158,117,0.2); border: 1px solid rgba(29,158,117,0.3); border-radius: 12px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
    .next-label { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
    .next-title { font-size: 14px; font-weight: 500; color: #fff; margin-bottom: 2px; }
    .next-meta { font-size: 12px; color: rgba(255,255,255,0.5); }
    .next-going { background: #1D9E75; color: #E1F5EE; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 500; white-space: nowrap; flex-shrink: 0; margin-left: 12px; }
    .content { background: #F7F7F5; border-radius: 20px 20px 0 0; min-height: 50vh; padding: 20px 12px 24px; }
    .content-header { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; margin-bottom: 14px; }
    .section-title { font-size: 11px; font-weight: 500; color: #9B9B98; text-transform: uppercase; letter-spacing: 0.06em; }
    .post-btn { font-size: 13px; font-weight: 500; color: #1D9E75; text-decoration: none; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; background: rgba(0,0,0,0.06); border-radius: 10px; padding: 3px; }
    .tab { flex: 1; border: none; background: none; padding: 7px 4px; font-size: 12px; font-weight: 500; color: #9B9B98; border-radius: 8px; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 5px; }
    .tab.active { background: #fff; color: #0D0D0D; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .tab-count { font-size: 11px; background: rgba(0,0,0,0.08); color: #6B6B68; border-radius: 999px; padding: 1px 6px; }
    .tab.active .tab-count { background: #E1F5EE; color: #0F6E56; }

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

    .empty { text-align: center; padding: 40px 20px; font-size: 14px; color: #9B9B98; }
    .list { display: flex; flex-direction: column; gap: 10px; }
    .run-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 14px; padding: 14px; cursor: pointer; }
    .run-card.cancelled { opacity: 0.6; }
    .run-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 10px; }
    .run-info { flex: 1; min-width: 0; }
    .run-title { font-size: 15px; font-weight: 500; color: #0D0D0D; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .run-meta { font-size: 12px; color: #6B6B68; }
    .run-signups { color: #1D9E75; font-weight: 500; }
    .cap-pill { flex-shrink: 0; font-size: 11px; font-weight: 500; color: #0F6E56; background: #E1F5EE; border-radius: 999px; padding: 3px 8px; }
    .run-actions { display: flex; gap: 6px; }
    .btn-sm { background: transparent; border: 0.5px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 6px 14px; font-size: 12px; cursor: pointer; font-family: inherit; color: #6B6B68; text-decoration: none; }
    .btn-sm.warn { color: #BA7517; border-color: #BA7517; }
    .btn-sm.danger { color: #A32D2D; border-color: #A32D2D; }
  `]
})
export class OrganiserHomeComponent implements OnInit {
  @Input() embedded = false;
  svc = inject(RunsService);
  auth = inject(AuthService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  toast = inject(ToastService);
  runs: any[] = [];
  loaded = false;
  selectedRun: any = null;
  menuOpen = false;
  activeTab: 'upcoming' | 'past' | 'cancelled' = 'upcoming';
  errorMessage = signal<string | null>(null);
  confirmModal = {
    mode: null as 'cancel' | 'delete' | null,
    title: '',
    message: '',
    confirmLabel: '',
    destructive: false,
    runId: ''
  };

  get initials() { return (this.auth.getUser()()?.displayName ?? '').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2); }
  get activeRuns() { return this.runs.filter(r => r.status !== 'cancelled').length; }
  get totalSignups() { return this.runs.reduce((acc, r) => acc + (r.attendees?.length ?? 0), 0); }
  get nextRun() { return this.runs.filter(r => r.status !== 'cancelled' && new Date(r.event_date) > new Date()).sort((a,b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0] ?? null; }
  get upcomingRuns() { return this.runs.filter(r => r.status !== 'cancelled' && new Date(r.event_date) >= new Date()).sort((a,b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()); }
  get pastRuns() { return this.runs.filter(r => r.status !== 'cancelled' && new Date(r.event_date) < new Date()).sort((a,b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()); }
  get cancelledRuns() { return this.runs.filter(r => r.status === 'cancelled'); }
  get filteredRuns() { return this.activeTab === 'upcoming' ? this.upcomingRuns : this.activeTab === 'past' ? this.pastRuns : this.cancelledRuns; }
  get emptyMessage() { return this.activeTab === 'upcoming' ? 'No upcoming runs. Post one!' : this.activeTab === 'past' ? 'No past runs yet.' : 'No cancelled runs.'; }
  get greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

  closeMenu(e: MouseEvent) { this.menuOpen = false; this.cdr.markForCheck(); }

  ngOnInit() {
    this.svc.getMyRuns().subscribe({
      next: (data) => {
        this.runs = data;
        this.loaded = true;
        this.errorMessage.set(null);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loaded = true;
        this.errorMessage.set('Failed to load your runs. Please try again.');
        this.cdr.markForCheck();
      }
    });
  }

  getCapacity(run: any) {
    if (!run.max_attendees) return 0;
    return Math.min(100, Math.round(((run.attendees?.length ?? 0) / run.max_attendees) * 100));
  }

  formatDate(date: string) {
    const d = new Date(date);
    const diff = d.getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today'; if (days === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  formatTime(date: string) { return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }

  openDialog(run: any) { this.selectedRun = this.svc.mapRun(run); this.cdr.markForCheck(); }

  cancel(id: string) {
    this.confirmModal = {
      mode: 'cancel',
      title: 'Cancel run?',
      message: 'This run will be marked as cancelled. Attendees will be notified.',
      confirmLabel: 'Cancel run',
      destructive: false,
      runId: id
    };
    this.cdr.markForCheck();
  }

  delete(id: string) {
    this.confirmModal = {
      mode: 'delete',
      title: 'Delete run?',
      message: 'This action cannot be undone. The run will be permanently removed.',
      confirmLabel: 'Delete',
      destructive: true,
      runId: id
    };
    this.cdr.markForCheck();
  }

  onConfirmed() {
    if (this.confirmModal.mode === 'cancel') {
      this.svc.cancelRun(this.confirmModal.runId).subscribe(() => {
        this.runs = this.runs.map(r => r.id === this.confirmModal.runId ? { ...r, status: 'cancelled' } : r);
        this.toast.show('Run cancelled');
        this.confirmModal.mode = null;
        this.cdr.markForCheck();
      });
    } else if (this.confirmModal.mode === 'delete') {
      this.svc.deleteRun(this.confirmModal.runId).subscribe(() => {
        this.runs = this.runs.filter(r => r.id !== this.confirmModal.runId);
        this.toast.show('Run deleted');
        this.confirmModal.mode = null;
        this.cdr.markForCheck();
      });
    }
  }

  onCancelledModal() {
    this.confirmModal.mode = null;
    this.cdr.markForCheck();
  }

  onCancelled(id: string) { this.runs = this.runs.map(r => r.id === id ? { ...r, status: 'cancelled' } : r); this.toast.show('Run cancelled'); this.selectedRun = null; this.cdr.markForCheck(); }
  onDeleted(id: string) { this.runs = this.runs.filter(r => r.id !== id); this.toast.show('Run deleted'); this.selectedRun = null; this.cdr.markForCheck(); }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}