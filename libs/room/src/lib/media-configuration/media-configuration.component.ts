import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaService } from '@watch-together/shared';

@Component({
  selector: 'lib-media-configuration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-configuration.component.html',
  styleUrl: './media-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaConfigurationComponent {
  audioDevices = input<MediaDeviceInfo[] | null>([]);
  videoDevices = input<MediaDeviceInfo[] | null>([]);

  private readonly mediaService = inject(MediaService);

  public changeAudio(event: any) {
    this.mediaService.changeAudioDeviceTo(event.target?.value);
  }

  public changeVideo(event: any) {
    console.error(event.target?.value);
    this.mediaService.changeVideoDeviceTo(event.target?.value);
  }
}
