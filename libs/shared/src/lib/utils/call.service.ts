import { ElementRef, inject, Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { ICall } from './socket.type';

export const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelay.project',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

@Injectable({
  providedIn: 'root',
})
export class CallService {
  private roomId: string | null = null;
  private peerConnection!: RTCPeerConnection;

  private readonly socketService: SocketService<ICall> = inject(
    SocketService<ICall>,
  );
  private remoteVideoRef: ElementRef | null = null;
  private localStream: MediaStream | null = null;
  private candidateQueue: RTCIceCandidateInit[] = []; // Queue for ICE candidates

  constructor() {
    this.initializePeerConnection();
    this.socketService.on('call', async (data) => {
      if (!this.roomId || data.roomId !== this.roomId) {
        console.warn(
          `Ignoring call event: expected roomId=${this.roomId}, received roomId=${data.roomId}`,
        );
        return;
      }
      switch (data.event) {
        case 'candidate':
          await this.handleCandidate(data.data as RTCIceCandidateInit);
          break;
        case 'offer':
          if (this.remoteVideoRef) {
            await this.handleOffer(
              data.data as RTCSessionDescription,
              this.remoteVideoRef,
            );
          } else {
            console.error('Remote video reference not set');
          }
          break;
        case 'answer':
          await this.handleAnswer(data.data as RTCSessionDescription);
          break;
        default:
          console.warn('Unknown call event:', data.event);
      }
    });
  }

  public setRoomId(roomId: string): void {
    this.roomId = roomId.trim(); // Trim to avoid whitespace issues
  }

  public getRoomId(): string | null {
    return this.roomId;
  }

  public async initializeStreams(
    remoteVideo: ElementRef,
    constraints?: MediaStreamConstraints,
  ): Promise<void> {
    this.remoteVideoRef = remoteVideo;
    await this._getStreams(remoteVideo, constraints);
  }

  public async makeCall(remoteVideo: ElementRef): Promise<void> {
    if (!this.roomId) throw new Error('roomId not set');
    this.initializePeerConnection();
    this.remoteVideoRef = remoteVideo;
    await this._initConnection(remoteVideo);
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.socketService.emit('call', {
      event: 'offer',
      data: offer,
      roomId: this.roomId,
    });
  }

  public async handleOffer(
    offer: RTCSessionDescription,
    remoteVideo: ElementRef,
  ): Promise<void> {
    if (!this.roomId) throw new Error('roomId not set');
    if (this.peerConnection.signalingState !== 'stable') {
      return;
    }
    this.initializePeerConnection();
    this.remoteVideoRef = remoteVideo;
    await this._initConnection(remoteVideo);
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(offer),
    );
    await this.processQueuedCandidates();
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.socketService.emit('call', {
      event: 'answer',
      data: answer,
      roomId: this.roomId,
    });
  }

  public async handleAnswer(answer: RTCSessionDescription): Promise<void> {
    if (this.peerConnection.signalingState !== 'have-local-offer') {
      console.error(
        `Cannot set remote answer: RTCPeerConnection not in have-local-offer state: ${this.peerConnection.signalingState}`,
      );
      return;
    }
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer),
    );
    await this.processQueuedCandidates();
  }

  public async handleCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (!candidate) return;
      if (!this.peerConnection.remoteDescription) {
        this.candidateQueue.push(candidate);
        return;
      }
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  private async processQueuedCandidates(): Promise<void> {
    while (this.candidateQueue.length > 0) {
      const candidate = this.candidateQueue.shift();
      if (candidate) {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
      }
    }
  }

  private initializePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.peerConnection = new RTCPeerConnection(rtcConfiguration);
    this.candidateQueue = []; // Reset candidate queue
    this._registerConnectionListeners();
  }

  private async _initConnection(remoteVideo: ElementRef): Promise<void> {
    await this._getStreams(remoteVideo);
  }

  private _registerConnectionListeners(): void {
    this.peerConnection.onicegatheringstatechange = () => {};
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection.connectionState === 'failed') {
        console.error('Connection failed. Restarting ICE...');
        this.peerConnection.restartIce();
      }
    };
    this.peerConnection.onsignalingstatechange = () => {};
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection.iceConnectionState === 'failed') {
        console.error('ICE connection failed. Restarting ICE...');
        this.peerConnection.restartIce();
      }
    };
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.roomId) {
        this.socketService.emit('call', {
          event: 'candidate',
          data: event.candidate.toJSON(),
          roomId: this.roomId,
        });
      }
    };
    this.peerConnection.ontrack = (event) => {
      const remoteStream = this.remoteVideoRef?.nativeElement
        .srcObject as MediaStream;
      if (remoteStream) {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      } else {
        console.error('Remote stream not initialized');
      }
    };
  }

  private async _getStreams(
    remoteVideo: ElementRef,
    constraints: MediaStreamConstraints = {
      video: true,
      audio: true,
    },
  ): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      remoteVideo.nativeElement.srcObject = new MediaStream();

      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream!);
      });
    } catch (error) {
      console.error('Error getting user media:', error);
      throw new Error('Failed to access camera or microphone.');
    }
  }
}
