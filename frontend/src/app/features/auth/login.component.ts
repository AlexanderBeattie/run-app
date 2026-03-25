import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="top">
        <div class="logo">KLUB</div>
        <div class="tagline">Outrun the algorithm.</div>
      </div>
      <div class="form">
        <h1>Welcome back</h1>
        <p>Log in to find your next run</p>
        <div class="field"><label>Email</label><input type="email" [(ngModel)]="email" placeholder="you@example.com" autocomplete="email" /></div>
        <div class="field"><label>Password</label><input type="password" [(ngModel)]="password" placeholder="••••••••" (keyup.enter)="login()" autocomplete="current-password" /></div>
        @if (error) { <div class="error">{{ error }}</div> }
        <button class="submit" (click)="login()">Log in</button>
        <p class="forgot"><a routerLink="/forgot-password">Forgot password?</a></p>
        <p class="switch">Don't have an account? <a routerLink="/register">Join KLUB</a></p>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; min-height: 100dvh; background: #0D0D0D; display: flex; flex-direction: column; }
    .top { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px 20px; }
    .logo { font-size: 40px; font-weight: 700; letter-spacing: 0.2em; color: #1D9E75; margin-bottom: 8px; }
    .tagline { font-size: 14px; color: rgba(255,255,255,0.4); }
    .form { background: #fff; border-radius: 24px 24px 0 0; padding: 28px 20px 40px; }
    h1 { font-size: 22px; font-weight: 500; color: #0D0D0D; margin-bottom: 4px; }
    p { font-size: 14px; color: #6B6B68; margin-bottom: 24px; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    label { font-size: 13px; font-weight: 500; color: #3D3D3B; }
    input { border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 14px; font-size: 16px; font-family: inherit; outline: none; background: #F7F7F5; }
    input:focus { border-color: #1D9E75; background: #fff; }
    .error { background: #FCEBEB; color: #A32D2D; border-radius: 10px; padding: 12px; font-size: 14px; margin-bottom: 14px; }
    .submit { width: 100%; background: #1D9E75; color: #E1F5EE; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; font-family: inherit; margin-bottom: 16px; }
    .forgot { font-size: 14px; color: #6B6B68; text-align: center; margin-bottom: 12px; }
    .forgot a { color: #1D9E75; font-weight: 500; }
    .switch { font-size: 14px; color: #6B6B68; text-align: center; }
    .switch a { color: #1D9E75; font-weight: 500; }
  `]
})
export class LoginComponent {
  auth = inject(AuthService); router = inject(Router);
  email=''; password=''; error='';
  login() {
    if (!this.email || !this.password) { this.error = 'Please enter your email and password.'; return; }
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/home']),
      error: () => this.error = 'Invalid email or password.'
    });
  }
}