import { signal } from '@angular/core';

export class RTCPeerConnectionMock {
  addStream = jest.fn();
  createOffer = jest.fn().mockResolvedValue({});
  setLocalDescription = jest.fn();
  setRemoteDescription = jest.fn();
  // ...other methods
}
export class CallServiceMock {
  setRoomId = jest.fn();
  initializeStreams = jest.fn();
  initializePeerConnection = jest.fn();
  getLocalStream = jest.fn();
}
export class MediaServiceMock {
  public selectedVideoDevice = signal({});
  public selectedAudioDevice = signal({});
  public videoDevices = [];
  public audioDevices = [];
  private mediaDevices = [];
  getUserMediaStream = jest.fn();
  changeVideoDeviceTo = jest.fn();
  changeAudioDeviceTo = jest.fn();
  loadDevices = jest.fn();
}
