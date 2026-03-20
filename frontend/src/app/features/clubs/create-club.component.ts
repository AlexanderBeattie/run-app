import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClubService } from '../../core/services/club.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
    selector: 'app-create-club',
    standalone: true,
    imports: [FormsModule],
    template: `
    <div class="page">
      <div class="top-bar">
        <button class="back" (click)="router.navigate(['/clubs'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div class="top-title">Create a club</div>
        <div style="width:32px"></div>
      </div>
      <div class="form">
        <div class="field"><label>Club name</label><input [(ngModel)]="name" placeholder="e.g. Glasgow Road Runners" /></div>
        <div class="field"><label>Description</label><textarea [(ngModel)]="description" rows="3" placeholder="What's your club about?"></textarea></div>
        <div class="field"><label>City</label><input [(ngModel)]="city" placeholder="e.g. Glasgow" /></div>
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
        <button class="submit" [disabled]="loading" (click)="submit()">{{ loading ? 'Creating...' : 'Create club' }}</button>
      </div>
    </div>
  `,
    styles: [`
    .page { min-height: 100%; background: #F7F7F5; }
    .top-bar { background: #0D0D0D; padding: 16px 16px 14px; display: flex; align-items: center; justify-content: space-between; }
    .back { background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; padding: 4px; }
    .top-title { font-size: 16px; font-weight: 500; color: #fff; }
    .form { padding: 20px 16px 40px; display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 500; color: #3D3D3B; }
    input, textarea { border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 12px; font-size: 16px; font-family: inherit; color: #0D0D0D; outline: none; background: #fff; }
    input:focus, textarea:focus { border-color: #1D9E75; }
    textarea { resize: vertical; }
    .pace-options, .tag-options { display: flex; gap: 8px; flex-wrap: wrap; }
    .pace-btn, .tag-btn { border: 1px solid rgba(0,0,0,0.12); background: #fff; border-radius: 999px; padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; color: #6B6B68; }
    .pace-btn.active, .tag-btn.active { background: #1D9E75; color: #E1F5EE; border-color: #1D9E75; }
    .error { background: #FCEBEB; color: #A32D2D; border-radius: 10px; padding: 12px; font-size: 14px; }
    .submit { background: #1D9E75; color: #E1F5EE; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .submit:disabled { opacity: 0.6; }
  `]
})
export class CreateClubComponent {
    clubService = inject(ClubService);
    router = inject(Router);
    toast = inject(ToastService);
    name = ''; description = ''; city = ''; pace = ''; tags: string[] = [];
    error = ''; loading = false;
    paceOptions = ['Easy', 'Moderate', 'Fast', 'Mixed'];
    tagOptions = ['Road', 'Trail', 'Social', 'Intervals', 'Beginner', 'Long distance'];

    toggleTag(t: string) {
        if (this.tags.includes(t)) this.tags = this.tags.filter(x => x !== t);
        else this.tags = [...this.tags, t];
    }

    submit() {
        if (!this.name) { this.error = 'Club name is required.'; return; }
        this.loading = true; this.error = '';
        this.clubService.createClub({
            name: this.name, description: this.description || undefined,
            city: this.city || undefined, pace: this.pace || undefined, tags: this.tags
        }).subscribe({
            next: (club) => { this.toast.show('Club created!'); this.router.navigate(['/clubs', club.id]); },
            error: () => { this.error = 'Failed to create club.'; this.loading = false; }
        });
    }
}