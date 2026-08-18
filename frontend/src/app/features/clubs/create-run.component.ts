import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CreateRunWizardComponent } from './create-run-wizard/create-run-wizard.component';

@Component({
  selector: 'app-create-run',
  standalone: true,
  imports: [CreateRunWizardComponent],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back" (click)="router.navigate(['/organiser'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div class="top-title">Post a Run</div>
        <div style="width:32px"></div>
      </div>
      <app-create-run-wizard />
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; min-height: 100%; background: #0a0a1a; }
    .top-bar { background: #0D0D0D; padding: 16px 16px 14px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .back { background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; padding: 4px; }
    .top-title { font-size: 16px; font-weight: 500; color: #fff; flex: 1; text-align: center; }
    app-create-run-wizard { flex: 1; display: flex; flex-direction: column; }
  `],
})
export class CreateRunComponent {
  router = inject(Router);
}
