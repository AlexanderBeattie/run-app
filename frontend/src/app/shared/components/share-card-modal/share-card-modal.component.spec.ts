import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ShareCardModalComponent } from './share-card-modal.component';
import { ShareCardService } from '../../services/share-card.service';
import { ToastService } from '../../services/toast.service';
import { RunEvent } from '../../../core/models/run-event.model';

const mockRun: RunEvent = {
  id: 'run-1',
  clubId: 'club-1',
  clubName: 'Hackney Harriers',
  title: 'Saturday Morning 10k',
  startLocation: { lat: 51.54, lng: -0.06 },
  endLocation: { lat: 51.55, lng: -0.05 },
  startAddress: '1 London Fields',
  endAddress: 'Victoria Park',
  date: new Date('2024-01-15T09:00:00'),
  distanceKm: 10,
  estimatedMinutes: 60,
  attendees: [{ id: 'u1', display_name: 'Alice' }],
  pace: 'moderate',
  tags: ['road'],
};

const mockBlob = new Blob(['fake-png-data'], { type: 'image/png' });

describe('ShareCardModalComponent', () => {
  let shareCardService: { generateShareCard: jest.Mock };
  let toastService: { show: jest.Mock };

  beforeEach(() => {
    TestBed.resetTestingModule();

    shareCardService = { generateShareCard: jest.fn().mockResolvedValue(mockBlob) };
    toastService = { show: jest.fn() };

    (URL as any).createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    (URL as any).revokeObjectURL = jest.fn();

    TestBed.configureTestingModule({
      imports: [ShareCardModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ShareCardService, useValue: shareCardService },
        { provide: ToastService, useValue: toastService },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(ShareCardModalComponent);
    fixture.componentInstance.run = mockRun;
    return fixture;
  }

  async function createAndInit() {
    const fixture = createComponent();
    fixture.detectChanges();
    // Wait for ngOnInit async to complete
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('starts in generating state before detectChanges', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance.generating()).toBe(true);
    expect(fixture.componentInstance.previewUrl()).toBeNull();
  });

  it('calls generateShareCard on init', async () => {
    await createAndInit();
    expect(shareCardService.generateShareCard).toHaveBeenCalledWith(mockRun);
  });

  it('sets generating to false after card is generated', async () => {
    const fixture = await createAndInit();
    expect(fixture.componentInstance.generating()).toBe(false);
  });

  it('sets previewUrl after card is generated', async () => {
    const fixture = await createAndInit();
    expect(fixture.componentInstance.previewUrl()).toBe('blob:mock-url');
  });

  it('shows toast and finishes generating when generateShareCard rejects', async () => {
    shareCardService.generateShareCard.mockRejectedValue(new Error('Canvas error'));
    const fixture = await createAndInit();
    expect(fixture.componentInstance.generating()).toBe(false);
    expect(toastService.show).toHaveBeenCalledWith('Failed to generate share card');
  });

  it('emits close when overlay is clicked', async () => {
    const fixture = await createAndInit();

    const closeSpy = jest.fn();
    fixture.componentInstance.close.subscribe(closeSpy);

    const event = new MouseEvent('click', { bubbles: false });
    const overlay = fixture.nativeElement.querySelector('.overlay') as HTMLElement;
    Object.defineProperty(event, 'target', { value: overlay, configurable: true });
    fixture.componentInstance.onOverlay(event);
    expect(closeSpy).toHaveBeenCalled();
  });

  it('emits close when close button is clicked', async () => {
    const fixture = await createAndInit();

    const closeSpy = jest.fn();
    fixture.componentInstance.close.subscribe(closeSpy);

    const closeBtn = fixture.nativeElement.querySelector('.close') as HTMLButtonElement;
    closeBtn.click();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('does not emit close when modal content is clicked', async () => {
    const fixture = await createAndInit();

    const closeSpy = jest.fn();
    fixture.componentInstance.close.subscribe(closeSpy);

    const event = new MouseEvent('click', { bubbles: false });
    const modal = fixture.nativeElement.querySelector('.modal') as HTMLElement;
    Object.defineProperty(event, 'target', { value: modal, configurable: true });
    fixture.componentInstance.onOverlay(event);
    expect(closeSpy).not.toHaveBeenCalled();
  });

  describe('download()', () => {
    it('creates anchor, triggers download, and shows toast', async () => {
      const fixture = await createAndInit();

      const mockAnchor = { href: '', download: '', click: jest.fn() };
      jest.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor as unknown as HTMLAnchorElement);

      await fixture.componentInstance.download();

      expect(mockAnchor.click).toHaveBeenCalled();
      expect(toastService.show).toHaveBeenCalledWith('Image saved!');
      expect((URL as any).revokeObjectURL).toHaveBeenCalled();
    });

    it('does nothing if blob is null (generation failed)', async () => {
      shareCardService.generateShareCard.mockRejectedValue(new Error('fail'));
      const fixture = await createAndInit();

      toastService.show.mockClear();
      await fixture.componentInstance.download();
      expect(toastService.show).not.toHaveBeenCalledWith('Image saved!');
    });
  });

  describe('share()', () => {
    it('falls back to download when Web Share API unavailable', async () => {
      const fixture = await createAndInit();

      const downloadSpy = jest.spyOn(fixture.componentInstance, 'download').mockResolvedValue();
      const originalShare = (navigator as any).share;
      delete (navigator as any).share;

      await fixture.componentInstance.share();
      expect(downloadSpy).toHaveBeenCalled();

      if (originalShare !== undefined) (navigator as any).share = originalShare;
    });

    it('does nothing if blob is null', async () => {
      shareCardService.generateShareCard.mockRejectedValue(new Error('fail'));
      const fixture = await createAndInit();

      const downloadSpy = jest.spyOn(fixture.componentInstance, 'download').mockResolvedValue();
      await fixture.componentInstance.share();
      expect(downloadSpy).not.toHaveBeenCalled();
    });
  });

  it('revokes object URL on destroy', async () => {
    const fixture = await createAndInit();
    fixture.destroy();
    expect((URL as any).revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
