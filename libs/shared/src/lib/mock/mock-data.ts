import { signal } from '@angular/core';

export class RTCPeerConnectionMock {
  addStream = () => {
    console.log('empty method');
  };
  createOffer = () => {
    console.log('empty method');
  };
  setLocalDescription = () => {
    console.log('empty method');
  };
  setRemoteDescription = () => {
    console.log('empty method');
  };
  // ...other methods
}
export class CallServiceMock {
  setRoomId = () => {
    console.log('empty method');
  };
  initializeStreams = () => {
    console.log('empty method');
  };
  initializePeerConnection = () => {
    console.log('empty method');
  };
  getLocalStream = () => {
    console.log('empty method');
  };
}
export class MediaServiceMock {
  public selectedVideoDevice = signal({});
  public selectedAudioDevice = signal({});
  public videoDevices = [];
  public audioDevices = [];

  private readonly mediaDevices = [];
  getUserMediaStream = () => {
    console.log('empty method');
  };
  changeVideoDeviceTo = () => {
    console.log('empty method');
  };
  changeAudioDeviceTo = () => {
    console.log('empty method');
  };
  loadDevices = () => {
    console.log('empty method');
  };
}
