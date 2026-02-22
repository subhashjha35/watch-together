import { DestroyRef, Directive, ElementRef, inject, input, OnInit, signal } from '@angular/core';

/** Minimum dimensions the element can be resized to (in px). */
const MIN_WIDTH = 120;
const MIN_HEIGHT = 80;

/** Size of the invisible resize hit-area in each corner (in px). */
const RESIZE_HANDLE_SIZE = 14;

/** Keyboard nudge distance (in px). */
const NUDGE_PX = 10;

type ResizeMode = 'idle' | 'resizing';
type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

interface Point {
  x: number;
  y: number;
}

/**
 * Makes the host element resizable from its four corners via pointer
 * (mouse / touch).
 *
 * Usage:
 * ```html
 * <div libResizable>…</div>
 * ```
 *
 * The host element MUST have `position: absolute | fixed | relative` so
 * that `top` / `left` / `width` / `height` manipulations take effect.
 *
 * Accessibility:
 * - `tabindex="0"` for keyboard focus.
 * - Shift + Arrow keys resize by 10 px.
 */
@Directive({
  selector: '[libResizable]',
  host: {
    '[style.cursor]': 'cursorStyle()',
    '[style.touch-action]': '"none"',
    '[style.user-select]': 'mode() === "resizing" ? "none" : null',
    '[style.will-change]': 'mode() === "resizing" ? "transform" : null',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerHover($event)',
    '(keydown)': 'onKeyDown($event)'
  }
})
export class ResizableDirective implements OnInit {
  // ── Inputs ──────────────────────────────────────────────────────────
  readonly keepAspectRatio = input(true);

  // ── Public signals ──────────────────────────────────────────────────
  readonly mode = signal<ResizeMode>('idle');
  readonly cursorStyle = signal<string | null>(null);

