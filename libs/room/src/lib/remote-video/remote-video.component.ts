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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<video #videoEl autoplay playsinline></video>`,
  styles: `
    :host {
      display: block;
    }
    video {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `
})
export class RemoteVideoComponent {
  readonly stream = input.required<MediaStream>();

  private readonly videoEl = viewChild.required<ElementRef<HTMLVideoElement>>('videoEl');

  private readonly streamEffect = effect(() => {
    const el = this.videoEl().nativeElement;
    el.srcObject = this.stream();
  });
}
