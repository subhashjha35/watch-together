import { signal } from '@angular/core';

/**
 * Manages auto-hide visibility state with a configurable delay.
 * Typically used for overlaying player controls that should fade after inactivity.
 */
export class AutoHideController {
  /** Whether the controlled element is currently visible. */
  public readonly visible = signal(true);

  private _hideTimeout: number | null = null;

  /**
   * @param _defaultDelay Default delay in ms before hiding. Defaults to 2000.
   * @param _focusCheckFn Optional predicate; if it returns `true`, hide is skipped.
   */
  constructor(
    private readonly _defaultDelay = 2000,
    private readonly _focusCheckFn?: () => boolean
  ) {}

  /** Show immediately, then schedule hide after the given delay. */
  revealThenHide(delayMs = this._defaultDelay): void {
    this.visible.set(true);
    this.scheduleHide(delayMs);
  }

  /** Show immediately and cancel any pending hide. */
  reveal(): void {
    this.visible.set(true);
    this.cancelHide();
  }

  /** Schedule a hide after `delayMs`. Resets any existing timer. */
  scheduleHide(delayMs = this._defaultDelay): void {
    this.cancelHide();
    this._hideTimeout = window.setTimeout(() => {
      if (this._focusCheckFn?.()) return;
      this.visible.set(false);
    }, delayMs);
  }

  /** Cancel any pending hide timeout. */
  cancelHide(): void {
    if (this._hideTimeout !== null) {
      window.clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }
  }

  /** Clean up timers. Call on destroy. */
  destroy(): void {
    this.cancelHide();
  }
}
