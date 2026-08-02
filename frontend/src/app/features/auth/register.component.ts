import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="top">
        <div class="logo">KLUB</div>
        <div class="tagline">Find your pace, connect with your crew.</div>
      </div>
      <div class="form">
        <h1>Join KLUB</h1>
        <div class="role-toggle">
          <button [class.active]="role === 'runner'" (click)="role = 'runner'">I'm a runner</button>
          <button [class.active]="role === 'organizer'" (click)="role = 'organizer'">I run a club</button>
        </div>
        <div class="field"><label for="register-name">Name</label><input id="register-name" [(ngModel)]="displayName" placeholder="Your name" autocomplete="name" /></div>
        <div class="field"><label for="register-email">Email</label><input id="register-email" type="email" [(ngModel)]="email" placeholder="you@example.com" autocomplete="email" /></div>
        <div class="field"><label for="register-password">Password</label><input id="register-password" type="password" [(ngModel)]="password" placeholder="Min. 8 characters" autocomplete="new-password" /></div>
        @if (error) { <div class="error">{{ error }}</div> }
        <button class="submit" (click)="register()">Create account</button>
        <p class="switch">Already have an account? <a routerLink="/login">Log in</a></p>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; min-height: 100dvh; background: #0D0D0D; display: flex; flex-direction: column; }
    .top { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px 20px; }
    .logo { font-size: 40px; font-weight: 700; letter-spacing: 0.2em; color: #1D9E75; margin-bottom: 8px; }
    .tagline { font-size: 14px; color: rgba(255,255,255,0.6); text-align: center; }
    .form { background: #fff; border-radius: var(--radius-sheet, 24px) var(--radius-sheet, 24px) 0 0; padding: 28px 20px 40px; }
    h1 { font-size: 22px; font-weight: 500; color: #0D0D0D; margin-bottom: 20px; }
    .role-toggle { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid rgba(13,13,12,0.10); border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
    .role-toggle button { padding: 12px; font-size: 14px; font-weight: 500; background: none; border: none; cursor: pointer; font-family: inherit; color: #6B6B68; }
    .role-toggle button.active { background: #0F6E56; color: #fff; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    label { font-size: 13px; font-weight: 500; color: #3D3D3B; }
    input { border: 1.5px solid rgba(13,13,12,0.10); border-radius: 12px; padding: 14px 16px; font-size: 16px; font-family: inherit; outline: none; background: #F7F7F5; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; }
    input:focus { border-color: #1D9E75; background: #fff; box-shadow: 0 0 0 3px rgba(29,158,117,0.15); }
    .error { background: #FCEBEB; color: #A32D2D; border-radius: 12px; padding: 12px; font-size: 14px; margin-bottom: 14px; }
    .submit { width: 100%; background: #0F6E56; color: #fff; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 600; letter-spacing: -0.01em; cursor: pointer; font-family: inherit; margin-bottom: 16px; box-shadow: 0 2px 10px rgba(15,110,86,0.30); transition: transform 0.15s ease, box-shadow 0.2s ease; }
    .submit:active { transform: scale(0.985); box-shadow: 0 1px 4px rgba(15,110,86,0.25); }
    .switch { font-size: 14px; color: #6B6B68; text-align: center; }
    .switch a { color: #1D9E75; font-weight: 500; }
  `]
})
export class RegisterComponent {
  auth = inject(AuthService); router = inject(Router);
  displayName=''; email=''; password=''; role: 'runner'|'organizer' = 'runner'; error='';
  register() {
    if (!this.displayName || !this.email || !this.password) { this.error = 'Please fill in all fields.'; return; }
    if (this.password.length < 8) { this.error = 'Password must be at least 8 characters.'; return; }
    this.auth.register(this.displayName, this.email, this.password, this.role).subscribe({
      next: () => this.router.navigate(['/home']),
      error: () => this.error = 'Registration failed. Please try again.'
    });
  }
}