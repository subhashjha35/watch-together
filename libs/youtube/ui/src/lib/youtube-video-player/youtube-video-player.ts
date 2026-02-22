import '../shared/youtube.globals.d.ts';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import type { FullscreenMode } from '../shared';
import {
  AutoHideController,
  normalizeYouTubeVideoId,
  observeFrameSize,
  resolveFullscreenTarget,
  toggleFullscreen,
  YoutubePlayerService
} from '../shared';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'lib-youtube-video-player',
  imports: [DecimalPipe],
  templateUrl: './youtube-video-player.html',
  styleUrl: './youtube-video-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    '[attr.aria-busy]': '(!isReady()) ? "true" : null',
    '[attr.aria-live]': 'isPlaying() ? "off" : "polite"',
    '[attr.aria-label]':
      'watchUrl() ? `YouTube video player for ${watchUrl()}` : "YouTube video player"',
    class: 'youtube-video-player'
  }
})
export class YoutubeVideoPlayerComponent implements OnInit {
  // ── Inputs ──────────────────────────────────────────────────────────
  readonly videoId = input<string>('7OE4v5AHxkc');
  readonly useStandardHost = input<boolean>(true);
  readonly fullscreenMode = input<FullscreenMode>('host');
  readonly fullscreenClosestSelector = input<string>('');

  // ── Computed signals (public) ───────────────────────────────────────
  readonly watchUrl = computed(() => {
    const id = normalizeYouTubeVideoId(this.videoId());
    return id ? `https://www.youtube.com/watch?v=${id}` : null;
  });
  readonly isReady = computed(() => this.player.isReady());
  readonly error = computed(() => this.player.error());
  readonly duration = computed(() => this.player.duration());
  readonly currentTime = computed(() => this.player.currentTime());
  readonly isPlaying = computed(() => this.player.isPlaying());
  readonly isFullscreen = signal(false);
  readonly controlsVisible = computed(() => this.autoHide.visible());

  // ── View children ───────────────────────────────────────────────────
  @ViewChild('playerContainer', { static: true })
  private readonly playerContainer?: ElementRef<HTMLDivElement>;

  // ── Injected dependencies ───────────────────────────────────────────
  private readonly player = inject(YoutubePlayerService);
  private readonly hostRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  // ── Auto-hide controller ────────────────────────────────────────────
  private readonly autoHide = new AutoHideController(2000, () => this.isFocusInsideControls());

  // ── Effects (run in injection context) ──────────────────────────────
  private readonly inputsEffect = effect(() => {
    this.player.setVideoId(this.videoId());
    this.player.setUseStandardHost(this.useStandardHost());
  });

  // ── Lifecycle ───────────────────────────────────────────────────────
  ngOnInit(): void {
    this.initPlayer();
    this.initFullscreenListener();
    this.initResizeObserver();
    this.autoHide.scheduleHide();
  }

  // ── Public methods (template-bound) ─────────────────────────────────
  play(): void {
    this.player.play();
  }

  pause(): void {
    this.player.pause();
  }

  seekTo(seconds: number): void {
    this.player.seekTo(seconds);
  }

  onSeekChange(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.valueAsNumber;
    if (value !== undefined && Number.isFinite(value)) {
      this.seekTo(value);
    }
  }

  onPointerMove(): void {
    this.autoHide.revealThenHide();
  }

  onControlsFocus(): void {
    this.autoHide.reveal();
  }

  onControlsBlur(): void {
    this.autoHide.scheduleHide(1500);
  }

  toggleFullscreen(): void {
    const target = resolveFullscreenTarget(
      this.hostRef.nativeElement,
      this.fullscreenMode(),
      this.fullscreenClosestSelector()
    );
    toggleFullscreen(target);
  }

  // ── Private helpers ─────────────────────────────────────────────────
  private initPlayer(): void {
    if (this.playerContainer) {
      this.player.attachContainer(this.playerContainer);
    }
    this.player.setVideoId(this.videoId());
    this.player.setUseStandardHost(this.useStandardHost());
    this.player.initSocketSync();
    this.player.loadYouTubeIframeAPI();

    this.destroyRef.onDestroy(() => this.player.destroy());
  }

  private initFullscreenListener(): void {
    const handler = () => {
      const isFs = !!document.fullscreenElement;
      this.isFullscreen.set(isFs);

      // Toggle a CSS class on the fullscreen target so parent components
      // can style with `.is-fullscreen` instead of `:fullscreen` (which
      // breaks with Angular's emulated view encapsulation).
      const target = resolveFullscreenTarget(
        this.hostRef.nativeElement,
        this.fullscreenMode(),
        this.fullscreenClosestSelector()
      );
      target?.classList.toggle('is-fullscreen', isFs);

      this.autoHide.revealThenHide();
    };
    document.addEventListener('fullscreenchange', handler);
    this.destroyRef.onDestroy(() => document.removeEventListener('fullscreenchange', handler));
  }

  private initResizeObserver(): void {
    const frameEl = this.playerContainer?.nativeElement;
    if (!frameEl) return;

    const observer = observeFrameSize(frameEl, this.hostRef.nativeElement);
    this.destroyRef.onDestroy(() => {
      observer?.disconnect();
      this.autoHide.destroy();
    });
  }

  private isFocusInsideControls(): boolean {
    const active = document.activeElement as HTMLElement | null;
    const controls =
      this.playerContainer?.nativeElement?.parentElement?.querySelector('.yt-player__controls');
    return !!controls?.contains(active ?? null);
  }
}
