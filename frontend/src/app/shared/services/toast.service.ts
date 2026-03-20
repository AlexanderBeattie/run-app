import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private counter = 0;
    toasts = signal<Toast[]>([]);

    show(message: string, type: 'success' | 'error' | 'info' = 'success') {
        const id = ++this.counter;
        this.toasts.update(t => [...t, { id, message, type }]);
        setTimeout(() => this.dismiss(id), 3000);
    }

    dismiss(id: number) {
        this.toasts.update(t => t.filter(toast => toast.id !== id));
    }
}