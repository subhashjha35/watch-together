import { computed, DestroyRef, Directive, ElementRef, inject, input, OnInit, signal } from '@angular/core';

/** Minimum dimensions the element can be resized to (in px). */
const MIN_WIDTH = 120;
const MIN_HEIGHT = 80;

/** Size of the invisible resize hit-area in each corner (in px). */
const RESIZE_HANDLE_SIZE = 14;

/** Keyboard nudge distance (in px). */
const NUDGE_PX = 10;

/**
 * Minimum pointer movement (in px) before a pointerdown is committed
 * as a drag. Below this threshold the interaction is treated as a click
 * and child elements (buttons, links …) receive normal events.
 */
const DRAG_DEAD_ZONE = 4;

type InteractionMode = 'idle' | 'pending' | 'dragging' | 'resizing';
type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

interface Point {
  x: number;
  y: number;
}

/**
 * Makes the host element draggable and resizable via pointer (mouse / touch).
 *
 * Usage:
 * ```html
 * <div libDraggableResizable>…</div>
 * ```
 *
 * The host element MUST have `position: absolute | fixed | relative` set via
 * CSS so that `top` / `left` / `width` / `height` manipulations take effect.
 *
 * Child interactive elements (buttons, links) remain clickable — dragging
 * only begins after the pointer moves beyond a small dead-zone threshold.
 *
 * Accessibility:
 * - The element receives `tabindex="0"` so it can be focused.
 * - Arrow keys move the element; Shift+Arrow keys resize it.
 * - `role="group"` and an `aria-label` are set for screen readers.
 */
@Directive({
  selector: '[libDraggableResizable]',
  host: {
    '[attr.tabindex]': '0',
    '[attr.role]': '"group"',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-grabbed]': 'mode() === "dragging" ? "true" : "false"',
    '[style.cursor]': 'cursorStyle()',
    '[style.touch-action]': '"none"',
    '[style.user-select]': 'mode() === "dragging" || mode() === "resizing" ? "none" : null',
    '[style.will-change]': 'mode() === "dragging" || mode() === "resizing" ? "transform" : null',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerHover($event)',
    '(keydown)': 'onKeyDown($event)',
    '(dragstart)': '$event.preventDefault()'
  }
})
export class DraggableResizableDirective implements OnInit {
  // ── Inputs ──────────────────────────────────────────────────────────
  /** Whether dragging is enabled. Defaults to `true`. */
  readonly draggable = input(true);

  /** Whether resizing is enabled. Defaults to `true`. */
  readonly resizable = input(true);

  /** Whether to preserve the aspect ratio while resizing. Defaults to `true`. */
  readonly keepAspectRatio = input(true);

  /** Accessible label for the panel. */
  readonly panelLabel = input('Draggable and resizable panel');

  // ── Public signals ──────────────────────────────────────────────────
  /** Current interaction mode. */
  readonly mode = signal<InteractionMode>('idle');

  /** Current cursor to show on the host. */
  readonly cursorStyle = signal<string>('grab');

  /** Derived aria-label including current position info. */
  readonly ariaLabel = computed(() => this.panelLabel());

