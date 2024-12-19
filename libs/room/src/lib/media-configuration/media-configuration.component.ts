import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaService } from '@watch-together/utils';

@Component({
  selector: 'lib-media-configuration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-configuration.component.html',
  styleUrl: './media-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaConfigurationComponent {
  @Input({ transform: (value: MediaDeviceInfo[] | null): MediaDeviceInfo[] => value || [] }) audioDevices: MediaDeviceInfo[] = [];
  @Input({ transform: (value: MediaDeviceInfo[] | null): MediaDeviceInfo[] => value || [] }) videoDevices: MediaDeviceInfo[] = [];

  private mediaService = inject(MediaService);

  public changeAudio(event: any) {
    this.mediaService.changeAudioDeviceTo(event.target?.value);
  }

  public changeVideo(event: any) {
    console.error(event.target?.value);
    this.mediaService.changeVideoDeviceTo(event.target?.value);
  }
}
