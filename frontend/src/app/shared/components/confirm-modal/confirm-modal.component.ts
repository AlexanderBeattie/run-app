import { Component, Input, Output, EventEmitter, inject, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    <div class="overlay" (click)="onBackdropClick()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <h2 class="modal-title">{{ title }}</h2>
          <p class="modal-message">{{ message }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="onCancel()">Cancel</button>
            <button class="btn-confirm" [class.destructive]="destructive" (click)="onConfirm()">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal {
      background: #fff;
      border-radius: 20px 20px 0 0;
      width: 100%;
      max-width: 560px;
      padding: 24px 20px;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .modal-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #0D0D0D;
      margin: 0;
    }

    .modal-message {
      font-size: 15px;
      color: #6B6B68;
      margin: 0;
      line-height: 1.4;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 8px;
    }

    .btn-cancel,
    .btn-confirm {
      flex: 1;
      padding: 12px 16px;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-cancel {
      background: #F7F7F5;
      color: #0D0D0D;
      border: 0.5px solid rgba(0, 0, 0, 0.12);
    }

    .btn-cancel:active {
      opacity: 0.8;
    }

    .btn-confirm {
      background: #1D9E75;
      color: #E1F5EE;
    }

    .btn-confirm:active {
      opacity: 0.9;
    }

    .btn-confirm.destructive {
      background: #E53935;
      color: #fff;
    }

    @media (min-width: 600px) {
      .overlay {
        align-items: center;
        padding: 20px;
      }

      .modal {
        border-radius: 20px;
      }
    }
  `]
})
export class ConfirmModalComponent {
  @Input() title: string = 'Confirm';
  @Input() message: string = 'Are you sure?';
  @Input() confirmLabel: string = 'Confirm';
  @Input() destructive: boolean = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }

  onBackdropClick() {
    this.cancelled.emit();
  }
}
