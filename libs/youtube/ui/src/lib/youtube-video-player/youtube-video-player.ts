// Import ambient global typings for YouTube IFrame API
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
  ViewChild
} from '@angular/core';
import { normalizeYouTubeVideoId } from '../shared/youtube.utils';
import { YoutubePlayerService } from './youtube-player.service';

@Component({
  selector: 'lib-youtube-video-player',
  imports: [],
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

  // Private refs
  @ViewChild('playerContainer', { static: true })
  private readonly playerContainer?: ElementRef<HTMLDivElement>;

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
  }

  public ngOnDestroy(): void {
    this.player.destroy();
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
}
