import { ChangeDetectionStrategy, Component, effect, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'lib-remote-video',
  imports: [],
  templateUrl: './remote-video.component.html',
  styleUrl: './remote-video.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RemoteVideoComponent {
  readonly stream = input.required<MediaStream>();

  private readonly videoEl = viewChild.required<ElementRef<HTMLVideoElement>>('videoEl');

  private readonly streamEffect = effect(() => {
    const el = this.videoEl().nativeElement;
    el.srcObject = this.stream();
  });
}
