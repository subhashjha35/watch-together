import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaService } from '@watch-together/shared';

@Component({
  selector: 'lib-media-configuration',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './media-configuration.component.html',
  styleUrl: './media-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaConfigurationComponent {
  public readonly audioDevices = input<MediaDeviceInfo[] | null>([]);
  public readonly videoDevices = input<MediaDeviceInfo[] | null>([]);

  private readonly mediaService = inject(MediaService);

  public changeAudio(event: any): void {
    this.mediaService.changeAudioDeviceTo(event.target?.value);
  }

  public changeVideo(event: any): void {
    console.error(event.target?.value);
    this.mediaService.changeVideoDeviceTo(event.target?.value);
  }
}
