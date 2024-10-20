import { Injectable } from '@angular/core';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
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
}
