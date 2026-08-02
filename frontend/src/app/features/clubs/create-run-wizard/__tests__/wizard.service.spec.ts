import { TestBed } from '@angular/core/testing';
import { WizardService } from '../wizard.service';

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [WizardService] });
  return TestBed.inject(WizardService);
}

describe('WizardService', () => {
  // ── Step navigation ──────────────────────────────────────────────────────

  describe('step navigation', () => {
    it('starts on step 1', () => {
      const svc = setup();
      expect(svc.currentStep()).toBe(1);
    });

    it('nextStep advances to step 2', () => {
      const svc = setup();
      svc.nextStep();
      expect(svc.currentStep()).toBe(2);
    });

    it('nextStep advances through all 4 steps', () => {
      const svc = setup();
      svc.nextStep(); svc.nextStep(); svc.nextStep();
      expect(svc.currentStep()).toBe(4);
    });

    it('nextStep does not advance past step 4', () => {
      const svc = setup();
      svc.nextStep(); svc.nextStep(); svc.nextStep(); svc.nextStep();
      expect(svc.currentStep()).toBe(4);
    });

    it('prevStep does not go below step 1', () => {
      const svc = setup();
      svc.prevStep();
      expect(svc.currentStep()).toBe(1);
    });

    it('prevStep decrements from step 3 to step 2', () => {
      const svc = setup();
      svc.nextStep(); svc.nextStep();
      svc.prevStep();
      expect(svc.currentStep()).toBe(2);
    });

    it('can navigate forward and back', () => {
      const svc = setup();
      svc.nextStep(); svc.nextStep(); // step 3
      svc.prevStep();                 // step 2
      expect(svc.currentStep()).toBe(2);
    });
  });

  // ── patch ────────────────────────────────────────────────────────────────

  describe('patch()', () => {
    it('sets title without losing other fields', () => {
      const svc = setup();
      svc.patch({ title: 'Morning Run' });
      expect(svc.formData().title).toBe('Morning Run');
      expect(svc.formData().startAddress).toBe('');
    });

    it('merges partial updates', () => {
      const svc = setup();
      svc.patch({ title: 'Run A', startAddress: '123 Main St' });
      svc.patch({ endAddress: '456 Elm St' });
      expect(svc.formData().title).toBe('Run A');
      expect(svc.formData().startAddress).toBe('123 Main St');
      expect(svc.formData().endAddress).toBe('456 Elm St');
    });

    it('overwrites existing value when field is patched again', () => {
      const svc = setup();
      svc.patch({ title: 'Old Title' });
      svc.patch({ title: 'New Title' });
      expect(svc.formData().title).toBe('New Title');
    });

    it('sets nullable fields (pace, runType, clubId) to null', () => {
      const svc = setup();
      svc.patch({ pace: 'easy' });
      svc.patch({ pace: null });
      expect(svc.formData().pace).toBeNull();
    });

    it('sets tags array', () => {
      const svc = setup();
      svc.patch({ tags: ['morning', 'trail'] });
      expect(svc.formData().tags).toEqual(['morning', 'trail']);
    });
  });

  // ── touch ────────────────────────────────────────────────────────────────

  describe('touch()', () => {
    it('marks a field as touched', () => {
      const svc = setup();
      svc.touch('title');
      expect(svc.touched()['title']).toBe(true);
    });

    it('accumulates multiple touched fields', () => {
      const svc = setup();
      svc.touch('title');
      svc.touch('startAddress');
      expect(svc.touched()['title']).toBe(true);
      expect(svc.touched()['startAddress']).toBe(true);
    });

    it('touching same field twice does not lose other fields', () => {
      const svc = setup();
      svc.touch('title');
      svc.touch('date');
      svc.touch('title');
      expect(svc.touched()['date']).toBe(true);
    });

    it('starts with no touched fields', () => {
      const svc = setup();
      expect(svc.touched()).toEqual({});
    });
  });

  // ── reset ────────────────────────────────────────────────────────────────

  describe('reset()', () => {
    it('resets step back to 1', () => {
      const svc = setup();
      svc.nextStep(); svc.nextStep();
      svc.reset();
      expect(svc.currentStep()).toBe(1);
    });

    it('clears formData to initial state', () => {
      const svc = setup();
      svc.patch({ title: 'Run', startAddress: 'A', endAddress: 'B', date: '2026-04-01', time: '08:00' });
      svc.reset();
      const d = svc.formData();
      expect(d.title).toBe('');
      expect(d.startAddress).toBe('');
      expect(d.date).toBe('');
      expect(d.pace).toBeNull();
      expect(d.tags).toEqual([]);
    });

    it('clears touched state', () => {
      const svc = setup();
      svc.touch('title'); svc.touch('date');
      svc.reset();
      expect(svc.touched()).toEqual({});
    });
  });

  // ── step validation ──────────────────────────────────────────────────────

  describe('isStep1Valid()', () => {
    it('returns false when all fields empty', () => {
      const svc = setup();
      expect(svc.isStep1Valid()).toBe(false);
    });

    it('returns false when only title is set', () => {
      const svc = setup();
      svc.patch({ title: 'Run' });
      expect(svc.isStep1Valid()).toBe(false);
    });

    it('returns false when title and startAddress set but no endAddress', () => {
      const svc = setup();
      svc.patch({ title: 'Run', startAddress: '123 Main St' });
      expect(svc.isStep1Valid()).toBe(false);
    });

    it('returns true when title, startAddress, and endAddress are all set', () => {
      const svc = setup();
      svc.patch({ title: 'Run', startAddress: '123 Main St', endAddress: '456 Elm St' });
      expect(svc.isStep1Valid()).toBe(true);
    });
  });

  describe('isStep2Valid()', () => {
    it('returns false when date and time are empty', () => {
      const svc = setup();
      expect(svc.isStep2Valid()).toBe(false);
    });

    it('returns false when only date is set', () => {
      const svc = setup();
      svc.patch({ date: '2026-04-01' });
      expect(svc.isStep2Valid()).toBe(false);
    });

    it('returns false when only time is set', () => {
      const svc = setup();
      svc.patch({ time: '08:00' });
      expect(svc.isStep2Valid()).toBe(false);
    });

    it('returns true when both date and time are set to a future date', () => {
      const svc = setup();
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      svc.patch({ date: futureDate, time: '08:00' });
      expect(svc.isStep2Valid()).toBe(true);
    });

    it('returns false when date is in the past even if time is set', () => {
      const svc = setup();
      svc.patch({ date: '2020-01-01', time: '08:00' });
      expect(svc.isStep2Valid()).toBe(false);
    });
  });

  describe('isDateInPast()', () => {
    it('returns false for empty string', () => {
      const svc = setup();
      expect(svc.isDateInPast('')).toBe(false);
    });

    it('returns true for a date clearly in the past', () => {
      const svc = setup();
      expect(svc.isDateInPast('2020-06-15')).toBe(true);
    });

    it('returns true for yesterday', () => {
      const svc = setup();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const str = yesterday.toISOString().split('T')[0];
      expect(svc.isDateInPast(str)).toBe(true);
    });

    it('returns false for tomorrow', () => {
      const svc = setup();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const str = tomorrow.toISOString().split('T')[0];
      expect(svc.isDateInPast(str)).toBe(false);
    });

    it('returns false for today', () => {
      const svc = setup();
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      expect(svc.isDateInPast(today)).toBe(false);
    });
  });
});
