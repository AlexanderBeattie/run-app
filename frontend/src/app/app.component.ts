import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, ToastComponent],
  template: `
    <app-toast />
    <div class="app-shell">
      <main class="main-content" [class.has-nav]="showNav">
        <router-outlet />
      </main>
      @if (showNav) {
        <app-bottom-nav />
      }
    </div>
  `,
  styles: [`
    .app-shell { display: flex; flex-direction: column; height: 100vh; height: 100dvh; overflow: hidden; background: var(--klub-surface, #F7F7F5); }
    .main-content { flex: 1; overflow-y: auto; overflow-x: hidden; }
    .main-content.has-nav { padding-bottom: 0; }

    /* Desktop: centred app column on the branded backdrop */
    @media (min-width: 768px) {
      .app-shell {
        max-width: 520px;
        margin: 0 auto;
        box-shadow: 0 0 0 0.5px rgba(255, 255, 255, 0.14), 0 24px 80px rgba(0, 0, 0, 0.55);
      }
    }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  router = inject(Router);

  get showNav() {
    const url = this.router.url;
    return this.auth.isLoggedIn() && !url.includes('/login') && !url.includes('/register');
  }
}