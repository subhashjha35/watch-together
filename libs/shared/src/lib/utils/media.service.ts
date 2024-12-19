import { Injectable } from '@angular/core';
import { BehaviorSubject, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  public selectedVideoDevice$ = new BehaviorSubject<string | undefined>(undefined);
  public selectedAudioDevice$ = new BehaviorSubject<string | undefined>(undefined);
  private mediaDevices$ = from(navigator.mediaDevices.enumerateDevices());

  getMediaSettings() {
    return this.mediaDevices$;
  }


  getCameraSettings() {
    return this.mediaDevices$.pipe(
      map((devices) => devices.filter((device) => device.kind === 'videoinput')));
  }

  getAudioSettings() {
    return this.mediaDevices$.pipe(
      map((devices) => devices.filter((device) => device.kind === 'audioinput')));
  }

  getUserMediaStream(constraints: MediaStreamConstraints) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  changeVideoDeviceTo(deviceId: string) {
    console.error(deviceId);
    this.selectedVideoDevice$.next(deviceId);
  }

  changeAudioDeviceTo(deviceId: string) {
    console.error(deviceId);
    this.selectedAudioDevice$.next(deviceId);
  }
}
