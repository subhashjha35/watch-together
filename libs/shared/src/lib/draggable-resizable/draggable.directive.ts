import { computed, DestroyRef, Directive, ElementRef, inject, input, OnInit, signal } from '@angular/core';

/** Keyboard nudge distance (in px). */
const NUDGE_PX = 10;

/**
 * Minimum pointer movement (in px) before a pointerdown is committed
 * as a drag. Below this threshold the interaction is treated as a click
 * so child interactive elements (buttons, links) still receive events.
 */
const DRAG_DEAD_ZONE = 4;

type DragMode = 'idle' | 'pending' | 'dragging';

interface Point {
  x: number;
  y: number;
}

/**
 * Makes the host element draggable via pointer (mouse / touch).
 *
 * Usage:
 * ```html
 * <div libDraggable>…</div>
 * ```
 *
 * The host element MUST have `position: absolute | fixed | relative` so
 * that `top` / `left` manipulations take effect.
 *
 * Child interactive elements remain clickable — dragging only begins
 * after the pointer moves beyond a small dead-zone threshold.
 *
 * Accessibility:
 * - `tabindex="0"` for keyboard focus.
 * - Arrow keys nudge position by 10 px.
 * - `aria-grabbed` reflects drag state.
 */
@Directive({
  selector: '[libDraggable]',
  host: {
    '[attr.tabindex]': '0',
    '[attr.role]': '"group"',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-grabbed]': 'mode() === "dragging" ? "true" : "false"',
    '[style.cursor]': 'cursorStyle()',
    '[style.touch-action]': '"none"',
    '[style.user-select]': 'mode() === "dragging" ? "none" : null',
    '[style.will-change]': 'mode() === "dragging" ? "transform" : null',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKeyDown($event)',
    '(dragstart)': '$event.preventDefault()'
  }
})
export class DraggableDirective implements OnInit {
  // ── Inputs ──────────────────────────────────────────────────────────
  readonly panelLabel = input('Draggable panel');

  // ── Public signals ──────────────────────────────────────────────────
  readonly mode = signal<DragMode>('idle');
  readonly cursorStyle = signal<string>('grab');
  readonly ariaLabel = computed(() => this.panelLabel());

  // ── Private fields ──────────────────────────────────────────────────
  private readonly el: HTMLElement = inject(ElementRef).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);
  private startPointer: Point = { x: 0, y: 0 };
  private startTopLeft = { top: 0, left: 0 };
  private pointerMoveListener: ((ev: PointerEvent) => void) | null = null;
  private pointerUpListener: ((ev: PointerEvent) => void) | null = null;

  // ── Lifecycle ───────────────────────────────────────────────────────
  ngOnInit(): void {
    const pos = getComputedStyle(this.el).position;
    if (pos === 'static') {
      this.el.style.position = 'relative';
    }

    this.el.querySelectorAll('video, img, a').forEach((child) => {
      child.setAttribute('draggable', 'false');
    });

    this.destroyRef.onDestroy(() => this.removeListeners());
  }

  // ── Public methods (host-bound) ─────────────────────────────────────
  onPointerDown(ev: PointerEvent): void {
    // Skip if a co-located resize directive has already claimed this event
    if ((ev as PointerEvent & { __resizing?: boolean }).__resizing) return;

    this.startPointer = { x: ev.clientX, y: ev.clientY };
    this.mode.set('pending');
    this.addPendingListeners();
  }

  onKeyDown(ev: KeyboardEvent): void {
    const { key } = ev;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

    ev.preventDefault();
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

  // ── Private methods ─────────────────────────────────────────────────
  private addPendingListeners(): void {
    this.pointerMoveListener = (ev: PointerEvent) => {
      const dx = ev.clientX - this.startPointer.x;
      const dy = ev.clientY - this.startPointer.y;

      if (Math.abs(dx) > DRAG_DEAD_ZONE || Math.abs(dy) > DRAG_DEAD_ZONE) {
        this.removeListeners();
        this.commitDrag(ev.pointerId);
      }
    };

    this.pointerUpListener = () => {
      this.removeListeners();
      this.mode.set('idle');
    };

    document.addEventListener('pointermove', this.pointerMoveListener);
    document.addEventListener('pointerup', this.pointerUpListener);
  }

  private commitDrag(pointerId: number): void {
    this.mode.set('dragging');
    this.cursorStyle.set('grabbing');
    this.startTopLeft = this.getCurrentTopLeft();
    this.el.setPointerCapture(pointerId);

    this.pointerMoveListener = (ev: PointerEvent) => {
      ev.preventDefault();
      const dx = ev.clientX - this.startPointer.x;
      const dy = ev.clientY - this.startPointer.y;
      this.el.style.top = `${this.startTopLeft.top + dy}px`;
      this.el.style.left = `${this.startTopLeft.left + dx}px`;
    };

    this.pointerUpListener = (ev: PointerEvent) => {
      this.el.releasePointerCapture(ev.pointerId);
      this.removeListeners();
      this.mode.set('idle');
      this.cursorStyle.set('grab');
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
}
