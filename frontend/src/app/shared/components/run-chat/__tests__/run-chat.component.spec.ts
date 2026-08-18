import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RunChatComponent } from '../run-chat.component';
import { Comment } from '../../../../core/models/run-event.model';
import { environment } from '../../../../../environments/environment';

const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 'c1', runId: 'run-1', userId: 'user-1',
  content: 'Hello!', displayName: 'Alice',
  createdAt: new Date('2026-01-01T10:00:00Z'),
  ...overrides
});

const RAW_COMMENT = {
  id: 'c1', run_id: 'run-1', user_id: 'user-1', content: 'Hello!',
  display_name: 'Alice', avatar_url: null,
  created_at: '2026-01-01T10:00:00Z'
};

describe('RunChatComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RunChatComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function createWithId(runId = 'run-1') {
    const fixture = TestBed.createComponent(RunChatComponent);
    fixture.componentRef.setInput('runId', runId);
    return fixture;
  }

  it('creates the component', () => {
    const fixture = createWithId();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush([]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows loading state before comments arrive', () => {
    const fixture = createWithId();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading');
    http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush([]);
  });

  it('shows empty state when no comments', () => {
    const fixture = createWithId();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No messages yet');
  });

  it('renders comments with display name and content', () => {
    const fixture = createWithId();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush([RAW_COMMENT]);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Alice');
    expect(text).toContain('Hello!');
  });

  it('renders avatar initial from display name', () => {
    const fixture = createWithId();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush([
      { ...RAW_COMMENT, display_name: 'Zara' }
    ]);
    fixture.detectChanges();
    const av = fixture.nativeElement.querySelector('.av');
    expect(av.textContent.trim()).toBe('Z');
  });

  it('disables send button when input is empty', () => {
    const fixture = createWithId();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush([]);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.send-btn');
    expect(btn.disabled).toBe(true);
  });

  it('enables send button when input has content', () => {
    const fixture = createWithId();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush([]);
    fixture.componentInstance.inputValue.set('Test message');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.send-btn');
    expect(btn.disabled).toBe(false);
  });

  it('posts comment and clears input on success', () => {
    const fixture = createWithId();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush([]);
    fixture.componentInstance.inputValue.set('New message');
    fixture.componentInstance.send();
    const req = http.expectOne(`${environment.apiUrl}/runs/run-1/comments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'New message' });
    req.flush({
      id: 'c2', run_id: 'run-1', user_id: 'u1', content: 'New message',
      display_name: 'Alice', avatar_url: null,
      created_at: new Date().toISOString()
    });
    expect(fixture.componentInstance.inputValue()).toBe('');
    expect(fixture.componentInstance.comments().length).toBe(1);
    expect(fixture.componentInstance.sending()).toBe(false);
  });

  it('shows auth error on 401', () => {
    const fixture = createWithId();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush([]);
    fixture.componentInstance.inputValue.set('hi');
    fixture.componentInstance.send();
    const req = http.expectOne(`${environment.apiUrl}/runs/run-1/comments`);
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(fixture.componentInstance.error()).toContain('Sign in');
    expect(fixture.componentInstance.sending()).toBe(false);
  });

  it('does not send if input is empty', () => {
    const fixture = createWithId();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush([]);
    fixture.componentInstance.send();
    http.expectNone(`${environment.apiUrl}/runs/run-1/comments`);
  });

  it('shows error state when comments fail to load', () => {
    const fixture = createWithId();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush(
      { error: 'Server Error' }, { status: 500, statusText: 'Server Error' }
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toContain('Could not load messages');
  });

  describe('relativeTime', () => {
    let component: RunChatComponent;

    beforeEach(() => {
      const fixture = createWithId();
      fixture.detectChanges();
      http.expectOne(`${environment.apiUrl}/runs/run-1/comments`).flush([]);
      component = fixture.componentInstance;
    });

    it('returns "just now" for < 1 min', () => {
      expect(component.relativeTime(new Date())).toBe('just now');
    });

    it('returns minutes ago for < 1 hour', () => {
      const d = new Date(Date.now() - 5 * 60000);
      expect(component.relativeTime(d)).toBe('5m ago');
    });

    it('returns hours ago for < 24 hours', () => {
      const d = new Date(Date.now() - 3 * 3600000);
      expect(component.relativeTime(d)).toBe('3h ago');
    });

    it('returns days ago for < 7 days', () => {
      const d = new Date(Date.now() - 2 * 86400000);
      expect(component.relativeTime(d)).toBe('2d ago');
    });
  });
});
