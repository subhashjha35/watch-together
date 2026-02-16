import {
  computed,
  effect,
  ElementRef,
  inject,
  Injectable,
  Signal,
  signal,
  untracked
} from '@angular/core';
import { CallService, IVideo, SocketService } from '@watch-together/shared';
import { normalizeYouTubeVideoId } from '../shared/youtube.utils';
import {
  YTOnErrorEvent,
  YTOnReadyEvent,
  YTOnStateChangeEvent,
  YTPlayer
} from '../shared/youtube.types';

@Injectable({ providedIn: 'root' })
export class YoutubePlayerService {
  // Public instance fields (inputs and derived)
  public readonly videoId = signal<string>('7OE4v5AHxkc');
  public readonly useStandardHost = signal<boolean>(true);
  public readonly watchUrl: Signal<string | null> = computed(() => {
    const id = normalizeYouTubeVideoId(this.videoId());
    return id ? `https://www.youtube.com/watch?v=${id}` : null;
  });
  public readonly isReady: Signal<boolean> = computed(() => this._isReady());
  public readonly error: Signal<string | null> = computed(() => this._error());
  public readonly duration: Signal<number> = computed(() => this._duration());
  public readonly currentTime: Signal<number> = computed(() => this._currentTime());
  public readonly isPlaying: Signal<boolean> = computed(() => this._isPlaying());

  // Private instance fields (services, internal state, refs, timers)
  private readonly _player = signal<YTPlayer | null>(null);
  private readonly _isReady = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _duration = signal<number>(0);
  private readonly _currentTime = signal<number>(0);
  private readonly _isPlaying = signal(false);
  private readonly _loadedVideoId = signal<string | null>(null);
  private containerRef: ElementRef<HTMLDivElement> | null = null;
  private isApplyingRemote = false;
  private timeUpdateInterval: number | null = null;
  private playCheckTimeout: number | null = null;
  // Thresholds to reduce micro-seeks that can cause stutter
  private readonly remoteSeekThresholdSec = 0.5; // only seek if remote time differs by > 500ms
  private readonly minorSeekThresholdSec = 0.1; // ignore ultra-small local seeks
  private readonly _videoIdEffect = effect(() => {
    const vidInput = this.videoId();
    const vid = normalizeYouTubeVideoId(vidInput);
    const apiReady = !!(window.YT && window.YT.Player);
    if (!vid || !apiReady) return;
    const current = untracked(this._player);
    const loadedId = untracked(this._loadedVideoId);
    if (current) {
      if (!loadedId) return;
      if (loadedId === vid) return;
      current.destroy();
      this._player.set(null);
      this._loadedVideoId.set(null);
    }
    this.createPlayerWithId(vid);
  });
  private readonly callService = inject(CallService);
  private readonly socketService = inject(SocketService<IVideo>);

  // Public instance methods
  public attachContainer(ref: ElementRef<HTMLDivElement>): void {
    this.containerRef = ref;
  }

  public initSocketSync(): void {
    this.socketService.on('video', (data: IVideo['dataType']) => {
      this.isApplyingRemote = true;
      this.applyRemoteEvent(data.event, data.time);
      this.isApplyingRemote = false;
    });
  }

