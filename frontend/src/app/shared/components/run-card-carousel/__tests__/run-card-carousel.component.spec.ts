import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RunCardCarouselComponent } from '../run-card-carousel.component';
import { RunEvent } from '../../../../core/models/run-event.model';

const makeRun = (overrides: Partial<RunEvent> = {}): RunEvent => ({
  id: 'run-1',
  clubId: 'club-1',
  clubName: 'Test Club',
  title: 'Morning Run',
  startLocation: { lat: 0, lng: 0 },
  endLocation: { lat: 0, lng: 0 },
  startAddress: '1 Start St',
  endAddress: '1 End St',
  date: new Date(Date.now() + 86400000),
  distanceKm: 5,
  estimatedMinutes: 30,
  attendees: [],
  pace: 'easy',
  tags: [],
  ...overrides,
});

async function setup(runs: RunEvent[] = [], selectedRunId: string | null = null) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [RunCardCarouselComponent],
    providers: [provideRouter([])],
  }).compileComponents();

  const fixture: ComponentFixture<RunCardCarouselComponent> = TestBed.createComponent(RunCardCarouselComponent);
  const component = fixture.componentInstance;
  component.runs = runs;
  component.selectedRunId = selectedRunId;
  fixture.detectChanges();
  return { fixture, component };
}

