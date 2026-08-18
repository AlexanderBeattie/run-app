import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RunEvent } from '../../../core/models/run-event.model';
import { ShareCardService } from '../../services/share-card.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-share-card-modal',
  standalone: true,
  template: `
    <div class="overlay" (click)="onOverlay($event)">
      <div class="modal">
        <button class="close" (click)="close.emit()" aria-label="Close share card">✕</button>
        <h3>Share Run Card</h3>
        <p class="subtitle">{{ run.title }}</p>

        @if (generating()) {
          <div class="preview-placeholder" role="status" aria-label="Generating card">
            <div class="spinner"></div>
            <span>Generating card…</span>
          </div>
        } @else if (previewUrl()) {
          <img class="preview" [src]="previewUrl()!" alt="Run share card preview" />
        }

        <div class="actions">
          <button class="action-btn secondary" (click)="download()" [disabled]="generating()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Save Image
          </button>
          <button class="action-btn primary" (click)="share()" [disabled]="generating()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 600; padding: 20px;
    }
    .modal {
      background: #fff; border-radius: 20px; width: 100%; max-width: 520px;
      padding: 24px; position: relative;
    }
    .close {
      position: absolute; top: 16px; right: 16px; background: #F7F7F5;
      border: none; width: 32px; height: 32px; border-radius: 50%;
      font-size: 14px; cursor: pointer; color: #6B6B68;
      display: flex; align-items: center; justify-content: center;
      min-width: 44px; min-height: 44px;
    }
    h3 { font-size: 18px; font-weight: 600; color: #0D0D0D; margin: 0 0 4px; }
    .subtitle { font-size: 13px; color: #6B6B68; margin: 0 0 16px; }
    .preview { width: 100%; border-radius: 12px; display: block; }
    .preview-placeholder {
      width: 100%; aspect-ratio: 1200 / 630; background: #F7F7F5; border-radius: 12px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; color: #6B6B68; font-size: 14px;
    }
    .spinner {
      width: 24px; height: 24px; border: 2px solid #E0E0E0;
      border-top-color: #1D9E75; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .actions { display: flex; gap: 10px; margin-top: 16px; }
    .action-btn {
      flex: 1; display: flex; align-items: center; justify-content: center;
      gap: 8px; border: none; border-radius: 12px; padding: 14px;
      font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit;
      min-height: 44px;
    }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .action-btn.secondary { background: #F7F7F5; color: #0D0D0D; }
    .action-btn.primary { background: #0F6E56; color: #fff; }
    @media (min-width: 600px) {
      .modal { max-width: 560px; }
    }
  `]
})
export class ShareCardModalComponent implements OnInit, OnDestroy {
  @Input() run!: RunEvent;
  @Output() close = new EventEmitter<void>();

  private shareCardService = inject(ShareCardService);
  private toast = inject(ToastService);

  generating = signal(true);
  previewUrl = signal<string | null>(null);
  private blob: Blob | null = null;
  private objectUrl: string | null = null;

  ngOnInit(): void {
    this.generateCard();
  }

  private async generateCard(): Promise<void> {
    try {
      this.blob = await this.shareCardService.generateShareCard(this.run);
      this.objectUrl = URL.createObjectURL(this.blob);
      this.previewUrl.set(this.objectUrl);
    } catch {
      this.toast.show('Failed to generate share card');
    } finally {
      this.generating.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  async download(): Promise<void> {
    if (!this.blob) return;
    const url = URL.createObjectURL(this.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.run.title.replace(/\s+/g, '-').toLowerCase()}-run-card.png`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.show('Image saved!');
  }

  async share(): Promise<void> {
    if (!this.blob) return;

    const hasShare = typeof navigator.share === 'function';
    const hasCanShare = typeof navigator.canShare === 'function';
    if (hasShare && hasCanShare) {
      const file = new File([this.blob], `${this.run.title}-run-card.png`, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: this.run.title,
            text: `Ran ${this.run.distanceKm}k with ${this.run.clubName}! 🏃`,
          });
          return;
        } catch (e: unknown) {
          if (e instanceof Error && e.name === 'AbortError') return;
        }
      }
    }

    // Fallback: download the image
    await this.download();
  }

  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('overlay')) {
      this.close.emit();
    }
  }
}
