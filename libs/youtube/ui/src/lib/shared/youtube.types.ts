// libs/youtube/ui/src/lib/shared/youtube.types.ts
// Strong types for YouTube IFrame API (scoped to the youtube UI library)

export interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
  getDuration: () => number;
  getCurrentTime: () => number;
}

export interface YTPlayerState {
  UNSTARTED: number;
  ENDED: number;
  PLAYING: number;
  PAUSED: number;
  BUFFERING: number;
  CUED: number;
}

export interface YTOnReadyEvent {
  target: YTPlayer;
}

export interface YTOnStateChangeEvent {
  target: YTPlayer;
  data: number;
}

export interface YTOnErrorEvent {
  data?: unknown;
}

export interface YTNamespace {
  Player: new (
    elementId: string | HTMLElement,
    options: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (ev: YTOnReadyEvent) => void;
        onStateChange?: (ev: YTOnStateChangeEvent) => void;
        onError?: (ev: YTOnErrorEvent) => void;
      };
    }
  ) => YTPlayer;
  PlayerState: YTPlayerState;
}
