import { TestBed } from '@angular/core/testing';
import { GeocodingService } from '../geocoding.service';

describe('GeocodingService', () => {
  let service: GeocodingService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GeocodingService] });
    service = TestBed.inject(GeocodingService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('is created', () => expect(service).toBeTruthy());

  it('returns coordinates for valid address', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        status: 'OK',
        results: [{ geometry: { location: { lat: 51.5074, lng: -0.1278 } } }]
      })
    }) as any;
    const result = await service.geocode('London, UK');
    expect(result).toEqual({ lat: 51.5074, lng: -0.1278 });
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('London%2C%20UK'));
  });

  it('returns null for ZERO_RESULTS', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ status: 'ZERO_RESULTS', results: [] })
    }) as any;
    const result = await service.geocode('xyzzy123notaplace');
    expect(result).toBeNull();
  });

  it('returns null for REQUEST_DENIED', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ status: 'REQUEST_DENIED', results: [] })
    }) as any;
    const result = await service.geocode('London');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any;
    const result = await service.geocode('London');
    expect(result).toBeNull();
  });

  it('encodes address in URL', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ status: 'OK', results: [{ geometry: { location: { lat: 55.8, lng: -4.2 } } }] })
    }) as any;
    await service.geocode('18 Jamaica Street, Glasgow');
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('18%20Jamaica%20Street'));
  });
});