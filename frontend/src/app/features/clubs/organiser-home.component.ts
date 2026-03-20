import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { RunsService } from '../../core/services/runs.service';
import { AuthService } from '../../core/services/auth.service';
import { RunOrganiserDialogComponent } from './run-organiser-dialog.component';

@Component({
  selector: 'app-organiser-home',
  standalone: true,
  imports: [RouterLink, RunOrganiserDialogComponent],
  template: `
    <div class="page">
      <div class="header">
        <div class="header-top">
          <div>
            <div class="greeting">Good morning</div>
            <div class="club-name">{{ auth.getUser()()?.displayName }}</div>
          </div>
          <div class="header-actions">
            <button class="notif-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </button>
            <div class="avatar">{{ initials }}</div>
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

      <div class="content">
        <div class="content-header">
          <div class="section-title">Your runs</div>
          <a routerLink="/clubs/create-run" class="post-btn">+ Post run</a>
        </div>

        @if (!loaded) {
          <div class="empty">Loading...</div>
        } @else if (runs.length === 0) {
          <div class="empty">No runs posted yet.</div>
        } @else {
          <div class="list">
            @for (run of runs; track run.id) {
              <div class="run-card" [class.cancelled]="run.status === 'cancelled'" (click)="openDialog(run)">
                <div class="run-top">
                  <div class="run-info">
                    <div class="run-title">{{ run.title }}</div>
                    <div class="run-meta">{{ formatDate(run.event_date) }} · {{ formatTime(run.event_date) }} · {{ run.distance_km }}k</div>
                  </div>
                  <div class="run-right">
                    <span class="badge" [class.active]="run.status !== 'cancelled'" [class.cancelled]="run.status === 'cancelled'">
                      {{ run.status === 'cancelled' ? 'Cancelled' : 'Active' }}
                    </span>
                  </div>
                </div>
                <div class="capacity">
                  <div class="cap-row">
                    <span class="cap-label">Signups</span>
                    <span class="cap-val">{{ (run.attendees?.length ?? 0) }}{{ run.max_attendees ? ' / ' + run.max_attendees : '' }}</span>
                  </div>
                  <div class="cap-bar"><div class="cap-fill" [style.width.%]="getCapacity(run)"></div></div>
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
  `,
  styles: [`
    .page { background: #0D0D0D; min-height: 100%; }
    .header { padding: 16px 20px 20px; }
    .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .greeting { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 2px; }
    .club-name { font-size: 18px; font-weight: 500; color: #fff; }
    .header-actions { display: flex; align-items: center; gap: 10px; }
    .notif-btn { background: rgba(255,255,255,0.1); border: none; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; background: #E1F5EE; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; color: #0F6E56; }
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
    .empty { text-align: center; padding: 40px 20px; font-size: 14px; color: #9B9B98; }
    .list { display: flex; flex-direction: column; gap: 10px; }
    .run-card { background: #fff; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 14px; padding: 14px; cursor: pointer; }
    .run-card.cancelled { opacity: 0.6; }
    .run-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .run-title { font-size: 15px; font-weight: 500; color: #0D0D0D; margin-bottom: 3px; }
    .run-meta { font-size: 12px; color: #6B6B68; }
    .badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 500; }
    .badge.active { background: #E1F5EE; color: #0F6E56; }
    .badge.cancelled { background: #FCEBEB; color: #A32D2D; }
    .capacity { margin-bottom: 10px; }
    .cap-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .cap-label { font-size: 11px; color: #9B9B98; }
    .cap-val { font-size: 11px; font-weight: 500; color: #0D0D0D; }
    .cap-bar { height: 4px; background: rgba(0,0,0,0.08); border-radius: 999px; overflow: hidden; }
    .cap-fill { height: 100%; background: #1D9E75; border-radius: 999px; }
    .run-actions { display: flex; gap: 6px; }
    .btn-sm { background: transparent; border: 0.5px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 6px 14px; font-size: 12px; cursor: pointer; font-family: inherit; color: #6B6B68; text-decoration: none; }
    .btn-sm.warn { color: #BA7517; border-color: #BA7517; }
    .btn-sm.danger { color: #A32D2D; border-color: #A32D2D; }
  `]
})
export class OrganiserHomeComponent implements OnInit {
  svc = inject(RunsService);
  auth = inject(AuthService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  runs: any[] = [];
  loaded = false;
  selectedRun: any = null;

  get initials() { return (this.auth.getUser()()?.displayName ?? '').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2); }
  get activeRuns() { return this.runs.filter(r => r.status !== 'cancelled').length; }
  get totalSignups() { return this.runs.reduce((acc, r) => acc + (r.attendees?.length ?? 0), 0); }
  get nextRun() { return this.runs.filter(r => r.status !== 'cancelled' && new Date(r.event_date) > new Date()).sort((a,b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0] ?? null; }

  ngOnInit() {
    this.svc.getMyRuns().subscribe(data => {
      this.runs = data; this.loaded = true; this.cdr.markForCheck();
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

  openDialog(run: any) { this.selectedRun = run; this.cdr.markForCheck(); }

  cancel(id: string) {
    if (!confirm('Cancel this run?')) return;
    this.svc.cancelRun(id).subscribe(() => { this.runs = this.runs.map(r => r.id === id ? { ...r, status: 'cancelled' } : r); this.cdr.markForCheck(); });
  }

  delete(id: string) {
    if (!confirm('Delete this run?')) return;
    this.svc.deleteRun(id).subscribe(() => { this.runs = this.runs.filter(r => r.id !== id); this.cdr.markForCheck(); });
  }

  onCancelled(id: string) { this.runs = this.runs.map(r => r.id === id ? { ...r, status: 'cancelled' } : r); this.selectedRun = null; this.cdr.markForCheck(); }
  onDeleted(id: string) { this.runs = this.runs.filter(r => r.id !== id); this.selectedRun = null; this.cdr.markForCheck(); }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}