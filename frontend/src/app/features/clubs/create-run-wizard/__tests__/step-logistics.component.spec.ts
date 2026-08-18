import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StepLogisticsComponent } from '../step-logistics.component';
import { WizardService } from '../wizard.service';

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [StepLogisticsComponent],
    providers: [
      WizardService,
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });
  const fixture = TestBed.createComponent(StepLogisticsComponent);
  const component = fixture.componentInstance;
  const wiz = TestBed.inject(WizardService);
  fixture.detectChanges();
  return { fixture, component, wiz };
}

describe('StepLogisticsComponent', () => {
  describe('club selector placeholder', () => {
    it('renders Independent Run (no club) as default option', () => {
      const { fixture } = setup();
      const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
      expect(select.options[0].text).toBe('Independent Run (no club)');
    });
  });

  describe('isFieldInvalid()', () => {
    it('returns false when field is not touched', () => {
      const { component } = setup();
      expect(component.isFieldInvalid('title')).toBe(false);
    });

    it('returns true when field is touched and empty', () => {
      const { component, wiz } = setup();
      wiz.touch('title');
      expect(component.isFieldInvalid('title')).toBe(true);
    });

    it('returns false when field is touched and has a value', () => {
      const { component, wiz } = setup();
      wiz.patch({ title: 'Morning Run' });
      wiz.touch('title');
      expect(component.isFieldInvalid('title')).toBe(false);
    });

    it('returns true for startAddress when touched and empty', () => {
      const { component, wiz } = setup();
      wiz.touch('startAddress');
      expect(component.isFieldInvalid('startAddress')).toBe(true);
    });

    it('returns true for endAddress when touched and empty', () => {
      const { component, wiz } = setup();
      wiz.touch('endAddress');
      expect(component.isFieldInvalid('endAddress')).toBe(true);
    });
  });

  describe('error class binding', () => {
    it('adds field-input--error class to title input when touched and empty', () => {
      const { fixture, wiz } = setup();
      wiz.touch('title');
      fixture.detectChanges();
      const inputs = fixture.nativeElement.querySelectorAll('input[type="text"]');
      expect(inputs[0].classList).toContain('field-input--error');
    });

    it('does not add field-input--error class to title input when untouched', () => {
      const { fixture } = setup();
      const inputs = fixture.nativeElement.querySelectorAll('input[type="text"]');
      expect(inputs[0].classList).not.toContain('field-input--error');
    });

    it('removes field-input--error class when field has a value', () => {
      const { fixture, wiz } = setup();
      wiz.patch({ title: 'Morning Run' });
      wiz.touch('title');
      fixture.detectChanges();
      const inputs = fixture.nativeElement.querySelectorAll('input[type="text"]');
      expect(inputs[0].classList).not.toContain('field-input--error');
    });
  });
});
