import { compressImage } from '../image-compressor';

interface MockFileReader {
  onload: ((e: ProgressEvent<FileReader>) => void) | null;
  onerror: (() => void) | null;
  readAsDataURL: jest.Mock;
  result?: string;
}

function makeFile(type: string, name = 'test.jpg'): File {
  const blob = new Blob(['fake-image-data'], { type });
  return new File([blob], name, { type });
}

describe('compressImage', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = {
      drawImage: jest.fn(),
    } as unknown as CanvasRenderingContext2D;

    canvas = {
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(ctx),
      toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,compressed'),
    } as unknown as HTMLCanvasElement;

    jest.spyOn(document, 'createElement').mockReturnValue(canvas);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects non-image files', async () => {
    const file = makeFile('application/pdf', 'doc.pdf');
    await expect(compressImage(file)).rejects.toThrow('File is not an image');
  });

  it('resolves with a jpeg data URL for valid images', async () => {
    const file = makeFile('image/png');

    // Mock FileReader
    const mockReader: MockFileReader = {
      onload: null,
      onerror: null,
      readAsDataURL: jest.fn().mockImplementation(function (this: MockFileReader) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/png;base64,abc' } } as unknown as ProgressEvent<FileReader>);
          }
        }, 0);
      }),
      result: 'data:image/png;base64,abc',
    };

    jest.spyOn(window, 'FileReader').mockImplementation(() => mockReader as unknown as FileReader);

    // Mock Image
    const mockImg = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
      width: 2000,
      height: 1000,
    };
    jest.spyOn(window, 'Image').mockImplementation(() => {
      setTimeout(() => { if (mockImg.onload) mockImg.onload(); }, 0);
      return mockImg as unknown as HTMLImageElement;
    });

    const result = await compressImage(file, 1000, 0.7);
    expect(result).toBe('data:image/jpeg;base64,compressed');
    expect(canvas.width).toBe(1000);
    expect(canvas.height).toBe(500);
  });

  it('does not upscale images narrower than maxWidth', async () => {
    const file = makeFile('image/jpeg');

    const mockReader: MockFileReader = {
      onload: null,
      onerror: null,
      readAsDataURL: jest.fn().mockImplementation(function (this: MockFileReader) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,abc' } } as unknown as ProgressEvent<FileReader>);
          }
        }, 0);
      }),
    };
    jest.spyOn(window, 'FileReader').mockImplementation(() => mockReader as unknown as FileReader);

    const mockImg = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
      width: 400,
      height: 300,
    };
    jest.spyOn(window, 'Image').mockImplementation(() => {
      setTimeout(() => { if (mockImg.onload) mockImg.onload(); }, 0);
      return mockImg as unknown as HTMLImageElement;
    });

    await compressImage(file, 1000, 0.7);
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(300);
  });

  it('rejects when canvas context is unavailable', async () => {
    (canvas.getContext as jest.Mock).mockReturnValue(null);

    const file = makeFile('image/jpeg');

    const mockReader: MockFileReader = {
      onload: null,
      onerror: null,
      readAsDataURL: jest.fn().mockImplementation(function (this: MockFileReader) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,abc' } } as unknown as ProgressEvent<FileReader>);
          }
        }, 0);
      }),
    };
    jest.spyOn(window, 'FileReader').mockImplementation(() => mockReader as unknown as FileReader);

    const mockImg = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
      width: 500,
      height: 400,
    };
    jest.spyOn(window, 'Image').mockImplementation(() => {
      setTimeout(() => { if (mockImg.onload) mockImg.onload(); }, 0);
      return mockImg as unknown as HTMLImageElement;
    });

    await expect(compressImage(file)).rejects.toThrow('Canvas not supported');
  });
});
