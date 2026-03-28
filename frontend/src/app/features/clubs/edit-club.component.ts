import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClubService } from '../../core/services/club.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
    selector: 'app-edit-club',
    standalone: true,
    imports: [FormsModule],
    template: `
    <div class="page">
      <div class="top-bar">
        <button class="back" (click)="router.navigate(['/clubs', clubId])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div class="top-title">Edit club</div>
        <div style="width:32px"></div>
      </div>

      @if (pageLoading) {
        <div class="loading-page"><div class="spinner"></div></div>
      } @else {
        <div class="form">
          <div class="field">
            <label>Club name</label>
            <input [(ngModel)]="name" (blur)="nameTouched = true" [class.invalid]="nameTouched && !name" placeholder="e.g. Glasgow Road Runners" />
            @if (nameTouched && !name) { <span class="field-error">Required</span> }
          </div>
          <div class="field">
            <label>Description</label>
            <textarea [(ngModel)]="description" rows="3" placeholder="What's your club about?"></textarea>
          </div>
          <div class="field">
            <label>City</label>
            <input [(ngModel)]="city" placeholder="e.g. Glasgow" />
          </div>
          <div class="field">
            <label>Pace</label>
            <div class="pace-options">
              @for (p of paceOptions; track p) {
                <button class="pace-btn" [class.active]="pace === p" (click)="pace = p">{{ p }}</button>
              }
            </div>
          </div>
          <div class="field">
            <label>Tags</label>
            <div class="tag-options">
              @for (t of tagOptions; track t) {
                <button class="tag-btn" [class.active]="tags.includes(t)" (click)="toggleTag(t)">{{ t }}</button>
              }
            </div>
          </div>
          @if (error) { <div class="error">{{ error }}</div> }
          <button class="submit" [disabled]="loading" (click)="submit()">{{ loading ? 'Saving...' : 'Save changes' }}</button>
        </div>
      }
    </div>
  `,
    styles: [`
    .page { min-height: 100%; background: #F7F7F5; overflow-x: hidden; }
    .top-bar { background: #0D0D0D; padding: 16px 16px 14px; display: flex; align-items: center; justify-content: space-between; }
    .back { background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; padding: 4px; flex-shrink: 0; }
    .top-title { font-size: 16px; font-weight: 500; color: #fff; flex: 1; text-align: center; }
    .loading-page { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(0,0,0,0.1); border-top-color: #1D9E75; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .form { padding: 20px 16px 40px; display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 500; color: #3D3D3B; }
    input, textarea { border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 12px; font-size: 16px; font-family: inherit; color: #0D0D0D; outline: none; background: #fff; width: 100%; box-sizing: border-box; }
    input:focus, textarea:focus { border-color: #1D9E75; }
    input.invalid { border-color: #A32D2D; }
    textarea { resize: vertical; }
    .field-error { font-size: 12px; color: #A32D2D; margin-top: -2px; }
    .pace-options, .tag-options { display: flex; gap: 8px; flex-wrap: wrap; }
    .pace-btn, .tag-btn { border: 1px solid rgba(0,0,0,0.12); background: #fff; border-radius: 999px; padding: 8px 12px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; color: #6B6B68; white-space: nowrap; text-transform: capitalize; }
    .pace-btn.active, .tag-btn.active { background: #1D9E75; color: #E1F5EE; border-color: #1D9E75; }
    .error { background: #FCEBEB; color: #A32D2D; border-radius: 10px; padding: 12px; font-size: 14px; }
    .submit { background: #1D9E75; color: #E1F5EE; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; width: 100%; }
    .submit:disabled { opacity: 0.6; }
  `]
})
export class EditClubComponent implements OnInit {
    route = inject(ActivatedRoute);
    router = inject(Router);
    clubService = inject(ClubService);
    toast = inject(ToastService);

    clubId = '';
    name = ''; description = ''; city = ''; pace = ''; tags: string[] = [];
    error = ''; loading = false; pageLoading = true; nameTouched = false;

    paceOptions = ['social', 'easy', 'moderate', 'fast', 'tempo'];
    tagOptions = ['Road', 'Trail', 'Social', 'Intervals', 'Beginner', 'Long distance'];

    ngOnInit() {
        this.clubId = this.route.snapshot.paramMap.get('id') ?? '';
        this.clubService.getClub(this.clubId).subscribe({
            next: (club) => {
                this.name = club.name;
                this.description = club.description ?? '';
                this.city = club.city ?? '';
                this.pace = club.pace ?? '';
                this.tags = club.tags ?? [];
                this.pageLoading = false;
            },
            error: () => {
                this.error = 'Failed to load club details.';
                this.pageLoading = false;
            }
        });
    }

    toggleTag(t: string) {
        if (this.tags.includes(t)) this.tags = this.tags.filter(x => x !== t);
        else this.tags = [...this.tags, t];
    }

    submit() {
        if (!this.name) { this.nameTouched = true; this.error = 'Club name is required.'; return; }
        this.loading = true; this.error = '';
        this.clubService.updateClub(this.clubId, {
            name: this.name,
            description: this.description || undefined,
            city: this.city || undefined,
            pace: this.pace || undefined,
            tags: this.tags
        }).subscribe({
            next: () => { this.toast.show('Club updated!'); this.router.navigate(['/clubs', this.clubId]); },
            error: () => { this.error = 'Failed to save changes.'; this.loading = false; }
        });
    }
}