describe('RunCardCarouselComponent', () => {
  // ── getBannerColor ────────────────────────────────────────────────────────

  describe('getBannerColor()', () => {
    it('returns teal for easy', async () => {
      const { component } = await setup();
      expect(component.getBannerColor('easy')).toBe('#0d9488');
    });

    it('returns green for social', async () => {
      const { component } = await setup();
      expect(component.getBannerColor('social')).toBe('#16a34a');
    });

    it('returns blue for moderate', async () => {
      const { component } = await setup();
      expect(component.getBannerColor('moderate')).toBe('#2563eb');
    });

    it('returns red for fast', async () => {
      const { component } = await setup();
      expect(component.getBannerColor('fast')).toBe('#dc2626');
    });

    it('returns amber for tempo', async () => {
      const { component } = await setup();
      expect(component.getBannerColor('tempo')).toBe('#d97706');
    });

    it('returns grey for undefined pace', async () => {
      const { component } = await setup();
      expect(component.getBannerColor(undefined)).toBe('#4b5563');
    });

    it('returns grey for unknown pace string', async () => {
      const { component } = await setup();
      expect(component.getBannerColor('unknown')).toBe('#4b5563');
    });
  });

  // ── card rendering ────────────────────────────────────────────────────────

  describe('card rendering', () => {
    it('renders no cards when runs is empty', async () => {
      const { fixture } = await setup([]);
      const cards = fixture.nativeElement.querySelectorAll('.mini-card');
      expect(cards.length).toBe(0);
    });

    it('renders the correct number of cards', async () => {
      const runs = [makeRun({ id: 'r1' }), makeRun({ id: 'r2' }), makeRun({ id: 'r3' })];
      const { fixture } = await setup(runs);
      const cards = fixture.nativeElement.querySelectorAll('.mini-card');
      expect(cards.length).toBe(3);
    });

    it('displays run title in card body', async () => {
      const { fixture } = await setup([makeRun({ title: 'Sunset Run' })]);
      const title = fixture.nativeElement.querySelector('.card-title');
      expect(title.textContent).toContain('Sunset Run');
    });

    it('displays club name in card meta', async () => {
      const { fixture } = await setup([makeRun({ clubName: 'Speed Club' })]);
      const metas = fixture.nativeElement.querySelectorAll('.card-meta');
      expect(metas[0].textContent).toContain('Speed Club');
    });

    it('displays attendee count in going-badge', async () => {
      const run = makeRun({ attendees: [{ id: 'u1' } as any, { id: 'u2' } as any] });
      const { fixture } = await setup([run]);
      const badge = fixture.nativeElement.querySelector('.going-badge');
      expect(badge.textContent).toContain('2 going');
    });

    it('shows 0 going when attendees is empty', async () => {
      const { fixture } = await setup([makeRun({ attendees: [] })]);
      const badge = fixture.nativeElement.querySelector('.going-badge');
      expect(badge.textContent).toContain('0 going');
    });
  });

  // ── active card styling ───────────────────────────────────────────────────

  describe('active card styling', () => {
    it('applies .active class to the card matching selectedRunId', async () => {
      const runs = [makeRun({ id: 'r1' }), makeRun({ id: 'r2' })];
      const { fixture } = await setup(runs, 'r1');
      const cards = fixture.nativeElement.querySelectorAll('.mini-card');
      expect(cards[0].classList).toContain('active');
      expect(cards[1].classList).not.toContain('active');
    });

    it('applies .active to second card when selectedRunId matches second run', async () => {
      const runs = [makeRun({ id: 'r1' }), makeRun({ id: 'r2' })];
      const { fixture } = await setup(runs, 'r2');
      const cards = fixture.nativeElement.querySelectorAll('.mini-card');
      expect(cards[0].classList).not.toContain('active');
      expect(cards[1].classList).toContain('active');
    });

    it('no card has .active when selectedRunId is null', async () => {
      const runs = [makeRun({ id: 'r1' }), makeRun({ id: 'r2' })];
      const { fixture } = await setup(runs, null);
      const cards = fixture.nativeElement.querySelectorAll('.mini-card');
      cards.forEach((card: Element) => {
        expect(card.classList).not.toContain('active');
      });
    });

    it('no card has .active when selectedRunId does not match any run', async () => {
      const runs = [makeRun({ id: 'r1' }), makeRun({ id: 'r2' })];
      const { fixture } = await setup(runs, 'r-nonexistent');
      const cards = fixture.nativeElement.querySelectorAll('.mini-card');
      cards.forEach((card: Element) => {
        expect(card.classList).not.toContain('active');
      });
    });
  });

  // ── cardTapped output ─────────────────────────────────────────────────────

  describe('cardTapped output', () => {
    it('emits the run id when a card is clicked', async () => {
      const { fixture, component } = await setup([makeRun({ id: 'r1' })]);
      const emitSpy = jest.spyOn(component.cardTapped, 'emit');
      const card = fixture.nativeElement.querySelector('.mini-card');
      card.click();
      expect(emitSpy).toHaveBeenCalledWith('r1');
    });

    it('emits the correct id for the second card', async () => {
      const runs = [makeRun({ id: 'r1' }), makeRun({ id: 'r2' })];
      const { fixture, component } = await setup(runs);
      const emitSpy = jest.spyOn(component.cardTapped, 'emit');
      const cards = fixture.nativeElement.querySelectorAll('.mini-card');
      cards[1].click();
      expect(emitSpy).toHaveBeenCalledWith('r2');
    });
  });

  // ── onScroll / timer ──────────────────────────────────────────────────────

  describe('onScroll()', () => {
    it('sets a scroll timer after onScroll()', async () => {
      jest.useFakeTimers();
      const { component } = await setup([makeRun()]);
      component.onScroll();
      expect((component as unknown as { scrollTimer: ReturnType<typeof setTimeout> | null }).scrollTimer).not.toBeNull();
      jest.useRealTimers();
    });

    it('clears previous timer before setting a new one on repeated scroll', async () => {
      jest.useFakeTimers();
      const clearSpy = jest.spyOn(window, 'clearTimeout');
      const { component } = await setup([makeRun()]);
      component.onScroll();
      component.onScroll(); // second call should clear first timer
      expect(clearSpy).toHaveBeenCalled();
      jest.useRealTimers();
      clearSpy.mockRestore();
    });
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────

  describe('ngOnDestroy()', () => {
    it('clears scroll timer on destroy', async () => {
      jest.useFakeTimers();
      const clearSpy = jest.spyOn(window, 'clearTimeout');
      const { component } = await setup([makeRun()]);
      component.onScroll(); // set the timer
      component.ngOnDestroy();
      expect(clearSpy).toHaveBeenCalled();
      jest.useRealTimers();
      clearSpy.mockRestore();
    });

    it('does not throw when destroyed without a pending timer', async () => {
      const { component } = await setup([]);
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
