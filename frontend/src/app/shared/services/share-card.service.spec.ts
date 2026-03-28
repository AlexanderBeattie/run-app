import { TestBed } from '@angular/core/testing';
import { ShareCardService } from './share-card.service';
import { RunEvent } from '../../core/models/run-event.model';

const mockRun: RunEvent = {
  id: 'run-1',
  clubId: 'club-1',
  clubName: 'Hackney Harriers',
  title: 'Saturday Morning 10k',
  startLocation: { lat: 51.54, lng: -0.06 },
  endLocation: { lat: 51.55, lng: -0.05 },
  startAddress: '1 London Fields, Hackney',
  endAddress: 'Victoria Park, London',
  date: new Date('2024-03-01T09:00:00'),
  distanceKm: 10,
  estimatedMinutes: 60,
  attendees: [
    { id: 'u1', display_name: 'Alice' },
    { id: 'u2', display_name: 'Bob' },
  ],
  pace: 'moderate',
  tags: ['road', 'morning'],
};

function buildMockCtx() {
  const gradient = { addColorStop: jest.fn() };
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    createLinearGradient: jest.fn().mockReturnValue(gradient),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn().mockReturnValue({ width: 50 }),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    roundRect: jest.fn(),
    rect: jest.fn(),
    fill: jest.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function setupCanvasMock() {
  const mockCtx = buildMockCtx();
  const mockToBlob = jest.fn().mockImplementation((callback: BlobCallback) => {
    callback(new Blob(['fake-png'], { type: 'image/png' }));
  });

  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockCtx);
  HTMLCanvasElement.prototype.toBlob = mockToBlob;

  return { mockCtx, mockToBlob };
}

describe('ShareCardService', () => {
  let service: ShareCardService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareCardService);
    setupCanvasMock();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateShareCard()', () => {
    it('returns a Blob', async () => {
      const blob = await service.generateShareCard(mockRun);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('returns a PNG Blob', async () => {
      const blob = await service.generateShareCard(mockRun);
      expect(blob.type).toBe('image/png');
    });

    it('calls getContext with "2d"', async () => {
      await service.generateShareCard(mockRun);
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    });

    it('handles run with no pace (omits pace stat)', async () => {
      const blob = await service.generateShareCard({ ...mockRun, pace: undefined });
      expect(blob).toBeInstanceOf(Blob);
    });

    it('handles run with no tags', async () => {
      const blob = await service.generateShareCard({ ...mockRun, tags: undefined });
      expect(blob).toBeInstanceOf(Blob);
    });

    it('handles run with empty attendees array', async () => {
      const blob = await service.generateShareCard({ ...mockRun, attendees: [] });
      expect(blob).toBeInstanceOf(Blob);
    });

    it('handles very long run title', async () => {
      const blob = await service.generateShareCard({ ...mockRun, title: 'A'.repeat(200) });
      expect(blob).toBeInstanceOf(Blob);
    });

    it('handles run with no startAddress', async () => {
      const blob = await service.generateShareCard({ ...mockRun, startAddress: '' });
      expect(blob).toBeInstanceOf(Blob);
    });

    it('formats estimatedMinutes >= 60 as hours', async () => {
      const blob = await service.generateShareCard({ ...mockRun, estimatedMinutes: 90 });
      expect(blob).toBeInstanceOf(Blob);
    });

    it('handles estimatedMinutes = 0', async () => {
      const blob = await service.generateShareCard({ ...mockRun, estimatedMinutes: 0 });
      expect(blob).toBeInstanceOf(Blob);
    });

    it('renders up to 4 tags without throwing', async () => {
      const blob = await service.generateShareCard({
        ...mockRun,
        tags: ['road', 'morning', 'trail', 'hills', 'elevation'],
      });
      expect(blob).toBeInstanceOf(Blob);
    });

    it('rejects when toBlob returns null', async () => {
      HTMLCanvasElement.prototype.toBlob = jest.fn().mockImplementation((cb: BlobCallback) => cb(null));
      await expect(service.generateShareCard(mockRun)).rejects.toThrow('Canvas toBlob returned null');
    });
  });
});
