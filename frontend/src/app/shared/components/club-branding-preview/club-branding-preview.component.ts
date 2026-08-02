import { Component, Input, computed } from '@angular/core';

@Component({
  selector: 'app-club-branding-preview',
  standalone: true,
  imports: [],
  template: `
    <div class="preview-card">
      <div class="preview-label">Live Preview</div>
      <div class="preview-content">
        <div
          class="avatar-circle"
          [style.background]="selectedColor || '#1D9E75'"
          [style.color]="textColor()"
        >
          {{ initial() }}
        </div>
        <div class="preview-info">
          <div class="preview-name">{{ clubName || 'Your Club Name' }}</div>
          <div class="preview-sub">Running Club</div>
        </div>
        <div
          class="color-dot"
          [style.background]="selectedColor || '#1D9E75'"
        ></div>
      </div>
    </div>
  `,
  styles: [`
    .preview-card {
      background: #1a1a2e;
      border: 1px solid #2a2a4a;
      border-radius: 14px;
      padding: 14px 16px;
    }

    .preview-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #5555aa;
      margin-bottom: 12px;
    }

    .preview-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      flex-shrink: 0;
      transition: background 0.2s ease;
    }

    .preview-info {
      flex: 1;
      min-width: 0;
    }

    .preview-name {
      font-size: 15px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preview-sub {
      font-size: 12px;
      color: #8888aa;
      margin-top: 2px;
    }

    .color-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.15);
      flex-shrink: 0;
      transition: background 0.2s ease;
    }
  `],
})
export class ClubBrandingPreviewComponent {
  @Input() clubName = '';
  @Input() selectedColor = '';

  initial = computed(() => {
    const name = this.clubName?.trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  });

  textColor = computed(() => {
    const hex = this.selectedColor?.replace('#', '');
    if (!hex || hex.length < 6) return '#ffffff';
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 128 ? '#0a0a1a' : '#ffffff';
  });
}
