// Ambient global typings for YouTube IFrame API
// Ensures window.YT and window.onYouTubeIframeAPIReady are recognized by the Angular compiler

import type { YTOnErrorEvent, YTOnReadyEvent, YTOnStateChangeEvent, YTPlayer } from './youtube.types';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
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
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

export {};
