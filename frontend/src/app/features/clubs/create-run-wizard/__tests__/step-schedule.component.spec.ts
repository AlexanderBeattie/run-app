import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StepScheduleComponent } from '../step-schedule.component';
import { WizardService } from '../wizard.service';

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [StepScheduleComponent],
    providers: [
      WizardService,
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });
  const fixture = TestBed.createComponent(StepScheduleComponent);
  const component = fixture.componentInstance;
  const wiz = TestBed.inject(WizardService);
  fixture.detectChanges();
  return { fixture, component, wiz };
}

function futureDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

function pastDate(): string {
  return '2020-01-01';
}

describe('StepScheduleComponent', () => {
  describe('isFieldInvalid()', () => {
    it('returns false when date is not touched', () => {
      const { component } = setup();
      expect(component.isFieldInvalid('date')).toBe(false);
    });

    it('returns true when date is touched and empty', () => {
      const { component, wiz } = setup();
      wiz.touch('date');
      expect(component.isFieldInvalid('date')).toBe(true);
    });

    it('returns false when date is touched and has a value', () => {
      const { component, wiz } = setup();
      wiz.patch({ date: futureDate() });
      wiz.touch('date');
      expect(component.isFieldInvalid('date')).toBe(false);
    });

    it('returns true when time is touched and empty', () => {
      const { component, wiz } = setup();
      wiz.touch('time');
      expect(component.isFieldInvalid('time')).toBe(true);
    });
  });

  describe('isDateInPast()', () => {
    it('returns false when date is empty', () => {
      const { component } = setup();
      expect(component.isDateInPast()).toBe(false);
    });

    it('returns true when date is in the past', () => {
      const { component, wiz } = setup();
      wiz.patch({ date: pastDate() });
      expect(component.isDateInPast()).toBe(true);
    });

    it('returns false when date is in the future', () => {
      const { component, wiz } = setup();
      wiz.patch({ date: futureDate() });
      expect(component.isDateInPast()).toBe(false);
    });
  });

  describe('error class binding', () => {
    it('adds field-input--error class to date input when date is in the past', () => {
      const { fixture, wiz } = setup();
      wiz.patch({ date: pastDate() });
      fixture.detectChanges();
      const dateInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="date"]');
      expect(dateInput.classList).toContain('field-input--error');
    });

    it('does not add field-input--error class to date input when date is in the future', () => {
      const { fixture, wiz } = setup();
      wiz.patch({ date: futureDate() });
      fixture.detectChanges();
      const dateInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="date"]');
      expect(dateInput.classList).not.toContain('field-input--error');
    });

    it('adds field-input--error class to time input when touched and empty', () => {
      const { fixture, wiz } = setup();
      wiz.touch('time');
      fixture.detectChanges();
      const timeInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="time"]');
      expect(timeInput.classList).toContain('field-input--error');
    });
  });

  describe('error messages', () => {
    it('shows "Date must be in the future" when date is in the past', () => {
      const { fixture, wiz } = setup();
      wiz.patch({ date: pastDate() });
      fixture.detectChanges();
      const errors = fixture.nativeElement.querySelectorAll('.field-error');
      const texts = Array.from(errors).map((el: any) => el.textContent.trim());
      expect(texts).toContain('Date must be in the future');
    });

    it('does not show past-date error when date is in the future', () => {
      const { fixture, wiz } = setup();
      wiz.patch({ date: futureDate() });
      fixture.detectChanges();
      const errors = fixture.nativeElement.querySelectorAll('.field-error');
      const texts = Array.from(errors).map((el: any) => el.textContent.trim());
      expect(texts).not.toContain('Date must be in the future');
    });

    it('shows "Date is required" when date field is touched and empty', () => {
      const { fixture, wiz } = setup();
      wiz.touch('date');
      fixture.detectChanges();
      const errors = fixture.nativeElement.querySelectorAll('.field-error');
      const texts = Array.from(errors).map((el: any) => el.textContent.trim());
      expect(texts).toContain('Date is required');
    });
  });
});
