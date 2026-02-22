import '../shared/youtube.globals.d.ts';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  Signal,
  signal,
  ViewChild
} from '@angular/core';
import { normalizeYouTubeVideoId, YoutubePlayerService } from '../shared';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'lib-youtube-video-player',
  imports: [DecimalPipe],
  templateUrl: './youtube-video-player.html',
  styleUrl: './youtube-video-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    // expose current status for assistive tech
    '[attr.aria-busy]': '(!isReady()) ? "true" : null',
    '[attr.aria-live]': 'isPlaying() ? "off" : "polite"',
    '[attr.aria-label]':
      'watchUrl() ? `YouTube video player for ${watchUrl()}` : "YouTube video player"',
    class: 'youtube-video-player'
  }
})
export class YoutubeVideoPlayerComponent implements OnInit, OnDestroy {
  // Public inputs and derived signals
  public readonly videoId = input<string>('7OE4v5AHxkc');
  public readonly useStandardHost = input<boolean>(true);
  public readonly watchUrl: Signal<string | null> = computed(() => {
    const id = normalizeYouTubeVideoId(this.videoId());
    return id ? `https://www.youtube.com/watch?v=${id}` : null;
  });
  public readonly isReady: Signal<boolean> = computed(() => this.player.isReady());
  public readonly error: Signal<string | null> = computed(() => this.player.error());
  public readonly duration: Signal<number> = computed(() => this.player.duration());
  public readonly currentTime: Signal<number> = computed(() => this.player.currentTime());
  public readonly isPlaying: Signal<boolean> = computed(() => this.player.isPlaying());
  public readonly isFullscreen = computed(() => document.fullscreenElement !== null);
  // Fullscreen target configuration
  public readonly fullscreenMode = input<'host' | 'parent' | 'closest'>('host');
  public readonly fullscreenClosestSelector = input<string>('');
  // Auto-hide controls state (public first for member-ordering)
  public readonly controlsVisible: Signal<boolean> = computed(() => this._controlsVisible());
  private readonly _controlsVisible = signal<boolean>(true);
  private _hideTimeout: number | null = null;

  // Private refs
  @ViewChild('playerContainer', { static: true })
  private readonly playerContainer?: ElementRef<HTMLDivElement>;
  private readonly hostRef = inject<ElementRef<HTMLElement>>(
    ElementRef as unknown as { new (): ElementRef<HTMLElement> }
  );
  private _resizeObserver: ResizeObserver | null = null;

  // Inject service
  private readonly player = inject(YoutubePlayerService);

  // React to input changes in injection context
  private readonly _inputsEffect = effect(() => {
    const id = this.videoId();
    const host = this.useStandardHost();
    this.player.setVideoId(id);
    this.player.setUseStandardHost(host);
  });

  public ngOnInit(): void {
    if (this.playerContainer) {
      this.player.attachContainer(this.playerContainer);
    }
    // Initialize with current values
    this.player.setVideoId(this.videoId());
    this.player.setUseStandardHost(this.useStandardHost());
    this.player.initSocketSync();
    this.player.loadYouTubeIframeAPI();
    // Listen to fullscreen changes to keep UI state in sync
    document.addEventListener('fullscreenchange', this._onFullscreenChange);
    // Start auto-hide cycle
    this._scheduleHide();

    // Observe frame size to align controls to video dimensions
    const frameEl = this.playerContainer?.nativeElement;
    if (frameEl && 'ResizeObserver' in window) {
      this._resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        const rect = entry?.contentRect;
        if (rect) {
          const host = this.hostRef.nativeElement;
          host.style.setProperty('--yt-frame-width', `${rect.width}px`);
          host.style.setProperty('--yt-frame-height', `${rect.height}px`);
        }
      });
      this._resizeObserver.observe(frameEl);
    }
  }

  public ngOnDestroy(): void {
    this.player.destroy();
    document.removeEventListener('fullscreenchange', this._onFullscreenChange);
    if (this._hideTimeout !== null) {
      window.clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  // Forward controls
  public play(): void {
    this.player.play();
  }
  public pause(): void {
    this.player.pause();
  }
  public seekTo(seconds: number): void {
    this.player.seekTo(seconds);
  }
  public onSeekChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const value = target.valueAsNumber;
    if (Number.isFinite(value)) {
      this.seekTo(value);
    }
  }
  // Interaction handlers (bound in template)
  public onPointerMove(): void {
    this._revealThenHideSoon();
  }
  public onControlsFocus(): void {
    this._controlsVisible.set(true);
    if (this._hideTimeout !== null) {
      window.clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }
  }
  public onControlsBlur(): void {
    this._scheduleHide(1500);
  }
  // Fullscreen controls
  public toggleFullscreen(): void {
    const mode = this.fullscreenMode();
    let targetEl: HTMLElement | null = null;
    if (mode === 'host') {
      targetEl = this.hostRef.nativeElement;
    } else if (mode === 'parent') {
      targetEl = this.hostRef.nativeElement.parentElement;
    } else if (mode === 'closest') {
      const sel = this.fullscreenClosestSelector().trim();
      targetEl = sel ? this.hostRef.nativeElement.closest(sel) : this.hostRef.nativeElement;
    }
    const isFs = document.fullscreenElement !== null;
    if (!isFs) {
      if (targetEl && typeof (targetEl as any).requestFullscreen === 'function') {
        (targetEl as any).requestFullscreen().catch((err: unknown) => {
          if (typeof console !== 'undefined' && console.debug)
            console.debug('requestFullscreen denied', err);
        });
      }
      return;
    }
    if (typeof document.exitFullscreen === 'function') {
      void document.exitFullscreen();
    }
  }
  private readonly _onFullscreenChange = () => {
    // Keep controls visible briefly when toggling fullscreen
    this._revealThenHideSoon();
  };
  private _scheduleHide(delayMs = 2000): void {
    if (this._hideTimeout !== null) window.clearTimeout(this._hideTimeout);
    this._hideTimeout = window.setTimeout(() => {
      // Hide only if not focused within controls
      const active = document.activeElement as HTMLElement | null;
      const container = this.playerContainer?.nativeElement;
      const controls = container?.parentElement?.querySelector('.yt-player__controls');
      const isFocusInside = !!controls?.contains(active ?? null);
      if (!isFocusInside) this._controlsVisible.set(false);
    }, delayMs);
  }
  private _revealThenHideSoon(): void {
    this._controlsVisible.set(true);
    this._scheduleHide(2000);
  }
}
