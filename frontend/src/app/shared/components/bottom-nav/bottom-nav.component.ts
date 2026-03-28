import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="bottom-nav">
      <a class="nav-item" routerLink="/home" [class.active]="isActive('/home')">
        <div class="icon-wrap" [class.active]="isActive('/home')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="isActive('/home') ? '#fff' : '#9B9B98'" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        </div>
        <span>Home</span>
      </a>

      <a class="nav-item" routerLink="/map" [class.active]="isActive('/map')">
        <div class="icon-wrap" [class.active]="isActive('/map')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="isActive('/map') ? '#fff' : '#9B9B98'" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
          </svg>
        </div>
        <span>Map</span>
      </a>

      <a class="nav-item" routerLink="/clubs" [class.active]="isActive('/clubs')">
        <div class="icon-wrap" [class.active]="isActive('/clubs')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="isActive('/clubs') ? '#fff' : '#9B9B98'" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <span>Clubs</span>
      </a>

      <a class="nav-item" routerLink="/profile" [class.active]="isActive('/profile')">
        <div class="icon-wrap" [class.active]="isActive('/profile')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="isActive('/profile') ? '#fff' : '#9B9B98'" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <span>Profile</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      background: #fff; border-top: 0.5px solid rgba(0,0,0,0.1);
      display: flex; justify-content: space-around; align-items: center;
      padding: 8px 0 max(12px, env(safe-area-inset-bottom));
      position: sticky; bottom: 0; z-index: 100;
    }
    .nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; text-decoration: none; min-width: 56px; }
    .icon-wrap { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
    .icon-wrap.active { background: #0D0D0D; }
    .nav-item span { font-size: 10px; color: #9B9B98; font-weight: 500; }
    .nav-item.active span { color: #0D0D0D; }
  `]
})
export class BottomNavComponent {
  router = inject(Router);
  isActive(path: string) { return this.router.url.startsWith(path); }
}