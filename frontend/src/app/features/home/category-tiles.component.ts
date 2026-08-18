import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface HomeCategory {
  label: string;
  emoji: string;
  bg: string;
  params: Record<string, unknown>;
}

@Component({
  selector: 'app-category-tiles',
  standalone: true,
  template: `
    <div class="categories">
      @for (cat of categories; track cat.label) {
        <button class="cat-wrap" [attr.aria-label]="'Filter by ' + cat.label" (click)="select.emit(cat)">
          <div class="cat-tile" [class.cat-active]="active === cat.label" [style.background]="cat.bg">
            <span class="cat-emoji">{{ cat.emoji }}</span>
          </div>
          <div class="cat-label" [class.label-active]="active === cat.label">{{ cat.label }}</div>
        </button>
      }
    </div>
  `,
  styles: [`
    .categories {
      display: flex;
      gap: 12px;
      padding: 0 16px 22px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .categories::-webkit-scrollbar { display: none; }
    .cat-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      cursor: pointer;
      flex-shrink: 0;
      background: none;
      border: none;
      padding: 0;
      font-family: inherit;
    }
    .cat-tile {
      width: 72px; height: 72px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s var(--ease-out, ease);
    }
    .cat-wrap:active .cat-tile { transform: scale(0.93); }
    .cat-tile.cat-active {
      box-shadow: 0 0 0 3px #fff, 0 0 0 5px var(--klub-black, #0D0D0D);
    }
    .cat-emoji { font-size: 30px; line-height: 1; }
    .cat-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--klub-muted, #6B6B68);
      white-space: nowrap;
    }
    .cat-label.label-active {
      color: var(--klub-black, #0D0D0D);
      font-weight: 700;
    }
  `]
})
export class CategoryTilesComponent {
  @Input({ required: true }) categories: HomeCategory[] = [];
  @Input() active = 'All';
  @Output() select = new EventEmitter<HomeCategory>();
}
