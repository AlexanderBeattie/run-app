import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GeocodingService } from '../geocoding.service';
import { environment } from '../../../../environments/environment';

describe('GeocodingService', () => {
  let service: GeocodingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        GeocodingService
      ]
    });
    service = TestBed.inject(GeocodingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('is created', () => expect(service).toBeTruthy());

  it('returns coordinates for valid address', async () => {
    const promise = service.geocode('London, UK');
    const req = http.expectOne(r => r.url.includes('/geocode') && r.params.get('address') === 'London, UK');
    expect(req.request.method).toBe('GET');
    req.flush({ lat: 51.5074, lng: -0.1278 });
    const result = await promise;
    expect(result).toEqual({ lat: 51.5074, lng: -0.1278 });
  });

  it('returns null when API returns null coords', async () => {
    const promise = service.geocode('xyzzy123notaplace');
    const req = http.expectOne(r => r.url.includes('/geocode'));
    req.flush({ lat: null, lng: null, status: 'ZERO_RESULTS' });
    const result = await promise;
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    const promise = service.geocode('London');
    const req = http.expectOne(r => r.url.includes('/geocode'));
    req.error(new ProgressEvent('error'));
    const result = await promise;
    expect(result).toBeNull();
  });

  it('sends address as query param', async () => {
    const promise = service.geocode('18 Jamaica Street, Glasgow');
    const req = http.expectOne(r => r.params.get('address') === '18 Jamaica Street, Glasgow');
    req.flush({ lat: 55.8, lng: -4.2 });
    await promise;
    expect(req.request.params.get('address')).toBe('18 Jamaica Street, Glasgow');
  });
});