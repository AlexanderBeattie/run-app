import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, Subject, throwError } from 'rxjs';
import { RunnerProfileDialogComponent } from './runner-profile-dialog.component';
import { RunsService } from '../../../core/services/runs.service';

const MOCK_PROFILE = {
  id: 'user-1',
  display_name: 'Alice Runner',
  total_runs: 12,
  total_distance_km: 85.4,
  favorite_pace: 'moderate' as string | null,
  recent_runs: [
    { id: 'r1', title: 'Park 5K', club_name: 'KLUB', distance_km: 5, pace: 'easy', attended_date: '2024-01-10' },
  ],
};

function buildMockService(options: { profile?: typeof MOCK_PROFILE; error?: boolean; pending?: boolean } = {}) {
  const subject = new Subject<typeof MOCK_PROFILE>();
  const obs = options.pending
    ? subject.asObservable()
    : options.error
    ? throwError(() => new Error('network error'))
    : of(options.profile ?? MOCK_PROFILE);
  return { getUserProfile: jest.fn(() => obs) } as unknown as RunsService;
}

describe('RunnerProfileDialogComponent', () => {
  let fixture: ComponentFixture<RunnerProfileDialogComponent>;
  let component: RunnerProfileDialogComponent;

  function setup(mockSvc: RunsService) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RunnerProfileDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RunsService, useValue: mockSvc },
      ],
    });
    fixture = TestBed.createComponent(RunnerProfileDialogComponent);
    component = fixture.componentInstance;
    component.userId = 'user-1';
  }

  describe('loading state', () => {
    it('shows skeleton before data resolves', () => {
      setup(buildMockService({ pending: true }));
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.skeleton')).toBeTruthy();
      expect(el.querySelector('.av')).toBeNull();
    });
  });

  describe('populated state', () => {
    beforeEach(() => {
      setup(buildMockService());
      fixture.detectChanges(); // ngOnInit → of() emits synchronously → profile set
    });

    it('renders display name after loading', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.name')?.textContent?.trim()).toBe('Alice Runner');
    });

    it('renders total_runs stat', () => {
      const el: HTMLElement = fixture.nativeElement;
      const svs = el.querySelectorAll('.sv');
      expect(svs[0].textContent?.trim()).toBe('12');
    });

    it('renders favorite_pace stat', () => {
      const el: HTMLElement = fixture.nativeElement;
      const svs = el.querySelectorAll('.sv');
      expect(svs[2].textContent?.trim()).toBe('moderate');
    });

    it('renders recent runs list', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelectorAll('.recent-item')).toHaveLength(1);
      expect(el.querySelector('.recent-title')?.textContent?.trim()).toBe('Park 5K');
    });

    it('shows "No runs yet" when recent_runs is empty', () => {
      setup(buildMockService({ profile: { ...MOCK_PROFILE, recent_runs: [] } }));
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.no-runs')?.textContent).toContain('No runs yet');
    });
  });

  describe('error state', () => {
    it('shows error fallback when request fails', () => {
      setup(buildMockService({ error: true }));
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.error-state')).toBeTruthy();
      expect(el.querySelector('.skeleton')).toBeNull();
    });
  });

  describe('close interactions', () => {
    beforeEach(() => {
      setup(buildMockService());
      fixture.detectChanges();
    });

    it('emits close when close button is clicked', () => {
      jest.spyOn(component.close, 'emit');
      fixture.debugElement.query(By.css('.close')).triggerEventHandler('click', null);
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('emits close when overlay background is clicked', () => {
      jest.spyOn(component.close, 'emit');
      const overlay: HTMLElement = fixture.nativeElement.querySelector('.overlay');
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: overlay });
      component.onOverlay(event);
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('does not emit close when a child element inside overlay is clicked', () => {
      jest.spyOn(component.close, 'emit');
      const card: HTMLElement = fixture.nativeElement.querySelector('.card');
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: card });
      component.onOverlay(event);
      expect(component.close.emit).not.toHaveBeenCalled();
    });

    it('emits close when Escape key is pressed', () => {
      jest.spyOn(component.close, 'emit');
      component.onEscape();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });
});
