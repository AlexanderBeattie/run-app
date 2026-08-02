import { TestBed } from '@angular/core/testing';
import { RoutePreviewComponent } from './route-preview.component';

// Helpers to build a mock LatLng array
function makeLatLng(lat: number, lng: number): { lat(): number; lng(): number } {
  return { lat: () => lat, lng: () => lng };
}

const SAMPLE_LATLNGS = [
  makeLatLng(51.5, -0.1),
  makeLatLng(51.51, -0.09),
  makeLatLng(51.52, -0.08),
];

function setGoogleMock(decodeFn: (polyline: string) => { lat(): number; lng(): number }[]) {
  (globalThis as any).google = {
    maps: {
      geometry: {
        encoding: {
          decodePath: decodeFn,
        },
      },
    },
  };
}

function removeGoogle() {
  delete (globalThis as any).google;
}

describe('RoutePreviewComponent', () => {
  function setup(polyline?: string) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RoutePreviewComponent],
    });
    const fixture = TestBed.createComponent(RoutePreviewComponent);
    const component = fixture.componentInstance;
    if (polyline !== undefined) {
      // setInput triggers ngOnChanges; direct property assignment does not
      fixture.componentRef.setInput('polyline', polyline);
    }
    fixture.detectChanges();
    return { fixture, component };
  }

  afterEach(() => {
    removeGoogle();
  });

  describe('hidden states — no SVG rendered', () => {
    it('hides when polyline is undefined (default)', () => {
      const { fixture } = setup();
      expect(fixture.nativeElement.querySelector('.route-preview')).toBeNull();
    });

    it('hides when polyline is empty string', () => {
      const { fixture } = setup('');
      expect(fixture.nativeElement.querySelector('.route-preview')).toBeNull();
    });

    it('hides when google is not defined', () => {
      removeGoogle();
      const { fixture } = setup('encoded_polyline_string');
      expect(fixture.nativeElement.querySelector('.route-preview')).toBeNull();
    });

    it('hides when google.maps.geometry.encoding is missing', () => {
      (globalThis as any).google = { maps: {} };
      const { fixture } = setup('encoded_polyline_string');
      expect(fixture.nativeElement.querySelector('.route-preview')).toBeNull();
    });

    it('hides when decodePath returns fewer than 2 points', () => {
      setGoogleMock(() => [makeLatLng(51.5, -0.1)]);
      const { fixture } = setup('short_polyline');
      expect(fixture.nativeElement.querySelector('.route-preview')).toBeNull();
    });

    it('hides when decodePath returns an empty array', () => {
      setGoogleMock(() => []);
      const { fixture } = setup('empty_polyline');
      expect(fixture.nativeElement.querySelector('.route-preview')).toBeNull();
    });
  });

  describe('visible state — SVG rendered with valid polyline', () => {
    beforeEach(() => {
      setGoogleMock(() => SAMPLE_LATLNGS);
    });

    it('renders the route-preview container', () => {
      const { fixture } = setup('valid_polyline');
      expect(fixture.nativeElement.querySelector('.route-preview')).not.toBeNull();
    });

    it('renders an svg element', () => {
      const { fixture } = setup('valid_polyline');
      expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
    });

    it('renders the path with stroke #FC4C02 (Strava orange)', () => {
      const { fixture } = setup('valid_polyline');
      const path: SVGPathElement = fixture.nativeElement.querySelector('path');
      expect(path).not.toBeNull();
      expect(path.getAttribute('stroke')).toBe('#FC4C02');
    });

    it('renders the path with stroke-width 2.5', () => {
      const { fixture } = setup('valid_polyline');
      const path: SVGPathElement = fixture.nativeElement.querySelector('path');
      expect(path.getAttribute('stroke-width')).toBe('2.5');
    });

    it('sets fill to none', () => {
      const { fixture } = setup('valid_polyline');
      const path: SVGPathElement = fixture.nativeElement.querySelector('path');
      expect(path.getAttribute('fill')).toBe('none');
    });

    it('sets viewBox to 0 0 200 72', () => {
      const { fixture } = setup('valid_polyline');
      const svg: SVGSVGElement = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('viewBox')).toBe('0 0 200 72');
    });

    it('builds an SVG path starting with M', () => {
      const { fixture, component } = setup('valid_polyline');
      expect(component.svgPath).toMatch(/^M /);
    });

    it('svgPath contains L segments for additional points', () => {
      const { fixture, component } = setup('valid_polyline');
      expect(component.svgPath).toContain(' L ');
    });
  });

  describe('error resilience', () => {
    it('does not crash when decodePath throws', () => {
      setGoogleMock(() => { throw new Error('Maps not loaded'); });
      expect(() => setup('bad_polyline')).not.toThrow();
    });

    it('leaves svgPath empty when decodePath throws', () => {
      setGoogleMock(() => { throw new Error('Maps not loaded'); });
      const { component } = setup('bad_polyline');
      expect(component.svgPath).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    it('clears svgPath when polyline changes to undefined', () => {
      setGoogleMock(() => SAMPLE_LATLNGS);
      const { fixture, component } = setup('valid_polyline');
      expect(component.svgPath).not.toBe('');

      fixture.componentRef.setInput('polyline', undefined);
      fixture.detectChanges();

      expect(component.svgPath).toBe('');
      expect(fixture.nativeElement.querySelector('.route-preview')).toBeNull();
    });

    it('clears svgPath when polyline changes to empty string', () => {
      setGoogleMock(() => SAMPLE_LATLNGS);
      const { fixture, component } = setup('valid_polyline');
      expect(component.svgPath).not.toBe('');

      fixture.componentRef.setInput('polyline', '');
      fixture.detectChanges();

      expect(component.svgPath).toBe('');
    });

    it('updates svgPath when polyline changes to a new valid value', () => {
      const firstDecode = jest.fn().mockReturnValue(SAMPLE_LATLNGS);
      setGoogleMock(firstDecode);
      const { fixture, component } = setup('first_polyline');
      const firstPath = component.svgPath;
      expect(firstPath).not.toBe('');

      // Use non-collinear points so the SVG path differs from SAMPLE_LATLNGS
      const otherPoints = [
        makeLatLng(48.85, 2.35),
        makeLatLng(48.90, 2.36),
        makeLatLng(48.86, 2.45),
      ];
      (globalThis as any).google.maps.geometry.encoding.decodePath = jest.fn().mockReturnValue(otherPoints);

      fixture.componentRef.setInput('polyline', 'second_polyline');
      fixture.detectChanges();

      expect(component.svgPath).not.toBe('');
      expect(component.svgPath).not.toBe(firstPath);
    });
  });

  describe('SVG coordinate bounds', () => {
    it('keeps all path coordinates within the padded viewBox (8px padding in 200x72)', () => {
      setGoogleMock(() => SAMPLE_LATLNGS);
      const { component } = setup('valid_polyline');
      const coords = component.svgPath
        .replace(/^M /, '')
        .split(' L ')
        .map(pt => {
          const [x, y] = pt.split(',').map(Number);
          return { x, y };
        });

      for (const { x, y } of coords) {
        expect(x).toBeGreaterThanOrEqual(8);
        expect(x).toBeLessThanOrEqual(192); // 200 - 8
        expect(y).toBeGreaterThanOrEqual(8);
        expect(y).toBeLessThanOrEqual(64);  // 72 - 8
      }
    });
  });
});