  public destroy(): void {
    if (this.timeUpdateInterval !== null) {
      window.clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
    if (this.playCheckTimeout !== null) {
      window.clearTimeout(this.playCheckTimeout);
      this.playCheckTimeout = null;
    }
    const player = this._player();
    if (player) player.destroy();
    this._player.set(null);
  }

  public play(): void {
    const player = this._player();
    if (!player) return;
    player.playVideo();
    this.emitVideoEvent('play', this._currentTime());
    if (this.playCheckTimeout !== null) {
      window.clearTimeout(this.playCheckTimeout);
    }
    this.playCheckTimeout = window.setTimeout(() => {
      if (!this._isPlaying() && !this._error()) {
        this._error.set(
          'Playback may require sign-in or verification. You can open the video on YouTube.'
        );
      }
    }, 2500);
  }

  public pause(): void {
    const player = this._player();
    if (!player) return;
    player.pauseVideo();
    this.emitVideoEvent('pause', this._currentTime());
  }

  public seekTo(seconds: number): void {
    const player = this._player();
    if (!player) return;
    const clamped = Math.max(0, Math.min(seconds, this._duration()));
    const current = this._currentTime();
    // Avoid redundant ultra-small seeks which can cause visible glitches
    if (Math.abs(clamped - current) < this.minorSeekThresholdSec) {
      return;
    }
    player.seekTo(clamped, true);
    this._currentTime.set(clamped);
    this.emitVideoEvent('seek', clamped);
  }

  public setVideoId(id: string): void {
    this.videoId.set(id);
  }
  public setUseStandardHost(val: boolean): void {
    this.useStandardHost.set(val);
  }
  public loadYouTubeIframeAPI(): void {
    if (window.YT && window.YT.Player) {
      this.createPlayer();
      return;
    }
    const scriptId = 'youtube-iframe-api';
    if (!document.getElementById(scriptId)) {
      const tag = document.createElement('script');
      tag.id = scriptId;
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.defer = true;
      document.head.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      this.createPlayer();
    };
  }

  // Private instance methods
  private createPlayer(): void {
    if (!window.YT || !window.YT.Player) {
      this._error.set('YouTube API is not available.');
      return;
    }
    const vid = normalizeYouTubeVideoId(this.videoId());
    if (!vid) {
      this._error.set('Invalid parameter. Check the provided videoId.');
      return;
    }
    this.createPlayerWithId(vid);
  }

  private createPlayerWithId(vid: string, forceStandardHost = false): void {
    const container = this.containerRef?.nativeElement;
    if (!container) {
      this._error.set('Player container not found.');
      return;
    }
    const playerEl = document.createElement('div');
    playerEl.id = `yt-player-${Math.random().toString(36).slice(2)}`;
    container.innerHTML = '';
    container.appendChild(playerEl);
    if (!window.YT || !window.YT.Player) {
      this._error.set('YouTube API is not available.');
      return;
    }
    const host =
      forceStandardHost || this.useStandardHost()
        ? 'https://www.youtube.com'
        : 'https://www.youtube-nocookie.com';
    const player = new window.YT.Player(playerEl, {
      host,
      videoId: vid,
      playerVars: {
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: (ev: YTOnReadyEvent) => {
          this._loadedVideoId.set(vid);
          this._isReady.set(true);
          const d = ev.target.getDuration();
          if (Number.isFinite(d)) this._duration.set(d);
          this.startTimeUpdates();
        },
        onStateChange: (ev: YTOnStateChangeEvent) => {
          const state = ev.data;
          const PS = window.YT?.PlayerState;
          const t = ev.target.getCurrentTime();
          if (Number.isFinite(t)) this._currentTime.set(t);
          if (PS && state === PS.PLAYING) {
            this._isPlaying.set(true);
            if (this.playCheckTimeout !== null) {
              window.clearTimeout(this.playCheckTimeout);
              this.playCheckTimeout = null;
            }
            if (this._error()?.startsWith('Playback may require')) {
              this._error.set(null);
            }
            if (!this.isApplyingRemote) {
              this.emitVideoEvent('play', this._currentTime());
            }
          } else if (PS && (state === PS.PAUSED || state === PS.CUED)) {
            this._isPlaying.set(false);
            if (!this.isApplyingRemote) this.emitVideoEvent('pause', this._currentTime());
          } else if (PS && state === PS.ENDED) {
            this._isPlaying.set(false);
            if (!this.isApplyingRemote) this.emitVideoEvent('pause', this._duration());
          }
        },
        onError: (ev: YTOnErrorEvent) => {
          const code = ev?.data as number | undefined;
          let message: string;
          switch (code) {
            case 2:
              message = 'Invalid parameter. Check the provided videoId.';
              break;
            case 5:
              message = 'HTML5 player error. The requested content cannot be played.';
              break;
            case 100:
              message = 'Video not found or marked private.';
              break;
            case 101:
            case 150:
              message = 'The owner has restricted playback on embedded players.';
              break;
            default:
              message = `YouTube Player error: ${String(code ?? 'unknown')}`;
          }
          this._error.set(message);
          if (this.playCheckTimeout !== null) {
            window.clearTimeout(this.playCheckTimeout);
            this.playCheckTimeout = null;
          }
          this._isPlaying.set(false);
          const guidance = this._error();
          const onNoCookie = host.includes('nocookie');
          const looksLikeVerification =
            guidance?.includes('sign-in') || guidance?.includes('verification');
          if (onNoCookie && looksLikeVerification) {
            const existing = this._player();
            if (existing) {
              existing.destroy();
              this._player.set(null);
            }
            this.createPlayerWithId(vid, true);
          }
        }
      }
    });
    this._player.set(player);
  }

  private emitVideoEvent(
    event: IVideo['dataType']['event'],
    time: IVideo['dataType']['time']
  ): void {
    if (this.isApplyingRemote) return;
    this.socketService.emit('video', {
      event,
      time,
      roomId: this.callService.getRoomId?.()
    } as unknown as IVideo['dataType']);
  }

  private startTimeUpdates(): void {
    if (this.timeUpdateInterval !== null) window.clearInterval(this.timeUpdateInterval);
    this.timeUpdateInterval = window.setInterval(() => {
      const player = this._player();
      if (!player) return;
      const t = player.getCurrentTime();
      if (Number.isFinite(t)) this._currentTime.set(t);
    }, 250);
  }

  private applyRemoteEvent(
    event: IVideo['dataType']['event'],
    time: IVideo['dataType']['time']
  ): void {
    const player = this._player();
    if (!player) return;
    const current = this._currentTime();
    const hasFiniteTime = Number.isFinite(time);
    // Only perform a remote-driven seek when the delta is meaningful
    if (hasFiniteTime && Math.abs(time - current) > this.remoteSeekThresholdSec) {
      player.seekTo(time, true);
      this._currentTime.set(time);
    }
    switch (event) {
      case 'play':
        // If we're already essentially at the desired time, avoid micro-seek before play
        if (hasFiniteTime && Math.abs(time - this._currentTime()) > this.remoteSeekThresholdSec) {
          player.seekTo(time, true);
          this._currentTime.set(time);
        }
        player.playVideo();
        break;
      case 'pause':
        // Align time on pause only if significantly different
        if (hasFiniteTime && Math.abs(time - this._currentTime()) > this.remoteSeekThresholdSec) {
          player.seekTo(time, true);
          this._currentTime.set(time);
        }
        player.pauseVideo();
        break;
      case 'seek':
        // handled above via thresholded seek
        break;
      case 'videoLoaded':
        break;
    }
  }
}
