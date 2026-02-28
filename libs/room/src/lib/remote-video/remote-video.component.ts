import {
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

  private readonly streamEffect = effect(() => {
    const stream = this.stream();
    const ref = this.videoEl();
    if (!ref) return;
    const video = ref.nativeElement;
    video.srcObject = stream;
    video.play().catch(() => {
      // Autoplay blocked — retry muted (browser policy)
      video.muted = true;
      video.play().catch((err: unknown) => {
        console.error('Remote video play failed:', err);
      });
    });
  });
}
