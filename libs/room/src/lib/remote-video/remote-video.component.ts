import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
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
  private viewReady = false;

  constructor() {
    afterNextRender(() => {
      this.viewReady = true;
      this.attachStream();
    });

    effect(() => {
      // Track the stream signal so effect re-runs when it changes
      this.stream();
      if (this.viewReady) {
        this.attachStream();
      }
    });
  }

  private attachStream(): void {
    const ref = this.videoEl();
    if (!ref) return;
    const video = ref.nativeElement;
    const stream = this.stream();
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    // Ensure playback starts (muted in template to satisfy autoplay policy)
    if (video.paused) {
      video.play().catch((err: unknown) => {
        console.error('Remote video play failed:', err);
      });
    }
  }
}
