import { ElementRef, inject, Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import type { ICall } from './socket.type';

export const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302'
      ]
    },
    {
      urls: 'turn:freestun.net:3479',
      username: 'free',
      credential: 'free'
    },
    {
      urls: 'turn:freestun.net:3479?transport=tcp',
      username: 'free',
      credential: 'free'
    }
  ],
  iceCandidatePoolSize: 10
};

@Injectable({
  providedIn: 'root'
})
export class CallService {
  private roomId: string | null = null;
  private peerConnection!: RTCPeerConnection;
  private readonly socketService: SocketService<ICall> = inject(SocketService<ICall>);
  private remoteVideoRef: ElementRef | null = null;
  private localStream: MediaStream | null = null;
  private candidateQueue: RTCIceCandidateInit[] = []; // Queue for ICE candidates

  constructor() {
    this.initializePeerConnection();
    this.socketService.on('call', (data) => {
      if (!this.roomId || data.roomId !== this.roomId) {
        console.warn(
          `Ignoring call event: expected roomId=${this.roomId}, received roomId=${data.roomId}`
        );
        return;
      }
      switch (data.event) {
        case 'candidate':
          void this.handleCandidate(data.data as RTCIceCandidateInit);
          break;
        case 'offer':
          if (this.remoteVideoRef) {
            void this.handleOffer(data.data as RTCSessionDescription, this.remoteVideoRef);
          } else {
            console.error('Remote video reference not set');
          }
          break;
        case 'answer':
          void this.handleAnswer(data.data as RTCSessionDescription);
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
    constraints?: MediaStreamConstraints
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
      roomId: this.roomId
    });
  }

  public async handleOffer(offer: RTCSessionDescription, remoteVideo: ElementRef): Promise<void> {
    if (!this.roomId) throw new Error('roomId not set');
    if (this.peerConnection.signalingState !== 'stable') {
      return;
    }
    this.initializePeerConnection();
    this.remoteVideoRef = remoteVideo;
    await this._initConnection(remoteVideo);
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    await this.processQueuedCandidates();
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.socketService.emit('call', {
      event: 'answer',
      data: answer,
      roomId: this.roomId
    });
  }

  public async handleAnswer(answer: RTCSessionDescription): Promise<void> {
    if (this.peerConnection.signalingState !== 'have-local-offer') {
      console.error(
        `Cannot set remote answer: RTCPeerConnection not in have-local-offer state: ${this.peerConnection.signalingState}`
      );
      return;
    }
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
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
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
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
    // Set up the remote video with a fresh MediaStream
    remoteVideo.nativeElement.srcObject = new MediaStream();

    // If we already have a local stream, reuse it by adding tracks to the new peer connection.
    // Otherwise, request media access.
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream != null) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    } else {
      await this._getStreams(remoteVideo);
    }
  }

  private _registerConnectionListeners(): void {
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'failed') {
        console.error('Connection failed. Restarting ICE...');
        this.peerConnection.restartIce();
      }
    };
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
      if (this.peerConnection.iceConnectionState === 'failed') {
        console.error('ICE connection failed. Restarting ICE...');
        this.peerConnection.restartIce();
      }
    };
    this.peerConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', this.peerConnection.iceGatheringState);
    };
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.roomId) {
        this.socketService.emit('call', {
          event: 'candidate',
          data: event.candidate.toJSON(),
          roomId: this.roomId
        });
      }
    };
    this.peerConnection.ontrack = (event) => {
      console.log('Remote track received:', event.track.kind, event.track.readyState);
      if (!this.remoteVideoRef) {
        console.error('Remote video reference not set when track received');
        return;
      }
      if (event.streams?.length > 0) {
        // Replace srcObject with the remote stream directly for better compatibility
        this.remoteVideoRef.nativeElement.srcObject = event.streams[0];
      } else {
        const existing = this.remoteVideoRef.nativeElement.srcObject as MediaStream | null;
        if (existing) {
          existing.addTrack(event.track);
        } else {
          this.remoteVideoRef.nativeElement.srcObject = new MediaStream([event.track]);
        }
      }
    };
  }

  private async _getStreams(
    remoteVideo: ElementRef,
    constraints: MediaStreamConstraints = {
      video: true,
      audio: true
    }
  ): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'navigator.mediaDevices is not available. Ensure the page is served over HTTPS.'
      );
    }
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      remoteVideo.nativeElement.srcObject = new MediaStream();

      this.localStream.getTracks().forEach((track) => {
        if (this.localStream != null) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    } catch (error) {
      console.error('Error getting user media:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        throw new Error('Camera/microphone permission denied by user or browser policy.');
      }
      if (error instanceof DOMException && error.name === 'OverconstrainedError') {
        throw new Error(
          'Camera constraints could not be satisfied. Try with different device settings.'
        );
      }
      throw new Error(
        `Failed to access camera or microphone: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
