import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  viewChild
} from '@angular/core';

@Component({
  selector: 'lib-remote-video',
  imports: [],
  templateUrl: './remote-video.component.html',
  styleUrl: './remote-video.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RemoteVideoComponent {
  readonly stream = input.required<MediaStream>();

  private readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      const ref = this.videoEl();
      if (ref) {
        ref.nativeElement.srcObject = null;
      }
    });

    effect(() => {
      const stream = this.stream();
      const ref = this.videoEl();
      if (!ref || this.destroyed) return;
      const video = ref.nativeElement;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      if (video.paused) {
        video.play().catch((err: unknown) => {
          if (!this.destroyed) {
            console.error('Remote video play failed:', err);
          }
        });
      }
    });
  }
}
