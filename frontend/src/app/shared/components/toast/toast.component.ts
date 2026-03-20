import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    template: `
    <div class="toast-stack">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="toast.type" (click)="toastService.dismiss(toast.id)">
          <span class="toast-icon">
            @if (toast.type === 'success') { ✓ }
            @else if (toast.type === 'error') { ✕ }
            @else { ℹ }
          </span>
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
    styles: [`
    .toast-stack { position: fixed; top: 16px; left: 16px; right: 16px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
    .toast { pointer-events: auto; display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; animation: slideIn 0.25s ease; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .toast.success { background: #0F6E56; color: #E1F5EE; }
    .toast.error { background: #A32D2D; color: #FCEBEB; }
    .toast.info { background: #0D0D0D; color: #fff; }
    .toast-icon { font-size: 16px; flex-shrink: 0; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ToastComponent {
    toastService = inject(ToastService);
}