// libs/shared/src/lib/youtube-utils.ts
// Strong types for YouTube IFrame API and utilities used across the app.

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

// Helper: normalize and validate various YouTube URL formats into a canonical 11-char video ID
export function normalizeYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // If it already looks like an ID, validate length and chars
  const idLike = /^[A-Za-z0-9_-]{11}$/;
  if (idLike.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);

    // youtu.be/<id>
    if (url.hostname.endsWith('youtu.be')) {
      const pathId = url.pathname.split('/').filter(Boolean)[0];
      return idLike.test(pathId ?? '') ? pathId : null;
    }

    // youtube.com/watch?v=<id>
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtube-nocookie.com')) {
      const v = url.searchParams.get('v');
      if (v && idLike.test(v)) return v;

      // youtube.com/embed/<id>
      const parts = url.pathname.split('/').filter(Boolean);
      const embedIdx = parts.indexOf('embed');
      if (embedIdx !== -1 && idLike.test(parts[embedIdx + 1] ?? '')) {
        return parts[embedIdx + 1];
      }

      // youtube.com/shorts/<id>
      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx !== -1 && idLike.test(parts[shortsIdx + 1] ?? '')) {
        return parts[shortsIdx + 1];
      }
    }
  } catch {
    // Not a URL; fall through
  }

  return null;
}
