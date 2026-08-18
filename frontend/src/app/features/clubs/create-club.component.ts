import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClubService } from '../../core/services/club.service';
import { ToastService } from '../../shared/services/toast.service';
import { ClubBrandingPreviewComponent } from '../../shared/components/club-branding-preview/club-branding-preview.component';
import { compressImage } from '../../shared/utils/image-compressor';

@Component({
    selector: 'app-create-club',
    standalone: true,
    imports: [FormsModule, ClubBrandingPreviewComponent],
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
        <!-- 1. Header image upload -->
        <div class="field">
          <label>Club Header Image</label>
          <div class="header-upload" (click)="headerInput.click()">
            @if (headerPreviewUrl) {
              <img [src]="headerPreviewUrl" class="header-preview-img" alt="Club header" />
              <div class="header-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>Change image</span>
              </div>
            } @else {
              <div class="upload-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span class="upload-hint">Tap to upload a header image</span>
              </div>
            }
          </div>
          <input #headerInput type="file" accept="image/*" style="display:none" (change)="onHeaderSelected($event)" />
          <span class="upload-info">Image will be automatically optimized for web</span>
        </div>

        <!-- 2. Color picker -->
        <div class="field field-row-inline">
          <label>Club Colour</label>
          <div class="color-picker-row">
            @for (preset of colorPresets; track preset) {
              <button
                type="button"
                class="color-swatch"
                [style.background]="preset"
                [class.selected]="clubColor === preset"
                (click)="clubColor = preset"
              ></button>
            }
            <label class="color-custom-label">
              <input
                type="color"
                class="color-custom-input"
                [(ngModel)]="clubColor"
                [ngModelOptions]="{standalone: true}"
              />
              <div class="color-swatch color-custom-btn" [style.background]="clubColor || '#444'">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
            </label>
          </div>
        </div>

        <!-- 3. Live preview -->
        <app-club-branding-preview [clubName]="name" [selectedColor]="clubColor" />

        <!-- 4. Club name -->
        <div class="field">
          <label>Club name <span class="required">*</span></label>
          <input [(ngModel)]="name" (blur)="nameTouched = true" [class.invalid]="nameTouched && !name" placeholder="e.g. Glasgow Road Runners" />
          @if (nameTouched && !name) { <span class="field-error">Required</span> }
        </div>

        <!-- 5. Rest of the form -->
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

        <button class="submit" [disabled]="loading" (click)="submit()">
          {{ loading ? 'Creating...' : 'Create club' }}
        </button>
      </div>
    </div>
  `,
    styles: [`
    .page { min-height: 100%; background: #F7F7F5; overflow-x: hidden; }
    .top-bar { background: #0D0D0D; padding: 16px 16px 14px; display: flex; align-items: center; justify-content: space-between; }
    .back { background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; padding: 4px; flex-shrink: 0; }
    .top-title { font-size: 16px; font-weight: 500; color: #fff; flex: 1; text-align: center; }

    .form { padding: 20px 16px 40px; display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-row-inline { flex-direction: row; align-items: center; justify-content: space-between; }
    .field-row-inline label { margin-bottom: 0; }

    label { font-size: 13px; font-weight: 500; color: #3D3D3B; }
    .required { color: #1D9E75; }

    input[type="text"], input:not([type="color"]):not([type="file"]), textarea {
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 10px;
      padding: 12px;
      font-size: 16px;
      font-family: inherit;
      color: #0D0D0D;
      outline: none;
      background: #fff;
      width: 100%;
      box-sizing: border-box;
    }
    input:focus, textarea:focus { border-color: #1D9E75; }
    input.invalid { border-color: #A32D2D; }
    textarea { resize: vertical; }
    .field-error { font-size: 12px; color: #A32D2D; margin-top: -2px; }

    /* Header upload */
    .header-upload {
      position: relative;
      height: 120px;
      border-radius: 14px;
      border: 1.5px dashed rgba(0,0,0,0.15);
      background: #ededeb;
      overflow: hidden;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-preview-img { width: 100%; height: 100%; object-fit: cover; }
    .header-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: #fff;
      font-size: 12px;
    }
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .upload-hint { font-size: 12px; color: rgba(0,0,0,0.4); }
    .upload-info { font-size: 11px; color: rgba(0,0,0,0.35); text-align: center; }

    /* Color picker */
    .color-picker-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .color-swatch {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.15s;
      flex-shrink: 0;
    }
    .color-swatch.selected { border-color: #0D0D0D; transform: scale(1.15); }
    .color-custom-label { position: relative; cursor: pointer; }
    .color-custom-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      pointer-events: none;
    }
    .color-custom-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed rgba(255,255,255,0.5);
    }

    /* Pace/tag pills */
    .pace-options, .tag-options { display: flex; gap: 8px; flex-wrap: wrap; }
    .pace-btn, .tag-btn { border: 1px solid rgba(0,0,0,0.12); background: #fff; border-radius: 999px; padding: 8px 12px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; color: #6B6B68; white-space: nowrap; text-transform: capitalize; }
    .pace-btn.active, .tag-btn.active { background: #0F6E56; color: #fff; border-color: #0F6E56; }

    .error { background: #FCEBEB; color: #A32D2D; border-radius: 10px; padding: 12px; font-size: 14px; }
    .submit { background: #0F6E56; color: #fff; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; width: 100%; }
    .submit:disabled { opacity: 0.6; }
  `]
})
export class CreateClubComponent {
    clubService = inject(ClubService);
    router = inject(Router);
    toast = inject(ToastService);

    name = '';
    description = '';
    city = '';
    pace = '';
    tags: string[] = [];
    clubColor = '#1D9E75';
    headerPreviewUrl = '';
    error = '';
    loading = false;
    nameTouched = false;

    readonly paceOptions = ['social', 'easy', 'moderate', 'fast', 'tempo'];
    readonly tagOptions = ['Road', 'Trail', 'Social', 'Intervals', 'Beginner', 'Long distance'];
    readonly colorPresets = ['#1D9E75', '#2563eb', '#dc2626', '#d97706', '#8b5cf6', '#ec4899', '#0d9488'];

    onHeaderSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        compressImage(file).then((dataUrl) => {
            this.headerPreviewUrl = dataUrl;
        }).catch(() => {
            this.toast.show('Could not process image. Please try another file.');
        });
    }

    toggleTag(t: string): void {
        if (this.tags.includes(t)) this.tags = this.tags.filter(x => x !== t);
        else this.tags = [...this.tags, t];
    }

    submit(): void {
        console.log('logo_url length:', this.headerPreviewUrl.length);
        if (!this.name) { this.nameTouched = true; this.error = 'Club name is required.'; return; }
        this.loading = true;
        this.error = '';
        this.clubService.createClub({
            name: this.name,
            description: this.description || undefined,
            city: this.city || undefined,
            pace: this.pace || undefined,
            tags: this.tags,
            logo_url: this.headerPreviewUrl || undefined,
            color: this.clubColor || undefined,
        }).subscribe({
            next: (club) => { this.toast.show('Club created!'); this.router.navigate(['/clubs', club.id]); },
            error: () => { this.error = 'Failed to create club.'; this.loading = false; }
        });
    }
}
