import { TestBed } from '@angular/core/testing';
import { GeoService } from '../geo.service';

describe('GeoService', () => {
  let service: GeoService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoService);
  });

  describe('calculateDistance', () => {
    it('returns ~0 for same coordinates', () => {
      const coord = { lat: 51.5074, lng: -0.1278 };
      expect(service.calculateDistance(coord, coord)).toBeCloseTo(0, 1);
    });

    it('calculates Glasgow to Edinburgh (~65 km)', () => {
      const glasgow = { lat: 55.8617, lng: -4.2583 };
      const edinburgh = { lat: 55.9533, lng: -3.1883 };
      const dist = service.calculateDistance(glasgow, edinburgh);
      expect(dist).toBeGreaterThan(60);
      expect(dist).toBeLessThan(70);
    });

    it('calculates London to Paris (~341 km)', () => {
      const london = { lat: 51.5074, lng: -0.1278 };
      const paris = { lat: 48.8566, lng: 2.3522 };
      const dist = service.calculateDistance(london, paris);
      expect(dist).toBeGreaterThan(330);
      expect(dist).toBeLessThan(350);
    });

    it('is symmetric — distance A→B equals B→A', () => {
      const a = { lat: 40.7128, lng: -74.0060 };
      const b = { lat: 34.0522, lng: -118.2437 };
      expect(service.calculateDistance(a, b)).toBeCloseTo(service.calculateDistance(b, a), 5);
    });
  });

  describe('milesToKilometers', () => {
    it('converts 1 mile to ~1.609 km', () => {
      expect(service.milesToKilometers(1)).toBeCloseTo(1.60934, 3);
    });

    it('converts 10 miles to ~16.09 km', () => {
      expect(service.milesToKilometers(10)).toBeCloseTo(16.0934, 2);
    });

    it('returns 0 for 0 miles', () => {
      expect(service.milesToKilometers(0)).toBe(0);
    });
  });
});
