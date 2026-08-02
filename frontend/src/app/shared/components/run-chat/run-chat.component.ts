import { Component, OnInit, inject, input, signal, ViewChild, ElementRef, AfterViewChecked, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Comment } from '../../../core/models/run-event.model';
import { RunsService } from '../../../core/services/runs.service';

@Component({
  selector: 'app-run-chat',
  standalone: true,
  template: `
    <div class="chat-wrap">
      <div class="messages" #scrollEl>
        @if (loading()) {
          <div class="empty">Loading…</div>
        } @else if (comments().length === 0 && !error()) {
          <div class="empty">No messages yet. Say hello!</div>
        }
        @if (error()) {
          <div class="chat-error">{{ error() }}</div>
        }
        @for (c of comments(); track c.id) {
          <div class="msg">
            <div class="av">{{ c.displayName.charAt(0).toUpperCase() }}</div>
            <div class="msg-body">
              <div class="msg-meta">
                <span class="msg-name">{{ c.displayName }}</span>
                <span class="msg-time">{{ relativeTime(c.createdAt) }}</span>
              </div>
              <div class="msg-content">{{ c.content }}</div>
            </div>
          </div>
        }
      </div>
      <div class="input-row">
        <input
          class="chat-input"
          type="text"
          placeholder="Say something…"
          [value]="inputValue()"
          (input)="inputValue.set($any($event.target).value)"
          (keydown.enter)="send()"
          [disabled]="sending()"
          maxlength="500" />
        <button
          class="send-btn"
          (click)="send()"
          [disabled]="sending() || inputValue().trim().length === 0">
          {{ sending() ? '…' : '↑' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-wrap { display: flex; flex-direction: column; height: 340px; }
    .messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 4px 0 8px; }
    .empty { font-size: 13px; color: #6B6B68; text-align: center; padding-top: 40px; }
    .chat-error { font-size: 13px; color: #dc2626; text-align: center; padding: 12px; background: #FEE2E2; border-radius: 8px; }
    .msg { display: flex; gap: 10px; align-items: flex-start; }
    .av { width: 32px; height: 32px; border-radius: 50%; background: #E1F5EE; color: #0F6E56; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .msg-body { flex: 1; min-width: 0; }
    .msg-meta { display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px; }
    .msg-name { font-size: 13px; font-weight: 500; color: #0D0D0D; }
    .msg-time { font-size: 11px; color: #6B6B68; }
    .msg-content { font-size: 14px; color: #3D3D3B; line-height: 1.5; word-break: break-word; }
    .input-row { display: flex; gap: 8px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.07); margin-top: 4px; }
    .chat-input { flex: 1; border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 10px 14px; font-size: 14px; font-family: inherit; outline: none; background: #F7F7F5; color: #0D0D0D; }
    .chat-input:focus { border-color: #1D9E75; background: #fff; }
    .chat-input:disabled { opacity: 0.6; }
    .send-btn { width: 40px; height: 40px; border-radius: 50%; background: #0F6E56; color: #fff; border: none; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .send-btn:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class RunChatComponent implements OnInit, AfterViewChecked {
  runId = input.required<string>();
  @ViewChild('scrollEl') scrollEl!: ElementRef<HTMLDivElement>;

  private svc = inject(RunsService);
  private destroyRef = inject(DestroyRef);
  comments = signal<Comment[]>([]);
  inputValue = signal('');
  sending = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);

  private shouldScroll = false;

  constructor() {
    effect(() => {
      this.comments();
      this.shouldScroll = true;
    });
  }

  ngOnInit() {
    this.svc.getComments(this.runId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.comments.set(data); this.loading.set(false); },
        error: () => { this.loading.set(false); this.error.set('Could not load messages.'); }
      });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll && this.scrollEl) {
      this.scrollEl.nativeElement.scrollTop = this.scrollEl.nativeElement.scrollHeight;
      this.shouldScroll = false;
    }
  }

  send() {
    const content = this.inputValue().trim();
    if (!content || this.sending()) return;
    this.sending.set(true);
    this.error.set(null);
    this.svc.postComment(this.runId(), content)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comment) => {
          this.comments.update(list => [...list, comment]);
          this.inputValue.set('');
          this.sending.set(false);
        },
        error: (err) => {
          this.error.set(err.status === 401 ? 'Sign in to post a message.' : 'Failed to send. Please try again.');
          this.sending.set(false);
        }
      });
  }

  relativeTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
}
