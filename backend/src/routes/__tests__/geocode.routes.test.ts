import request from 'supertest';
import express from 'express';
import geocodeRoutes from '../geocode.routes';

const app = express();
app.use(express.json());
app.use('/api/geocode', geocodeRoutes);

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('GET /api/geocode', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when address param is missing', async () => {
    const res = await request(app).get('/api/geocode');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Address query param required');
  });

  it('returns coordinates on successful geocode', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        results: [{
          geometry: { location: { lat: 51.5074, lng: -0.1278 } },
          formatted_address: 'London, UK'
        }]
      })
    });
    const res = await request(app).get('/api/geocode?address=London');
    expect(res.status).toBe(200);
    expect(res.body.lat).toBe(51.5074);
    expect(res.body.lng).toBe(-0.1278);
    expect(res.body.formatted_address).toBe('London, UK');
  });

  it('returns null coordinates when Google API returns no results', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ status: 'ZERO_RESULTS', results: [] })
    });
    const res = await request(app).get('/api/geocode?address=xyznotaplace123');
    expect(res.status).toBe(200);
    expect(res.body.lat).toBeNull();
    expect(res.body.lng).toBeNull();
    expect(res.body.status).toBe('ZERO_RESULTS');
  });

  it('returns 500 when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const res = await request(app).get('/api/geocode?address=London');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Geocoding failed');
  });

  it('encodes the address in the upstream URL', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        results: [{
          geometry: { location: { lat: 51.5, lng: -0.1 } },
          formatted_address: 'London Bridge, UK'
        }]
      })
    });
    await request(app).get('/api/geocode?address=London+Bridge');
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('London');
    expect(calledUrl).toContain('maps.googleapis.com');
  });
});
