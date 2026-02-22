/**
 * Observe the content-box size of `target` and mirror its dimensions as CSS
 * custom properties on `host`.
 *
 * @returns The `ResizeObserver` instance (for later disconnect) or `null` if
 *          `ResizeObserver` is not supported.
 */
export function observeFrameSize(
  target: HTMLElement,
  host: HTMLElement,
  widthProp = '--yt-frame-width',
  heightProp = '--yt-frame-height'
): ResizeObserver | null {
  if (!('ResizeObserver' in window)) return null;

  const observer = new ResizeObserver((entries) => {
    const rect = entries[0]?.contentRect;
    if (rect) {
      host.style.setProperty(widthProp, `${rect.width}px`);
      host.style.setProperty(heightProp, `${rect.height}px`);
    }
  });

  observer.observe(target);
  return observer;
}
