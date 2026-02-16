import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  public selectedVideoDevice = signal<string | undefined>(undefined);
  public selectedAudioDevice = signal<string | undefined>(undefined);
  public videoDevices = computed(() =>
    this.mediaDevices().filter((device) => device.kind === 'videoinput')
  );

  public audioDevices = computed(() =>
    this.mediaDevices().filter((device) => device.kind === 'audioinput')
  );

  private readonly mediaDevices = signal<MediaDeviceInfo[]>([]);

  public constructor() {
    void this.loadDevices();
  }

  getUserMediaStream(constraints: MediaStreamConstraints) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  public changeVideoDeviceTo(deviceId: string) {
    this.selectedVideoDevice.set(deviceId);
  }

  public changeAudioDeviceTo(deviceId: string) {
    this.selectedAudioDevice.set(deviceId);
  }

  private async loadDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.mediaDevices.set(devices);
  }
}
