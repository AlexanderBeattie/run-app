import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="bottom-nav">
      <a class="nav-item" routerLink="/home" [class.active]="isActive('/home')">
        <div class="icon-wrap" [class.active]="isActive('/home')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="isActive('/home') ? '#fff' : '#6B6B68'" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        </div>
        <span>Home</span>
      </a>

      <a class="nav-item" routerLink="/map" [class.active]="isActive('/map')">
        <div class="icon-wrap" [class.active]="isActive('/map')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="isActive('/map') ? '#fff' : '#6B6B68'" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
          </svg>
        </div>
        <span>Map</span>
      </a>

      <a class="nav-item" routerLink="/clubs" [class.active]="isActive('/clubs')">
        <div class="icon-wrap" [class.active]="isActive('/clubs')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="isActive('/clubs') ? '#fff' : '#6B6B68'" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <span>Clubs</span>
      </a>

      @if (auth.isLoggedIn()) {
        <a class="nav-item" routerLink="/profile" [class.active]="isActive('/profile')">
          <div class="icon-wrap" [class.active]="isActive('/profile')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="isActive('/profile') ? '#fff' : '#6B6B68'" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span>Profile</span>
        </a>
      } @else {
        <a class="nav-item" routerLink="/login" [class.active]="isActive('/login')">
          <div class="icon-wrap" [class.active]="isActive('/login')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="isActive('/login') ? '#fff' : '#6B6B68'" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span>Sign in</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .bottom-nav {
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-top: 0.5px solid rgba(13,13,12,0.08);
      display: flex; justify-content: space-around; align-items: center;
      padding: 6px 8px max(10px, env(safe-area-inset-bottom));
      position: sticky; bottom: 0; z-index: 100;
    }
    .nav-item {
      display: flex; flex-direction: column; align-items: center; gap: 3px;
      text-decoration: none; min-width: 64px; padding: 2px 0;
      border-radius: 12px;
    }
    .icon-wrap {
      width: 44px; height: 30px; border-radius: var(--radius-pill, 999px);
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s var(--ease-out, ease-out), transform 0.2s var(--ease-out, ease-out);
    }
    .icon-wrap.active { background: var(--klub-black, #0D0D0D); }
    .nav-item:active .icon-wrap { transform: scale(0.92); }
    .nav-item span {
      font-size: 11px; color: var(--klub-muted, #6B6B68);
      font-weight: 500; letter-spacing: 0.01em;
      transition: color 0.2s var(--ease-out, ease-out);
    }
    .nav-item.active span { color: var(--klub-black, #0D0D0D); font-weight: 600; }
  `]
})
export class BottomNavComponent {
  router = inject(Router);
  auth = inject(AuthService);
  isActive(path: string) { return this.router.url.startsWith(path); }
}