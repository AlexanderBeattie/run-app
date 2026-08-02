import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="top">
        <div class="logo">KLUB</div>
        <div class="tagline">Outrun the algorithm.</div>
      </div>
      <div class="form">
        <h1>Reset your password</h1>
        <p>Enter your email and we'll send you a reset link</p>
        @if (!submitted()) {
          <div class="field"><label for="forgot-email">Email</label><input id="forgot-email" type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" placeholder="you@example.com" autocomplete="email" /></div>
          @if (error()) { <div class="error">{{ error() }}</div> }
          <button class="submit" (click)="submit()" [disabled]="loading()">{{ loading() ? 'Sending...' : 'Send reset link' }}</button>
          <p class="switch"><a routerLink="/login">Back to login</a></p>
        } @else {
          <div class="success">
            <div class="success-icon">✓</div>
            <p class="success-message">If that email exists, a reset link has been sent. Check your inbox.</p>
            <p class="switch"><a routerLink="/login">Back to login</a></p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; min-height: 100dvh; background: #0D0D0D; display: flex; flex-direction: column; }
    .top { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px 20px; }
    .logo { font-size: 40px; font-weight: 700; letter-spacing: 0.2em; color: #1D9E75; margin-bottom: 8px; }
    .tagline { font-size: 14px; color: rgba(255,255,255,0.6); }
    .form { background: #fff; border-radius: var(--radius-sheet, 24px) var(--radius-sheet, 24px) 0 0; padding: 28px 20px 40px; }
    h1 { font-size: 22px; font-weight: 500; color: #0D0D0D; margin-bottom: 4px; }
    p { font-size: 14px; color: #6B6B68; margin-bottom: 24px; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    label { font-size: 13px; font-weight: 500; color: #3D3D3B; }
    input { border: 1.5px solid rgba(13,13,12,0.10); border-radius: 12px; padding: 14px 16px; font-size: 16px; font-family: inherit; outline: none; background: #F7F7F5; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; }
    input:focus { border-color: #1D9E75; background: #fff; box-shadow: 0 0 0 3px rgba(29,158,117,0.15); }
    input:disabled { background: #F7F7F5; cursor: not-allowed; }
    .error { background: #FCEBEB; color: #A32D2D; border-radius: 12px; padding: 12px; font-size: 14px; margin-bottom: 14px; }
    .submit { width: 100%; background: #0F6E56; color: #fff; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 600; letter-spacing: -0.01em; cursor: pointer; font-family: inherit; margin-bottom: 16px; box-shadow: 0 2px 10px rgba(15,110,86,0.30); transition: transform 0.15s ease, box-shadow 0.2s ease; }
    .submit:active { transform: scale(0.985); box-shadow: 0 1px 4px rgba(15,110,86,0.25); }
    .submit:disabled { background: #0F6E56; opacity: 0.55; cursor: not-allowed; }
    .switch { font-size: 14px; color: #6B6B68; text-align: center; }
    .switch a { color: #1D9E75; font-weight: 500; }
    .success { text-align: center; }
    .success-icon { font-size: 48px; color: #1D9E75; margin-bottom: 16px; font-weight: 700; }
    .success-message { font-size: 14px; color: #6B6B68; line-height: 1.5; margin-bottom: 24px; }
  `]
})
export class ForgotPasswordComponent {
  http = inject(HttpClient);
  router = inject(Router);

  email = signal('');
  loading = signal(false);
  submitted = signal(false);
  error = signal('');

  submit() {
    this.error.set('');
    const emailValue = this.email().trim();

    if (!emailValue) {
      this.error.set('Please enter your email address.');
      return;
    }

    this.loading.set(true);
    this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email: emailValue }).subscribe({
      next: () => {
        this.submitted.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Something went wrong. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
