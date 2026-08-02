import { TestBed } from '@angular/core/testing';
import { WeatherBadgeComponent } from './weather-badge.component';

describe('WeatherBadgeComponent', () => {
  function setup(inputs: { temp?: number | null; condition?: string; icon?: string } = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [WeatherBadgeComponent],
    });
    const fixture = TestBed.createComponent(WeatherBadgeComponent);
    const component = fixture.componentInstance;
    if ('temp' in inputs) component.temp = inputs.temp!;
    if (inputs.condition !== undefined) component.condition = inputs.condition;
    if (inputs.icon !== undefined) component.icon = inputs.icon;
    fixture.detectChanges();
    return { fixture, component };
  }

  it('creates without error', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  describe('when temp is null (default)', () => {
    it('hides the badge container', () => {
      const { fixture } = setup();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.weather-badge')).toBeNull();
    });
  });

  describe('when temp is a positive number', () => {
    it('renders the badge', () => {
      const { fixture } = setup({ temp: 18, condition: 'Clear', icon: '☀️' });
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.weather-badge')).not.toBeNull();
    });

    it('displays the temperature in Celsius', () => {
      const { fixture } = setup({ temp: 18, condition: 'Clear', icon: '☀️' });
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.weather-temp')?.textContent).toContain('18°C');
    });

    it('displays the condition text', () => {
      const { fixture } = setup({ temp: 18, condition: 'Clear', icon: '☀️' });
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.weather-condition')?.textContent).toContain('Clear');
    });

    it('displays the icon', () => {
      const { fixture } = setup({ temp: 18, condition: 'Clear', icon: '☀️' });
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.weather-icon')?.textContent).toContain('☀️');
    });
  });

  describe('edge cases', () => {
    it('renders when temp is 0 (falsy but valid)', () => {
      const { fixture } = setup({ temp: 0 });
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.weather-badge')).not.toBeNull();
      expect(el.querySelector('.weather-temp')?.textContent).toContain('0°C');
    });

    it('renders without crash when temp is negative', () => {
      const { fixture } = setup({ temp: -5, condition: 'Snow', icon: '❄️' });
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.weather-badge')).not.toBeNull();
      expect(el.querySelector('.weather-temp')?.textContent).toContain('-5°C');
    });

    it('renders without crash when condition is empty string', () => {
      const { fixture, component } = setup({ temp: 10, condition: '' });
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.condition).toBe('');
    });

    it('renders without crash when icon is empty string', () => {
      const { fixture, component } = setup({ temp: 10, icon: '' });
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.icon).toBe('');
    });

    it('remains hidden when temp is explicitly set back to null', () => {
      const { fixture, component } = setup({ temp: 20 });
      expect(fixture.nativeElement.querySelector('.weather-badge')).not.toBeNull();

      component.temp = null;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.weather-badge')).toBeNull();
    });
  });
});
