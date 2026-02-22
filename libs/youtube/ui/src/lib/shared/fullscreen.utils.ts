/**
 * Fullscreen utilities for resolving target elements and toggling fullscreen mode.
 */

export type FullscreenMode = 'host' | 'parent' | 'closest';

/**
 * Resolve the fullscreen target element based on the requested mode.
 */
export function resolveFullscreenTarget(
  host: HTMLElement,
  mode: FullscreenMode,
  closestSelector: string
): HTMLElement | null {
  switch (mode) {
    case 'host':
      return host;
    case 'parent':
      return host.parentElement;
    case 'closest': {
      const sel = closestSelector.trim();
      return sel ? host.closest<HTMLElement>(sel) : host;
    }
  }
}

/**
 * Toggle fullscreen on the given target element.
 * If already in fullscreen, exits; otherwise enters fullscreen on the target.
 */
export function toggleFullscreen(target: HTMLElement | null): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }

  target?.requestFullscreen?.().catch((err: unknown) => {
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('requestFullscreen denied', err);
    }
  });
}