  // ── Private fields ──────────────────────────────────────────────────
  private readonly el: HTMLElement = inject(ElementRef).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);
  private startPointer: Point = { x: 0, y: 0 };
  private startRect = { top: 0, left: 0, width: 0, height: 0 };
  private activeCorner: ResizeCorner | null = null;
  private startAspectRatio = 1;
  private pendingPointerId: number | null = null;
  private pointerMoveListener: ((ev: PointerEvent) => void) | null = null;
  private pointerUpListener: ((ev: PointerEvent) => void) | null = null;

  // ── Lifecycle ───────────────────────────────────────────────────────
  ngOnInit(): void {
    // Ensure the element is positioned so top/left work.
    const pos = getComputedStyle(this.el).position;
    if (pos === 'static') {
      this.el.style.position = 'relative';
    }

    // Prevent native drag on all child media/images (video, img, a)
    this.el.querySelectorAll('video, img, a').forEach((child) => {
      child.setAttribute('draggable', 'false');
    });

    this.destroyRef.onDestroy(() => this.removeDocumentListeners());
  }

  // ── Public methods (template-bound) ─────────────────────────────────
  /** Determine resize corner or drag on pointerdown. */
  onPointerDown(ev: PointerEvent): void {
    // Resize corners commit immediately (no dead-zone needed)
    const corner = this.resizable() ? this.detectCorner(ev) : null;
    if (corner) {
      this.startResize(ev, corner);
      return;
    }

    // For drags, enter a "pending" state — do NOT preventDefault yet
    // so child clicks (buttons etc.) can still fire if the pointer
    // is released before exceeding the dead-zone.
    if (this.draggable()) {
      this.startPointer = { x: ev.clientX, y: ev.clientY };
      this.pendingPointerId = ev.pointerId;
      this.mode.set('pending');
      this.addPendingListeners();
    }
  }

  /** Update cursor while hovering to hint resize zones. */
  onPointerHover(ev: PointerEvent): void {
    if (this.mode() !== 'idle') return;

    if (this.resizable()) {
      const corner = this.detectCorner(ev);
      if (corner) {
        this.cursorStyle.set(corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize');
        return;
      }
    }
    this.cursorStyle.set(this.draggable() ? 'grab' : 'default');
  }

  /** Keyboard: arrows to move, shift+arrows to resize. */
  onKeyDown(ev: KeyboardEvent): void {
    const { key, shiftKey } = ev;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

    ev.preventDefault();
    const rect = this.el.getBoundingClientRect();

    if (shiftKey && this.resizable()) {
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
    } else if (this.draggable()) {
      const { top, left } = this.getCurrentTopLeft();

      let newTop = top;
      let newLeft = left;

      switch (key) {
        case 'ArrowUp':
          newTop -= NUDGE_PX;
          break;
        case 'ArrowDown':
          newTop += NUDGE_PX;
          break;
        case 'ArrowLeft':
          newLeft -= NUDGE_PX;
          break;
        case 'ArrowRight':
          newLeft += NUDGE_PX;
          break;
      }
      this.el.style.top = `${newTop}px`;
      this.el.style.left = `${newLeft}px`;
    }
  }

  // ── Private methods ─────────────────────────────────────────────────

  /**
   * While in "pending" state, listen for moves and releases.
   * If the pointer moves past the dead-zone, commit to dragging.
   * If it's released first, cancel — the click event fires normally.
   */
  private addPendingListeners(): void {
    this.pointerMoveListener = (ev: PointerEvent) => {
      const dx = ev.clientX - this.startPointer.x;
      const dy = ev.clientY - this.startPointer.y;

      if (Math.abs(dx) > DRAG_DEAD_ZONE || Math.abs(dy) > DRAG_DEAD_ZONE) {
        // Exceeded threshold — commit to dragging
        this.removeDocumentListeners();
        this.commitDrag(ev.pointerId);
      }
    };

    this.pointerUpListener = () => {
      // Released before threshold — treat as a click (do nothing)
      this.removeDocumentListeners();
      this.mode.set('idle');
      this.pendingPointerId = null;
    };

    document.addEventListener('pointermove', this.pointerMoveListener);
    document.addEventListener('pointerup', this.pointerUpListener);
  }

  /**
   * Transition from "pending" to "dragging".
   * At this point we capture the pointer and start moving the element.
   */
  private commitDrag(pointerId: number): void {
    this.mode.set('dragging');
    this.cursorStyle.set('grabbing');
    this.pendingPointerId = null;

    const { top, left } = this.getCurrentTopLeft();
    this.startRect = { top, left, width: 0, height: 0 };

    this.el.setPointerCapture(pointerId);
    this.addDragListeners();
  }

  private addDragListeners(): void {
    this.pointerMoveListener = (ev: PointerEvent) => {
      ev.preventDefault();
      const dx = ev.clientX - this.startPointer.x;
      const dy = ev.clientY - this.startPointer.y;

      if (this.mode() === 'dragging') {
        this.el.style.top = `${this.startRect.top + dy}px`;
        this.el.style.left = `${this.startRect.left + dx}px`;
      } else if (this.mode() === 'resizing') {
        this.applyResize(dx, dy);
      }
    };

    this.pointerUpListener = (ev: PointerEvent) => {
      this.el.releasePointerCapture(ev.pointerId);
      this.removeDocumentListeners();
      this.mode.set('idle');
      this.cursorStyle.set(this.draggable() ? 'grab' : 'default');
    };

    document.addEventListener('pointermove', this.pointerMoveListener);
    document.addEventListener('pointerup', this.pointerUpListener);
  }

  private removeDocumentListeners(): void {
    if (this.pointerMoveListener) {
      document.removeEventListener('pointermove', this.pointerMoveListener);
      this.pointerMoveListener = null;
    }
    if (this.pointerUpListener) {
      document.removeEventListener('pointerup', this.pointerUpListener);
      this.pointerUpListener = null;
    }
  }

  private startResize(ev: PointerEvent, corner: ResizeCorner): void {
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
    this.addDragListeners();
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

    // Lock aspect ratio: use the dominant axis to derive the other
    if (lock && ratio > 0) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        // Width is dominant → derive height
        const newHeight = width / ratio;
        // Adjust top for corners that grow upward
        if (this.activeCorner === 'ne' || this.activeCorner === 'nw') {
          top += height - newHeight;
        }
        height = newHeight;
      } else {
        // Height is dominant → derive width
        const newWidth = height * ratio;
        // Adjust left for corners that grow leftward
        if (this.activeCorner === 'sw' || this.activeCorner === 'nw') {
          left += width - newWidth;
        }
        width = newWidth;
      }
    }

    // Enforce minimums (and re-lock ratio if needed)
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
