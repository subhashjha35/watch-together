import '../shared/youtube.globals';
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
  EmbeddedVideoPlayerService,
  observeFrameSize,
  resolveFullscreenTarget,
  toggleFullscreen
} from '../shared';
import { DecimalPipe } from '@angular/common';
import { IconComponent } from '@watch-together/shared';

@Component({
  selector: 'lib-embedded-video-player',
  imports: [DecimalPipe, IconComponent],
  templateUrl: './embedded-video-player.html',
  styleUrl: './embedded-video-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    '[attr.aria-busy]': '(!player.isReady()) ? "true" : null',
    '[attr.aria-live]': 'player.isPlaying() ? "off" : "polite"',
    '[attr.aria-label]':
      'player.watchUrl() ? `Video player for ${player.watchUrl()}` : "Video player"',
    '[class.is-fullscreen]': 'isFullscreen()',
    class: 'embedded-video-player'
  }
})
export class EmbeddedVideoPlayerComponent implements OnInit {
  public readonly videoId = input<string>('7OE4v5AHxkc');
  public readonly useStandardHost = input<boolean>(true);
  public readonly fullscreenMode = input<FullscreenMode>('host');
  public readonly fullscreenClosestSelector = input<string>('');

  public readonly isFullscreen = signal(false);
  public readonly controlsVisible = computed(() => this.autoHide.visible());

  protected readonly player = inject(EmbeddedVideoPlayerService);

  @ViewChild('playerContainer', { static: true })
  private readonly playerContainer?: ElementRef<HTMLDivElement>;

  private readonly hostRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly autoHide = new AutoHideController(2000, () => this.isFocusInsideControls());

  private readonly inputsEffect = effect(() => {
    this.player.setVideoId(this.videoId());
    this.player.setUseStandardHost(this.useStandardHost());
  });

  ngOnInit(): void {
    this.initPlayer();
    this.initFullscreenListener();
    this.initResizeObserver();
    this.autoHide.scheduleHide();
  }

  onSeekChange(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.valueAsNumber;
    if (value !== undefined && Number.isFinite(value)) {
      this.player.seekTo(value);
    }
  }

  onVolumeChange(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.valueAsNumber;
    if (value !== undefined && Number.isFinite(value)) {
      this.player.setVolume(value);
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
    const controls = this.playerContainer?.nativeElement?.parentElement?.querySelector(
      '.embedded-player__controls'
    );
    return !!controls?.contains(active ?? null);
  }
}
