import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  public readonly selectedVideoDevice = signal<string | undefined>(undefined);
  public readonly selectedAudioDevice = signal<string | undefined>(undefined);
  public readonly videoDevices = computed(() =>
    this.mediaDevices().filter((device) => device.kind === 'videoinput')
  );

  public readonly audioDevices = computed(() =>
    this.mediaDevices().filter((device) => device.kind === 'audioinput')
  );

  private readonly mediaDevices = signal<MediaDeviceInfo[]>([]);

  public constructor() {
    void this.loadDevices();
  }

  async getUserMediaStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'navigator.mediaDevices is not available. Ensure the page is served over HTTPS.'
      );
    }
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  public changeVideoDeviceTo(deviceId: string): void {
    this.selectedVideoDevice.set(deviceId);
  }

  public changeAudioDeviceTo(deviceId: string): void {
    this.selectedAudioDevice.set(deviceId);
  }

  private async loadDevices(): Promise<void> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      console.warn('navigator.mediaDevices is not available. Media device enumeration skipped.');
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.mediaDevices.set(devices);
    } catch (error) {
      console.error('Failed to enumerate media devices:', error);
    }
  }
}