  // ── Private fields ──────────────────────────────────────────────────
  private readonly el: HTMLElement = inject(ElementRef).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);
  private startPointer: Point = { x: 0, y: 0 };
  private startRect = { top: 0, left: 0, width: 0, height: 0 };
  private activeCorner: ResizeCorner | null = null;
  private startAspectRatio = 1;
  private pointerMoveListener: ((ev: PointerEvent) => void) | null = null;
  private pointerUpListener: ((ev: PointerEvent) => void) | null = null;

  // ── Lifecycle ───────────────────────────────────────────────────────
  ngOnInit(): void {
    const pos = getComputedStyle(this.el).position;
    if (pos === 'static') {
      this.el.style.position = 'relative';
    }

    this.destroyRef.onDestroy(() => this.removeListeners());
  }

  // ── Public methods (host-bound) ─────────────────────────────────────
  onPointerDown(ev: PointerEvent): void {
    const corner = this.detectCorner(ev);
    if (!corner) return; // Not near a corner — let event propagate

    // Mark the event so co-located directives (e.g. libDraggable) know
    // this interaction has been claimed for resizing.
    (ev as PointerEvent & { __resizing?: boolean }).__resizing = true;

    ev.preventDefault();
    ev.stopPropagation();
    this.mode.set('resizing');
    this.activeCorner = corner;
    this.startPointer = { x: ev.clientX, y: ev.clientY };
    const rect = this.el.getBoundingClientRect();
    const { top, left } = this.getCurrentTopLeft();
    this.startRect = { top, left, width: rect.width, height: rect.height };
    this.startAspectRatio = rect.height > 0 ? rect.width / rect.height : 1;
    this.el.setPointerCapture(ev.pointerId);
    this.addResizeListeners();
  }

  onPointerHover(ev: PointerEvent): void {
    if (this.mode() !== 'idle') return;

    const corner = this.detectCorner(ev);
    if (corner) {
      this.cursorStyle.set(corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize');
    } else {
      this.cursorStyle.set(null);
    }
  }

  onKeyDown(ev: KeyboardEvent): void {
    if (!ev.shiftKey) return;
    const { key } = ev;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

    ev.preventDefault();
    const rect = this.el.getBoundingClientRect();
    let w = rect.width;
    let h = rect.height;
    const ratio = h > 0 ? w / h : 1;
    const lock = this.keepAspectRatio();

    switch (key) {
      case 'ArrowRight':
        w += NUDGE_PX;
        if (lock) h = w / ratio;
        break;
      case 'ArrowLeft':
        w = Math.max(MIN_WIDTH, w - NUDGE_PX);
        if (lock) h = w / ratio;
        break;
      case 'ArrowDown':
        h += NUDGE_PX;
        if (lock) w = h * ratio;
        break;
      case 'ArrowUp':
        h = Math.max(MIN_HEIGHT, h - NUDGE_PX);
        if (lock) w = h * ratio;
        break;
    }
    this.el.style.width = `${w}px`;
    this.el.style.height = `${h}px`;
  }

  // ── Private methods ─────────────────────────────────────────────────
  private addResizeListeners(): void {
    this.pointerMoveListener = (ev: PointerEvent) => {
      ev.preventDefault();
      const dx = ev.clientX - this.startPointer.x;
      const dy = ev.clientY - this.startPointer.y;
      this.applyResize(dx, dy);
    };

    this.pointerUpListener = (ev: PointerEvent) => {
      this.el.releasePointerCapture(ev.pointerId);
      this.removeListeners();
      this.mode.set('idle');
      this.activeCorner = null;
    };

    document.addEventListener('pointermove', this.pointerMoveListener);
    document.addEventListener('pointerup', this.pointerUpListener);
  }

  private removeListeners(): void {
    if (this.pointerMoveListener) {
      document.removeEventListener('pointermove', this.pointerMoveListener);
      this.pointerMoveListener = null;
    }
    if (this.pointerUpListener) {
      document.removeEventListener('pointerup', this.pointerUpListener);
      this.pointerUpListener = null;
    }
  }

  private getCurrentTopLeft(): { top: number; left: number } {
    const style = getComputedStyle(this.el);
    return {
      top: parseFloat(style.top) || 0,
      left: parseFloat(style.left) || 0
    };
  }

  private applyResize(dx: number, dy: number): void {
    let { top, left, width, height } = this.startRect;
    const ratio = this.startAspectRatio;
    const lock = this.keepAspectRatio();

    switch (this.activeCorner) {
      case 'se':
        width += dx;
        height += dy;
        break;
      case 'sw':
        width -= dx;
        height += dy;
        left += dx;
        break;
      case 'ne':
        width += dx;
        height -= dy;
        top += dy;
        break;
      case 'nw':
        width -= dx;
        height -= dy;
        top += dy;
        left += dx;
        break;
    }

    // Lock aspect ratio: dominant axis drives the other
    if (lock && ratio > 0) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        const newHeight = width / ratio;
        if (this.activeCorner === 'ne' || this.activeCorner === 'nw') {
          top += height - newHeight;
        }
        height = newHeight;
      } else {
        const newWidth = height * ratio;
        if (this.activeCorner === 'sw' || this.activeCorner === 'nw') {
          left += width - newWidth;
        }
        width = newWidth;
      }
    }

    // Enforce minimums (re-lock ratio if needed)
    if (width < MIN_WIDTH) {
      if (this.activeCorner === 'sw' || this.activeCorner === 'nw') {
        left -= MIN_WIDTH - width;
      }
      width = MIN_WIDTH;
      if (lock && ratio > 0) {
        const newHeight = width / ratio;
        if (this.activeCorner === 'ne' || this.activeCorner === 'nw') {
          top += height - newHeight;
        }
        height = newHeight;
      }
    }
    if (height < MIN_HEIGHT) {
      if (this.activeCorner === 'nw' || this.activeCorner === 'ne') {
        top -= MIN_HEIGHT - height;
      }
      height = MIN_HEIGHT;
      if (lock && ratio > 0) {
        const newWidth = height * ratio;
        if (this.activeCorner === 'sw' || this.activeCorner === 'nw') {
          left += width - newWidth;
        }
        width = newWidth;
      }
    }

    this.el.style.top = `${top}px`;
    this.el.style.left = `${left}px`;
    this.el.style.width = `${width}px`;
    this.el.style.height = `${height}px`;
  }

  private detectCorner(ev: PointerEvent): ResizeCorner | null {
    const rect = this.el.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const s = RESIZE_HANDLE_SIZE;

    const atLeft = x < s;
    const atRight = x > w - s;
    const atTop = y < s;
    const atBottom = y > h - s;

    if (atTop && atLeft) return 'nw';
    if (atTop && atRight) return 'ne';
    if (atBottom && atLeft) return 'sw';
    if (atBottom && atRight) return 'se';
    return null;
  }
}
