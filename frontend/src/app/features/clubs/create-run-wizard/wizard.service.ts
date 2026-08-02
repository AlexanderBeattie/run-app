import { Injectable, signal } from '@angular/core';
import { Club } from '../../../core/models/run-event.model';

export interface WizardFormData {
  clubId: string | null;
  title: string;
  startAddress: string;
  endAddress: string;
  date: string;
  time: string;
  runType: string | null;
  pace: string | null;
  maxAttendees: number | undefined;
  tags: string[];
  notes: string;
}

const INITIAL_DATA: WizardFormData = {
  clubId: null,
  title: '',
  startAddress: '',
  endAddress: '',
  date: '',
  time: '',
  runType: null,
  pace: null,
  maxAttendees: undefined,
  tags: [],
  notes: '',
};

@Injectable()
export class WizardService {
  currentStep = signal(1);
  formData = signal<WizardFormData>({ ...INITIAL_DATA });
  myClubs = signal<Club[]>([]);
  touched = signal<Partial<Record<keyof WizardFormData, boolean>>>({});

  patch(data: Partial<WizardFormData>): void {
    this.formData.set({ ...this.formData(), ...data });
  }

  touch(field: keyof WizardFormData): void {
    this.touched.set({ ...this.touched(), [field]: true });
  }

  nextStep(): void {
    if (this.currentStep() < 4) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  reset(): void {
    this.currentStep.set(1);
    this.formData.set({ ...INITIAL_DATA });
    this.touched.set({});
  }

  isStep1Valid(): boolean {
    const d = this.formData();
    return !!(d.title && d.startAddress && d.endAddress);
  }

  isDateInPast(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  isStep2Valid(): boolean {
    const d = this.formData();
    return !!(d.date && d.time && !this.isDateInPast(d.date));
  }
}
