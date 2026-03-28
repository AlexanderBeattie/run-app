import { Injectable } from '@angular/core';
import { RunEvent } from '../../core/models/run-event.model';

@Injectable({ providedIn: 'root' })
export class ShareCardService {

  async generateShareCard(run: RunEvent): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D canvas context');

    // Dark background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 630);
    gradient.addColorStop(0, '#0A2E1F');
    gradient.addColorStop(1, '#0D1A13');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Green accent bar on left edge
    ctx.fillStyle = '#1D9E75';
    ctx.fillRect(0, 0, 6, 630);

    // KLUB wordmark top-right
    ctx.fillStyle = '#1D9E75';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('KLUB', 1160, 56);

    // Club name (top-left, uppercase)
    ctx.fillStyle = '#1D9E75';
    ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(run.clubName.toUpperCase(), 60, 80);

    // Run title (large headline)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const titleText = this.truncateText(ctx, run.title, 1080);
    ctx.fillText(titleText, 60, 200);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 240);
    ctx.lineTo(1140, 240);
    ctx.stroke();

    // Stats row
    const stats: { value: string; label: string }[] = [
      { value: `${run.distanceKm}k`, label: 'Distance' },
      { value: this.formatTime(run.estimatedMinutes), label: 'Est. Time' },
      { value: String(run.attendees?.length ?? 0), label: 'Ran together' },
    ];
    if (run.pace) {
      stats.push({ value: run.pace.charAt(0).toUpperCase() + run.pace.slice(1), label: 'Pace' });
    }

    const statWidth = stats.length <= 3 ? 300 : 240;
    stats.forEach((stat, i) => {
      const x = 60 + i * statWidth;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(stat.value, x, 310);

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '400 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(stat.label, x, 342);
    });

    // Date row
    const formattedDate = this.formatDate(run.date);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '400 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(formattedDate, 60, 420);

    // Start address
    if (run.startAddress) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '400 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const location = this.truncateText(ctx, `📍 ${run.startAddress}`, 900);
      ctx.fillText(location, 60, 458);
    }

    // Tag pills
    if (run.tags && run.tags.length > 0) {
      let tagX = 60;
      const pillH = 32;
      const pillY = 530;
      ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

      for (const tag of run.tags.slice(0, 4)) {
        const tagText = `#${tag}`;
        const textWidth = ctx.measureText(tagText).width;
        const pillW = textWidth + 24;

        ctx.fillStyle = 'rgba(29, 158, 117, 0.2)';
        ctx.beginPath();
        if ('roundRect' in ctx && typeof (ctx as { roundRect?: unknown }).roundRect === 'function') {
          (ctx as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void })
            .roundRect(tagX, pillY, pillW, pillH, 999);
        } else {
          ctx.rect(tagX, pillY, pillW, pillH);
        }
        ctx.fill();

        ctx.fillStyle = '#1D9E75';
        ctx.textAlign = 'left';
        ctx.fillText(tagText, tagX + 12, pillY + 20);

        tagX += pillW + 8;
      }
    }

    // Footer URL
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '400 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('runwithklub.com', 1140, 600);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      }, 'image/png');
    });
  }

  private truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let truncated = text;
    while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '…';
  }

  private formatTime(minutes: number): string {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }
}
