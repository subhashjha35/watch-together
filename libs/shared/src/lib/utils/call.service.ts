import { inject, Injectable, signal } from '@angular/core';
import { SocketService } from './socket.service';
import type { ICall } from './socket.type';
import { IceConfigService } from './ice-config.service';

/** STUN-only fallback used until the server config is loaded. */
const STUN_ONLY_FALLBACK: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ]
    }
  ],
  iceCandidatePoolSize: 10
};

@Injectable({
  providedIn: 'root'
})
export class CallService {
  private roomId: string | null = null;
  private readonly peerConnections = new Map<string, RTCPeerConnection>();
  private readonly candidateQueues = new Map<string, RTCIceCandidateInit[]>();
  private readonly socketService: SocketService<ICall> = inject(SocketService<ICall>);
  private readonly iceConfigService = inject(IceConfigService);
  private localStream: MediaStream | null = null;
  private rtcConfig: RTCConfiguration = STUN_ONLY_FALLBACK;

  /** Reactive map of remote peer streams, keyed by socketId. */
  readonly remoteStreams = signal<ReadonlyMap<string, MediaStream>>(new Map());

  constructor() {
    this.socketService.on('call', (data) => {
      if (!this.roomId || data.roomId !== this.roomId) {
        console.warn(
          `Ignoring call event: expected roomId=${this.roomId}, received roomId=${data.roomId}`
        );
        return;
      }
      const peerId = data.socketId;
      if (!peerId) {
        console.warn('Ignoring call event without socketId');
        return;
      }
      switch (data.event) {
        case 'candidate':
          void this.handleCandidate(peerId, data.data as RTCIceCandidateInit);
          break;
        case 'offer':
          void this.handleOffer(peerId, data.data as RTCSessionDescription);
          break;
        case 'answer':
          void this.handleAnswer(peerId, data.data as RTCSessionDescription);
          break;
        default:
          console.warn('Unknown call event:', data.event);
      }
    });
  }

  public setRoomId(roomId: string): void {
    this.roomId = roomId.trim();
  }

  public getRoomId(): string | null {
    return this.roomId;
  }

  public async loadIceConfig(): Promise<void> {
    this.rtcConfig = await this.iceConfigService.getConfig();
  }

  public async initializeStreams(constraints?: MediaStreamConstraints): Promise<void> {
    if (this.localStream) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'navigator.mediaDevices is not available. Ensure the page is served over HTTPS.'
      );
    }
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        constraints ?? { video: true, audio: true }
      );
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

  public async makeCall(targetSocketId: string): Promise<void> {
    if (!this.roomId) throw new Error('roomId not set');
    const pc = this.getOrCreatePeerConnection(targetSocketId);
    this.addLocalTracks(pc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.socketService.emit('call', {
      event: 'offer',
      data: offer,
      roomId: this.roomId,
      targetSocketId
    });
  }

  public async handleOffer(peerId: string, offer: RTCSessionDescription): Promise<void> {
    if (!this.roomId) throw new Error('roomId not set');
    // Glare handling: if we already have a connection with a local offer, use tiebreaker
    const existing = this.peerConnections.get(peerId);
    if (existing && existing.signalingState === 'have-local-offer') {
      // Use socket ID comparison as tiebreaker — lower ID wins as offerer
      const mySocketId = this.socketService.socket?.id ?? '';
      if (mySocketId < peerId) {
        // We win: ignore their offer, they should accept our offer
        console.log(`Glare with ${peerId}: we win, ignoring their offer`);
        return;
      }
      // They win: rollback our offer and accept theirs
      console.log(`Glare with ${peerId}: they win, rolling back`);
      await existing.setLocalDescription({ type: 'rollback' });
    }
    const pc = this.getOrCreatePeerConnection(peerId);
    this.addLocalTracks(pc);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await this.processQueuedCandidates(peerId);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.socketService.emit('call', {
      event: 'answer',
      data: answer,
      roomId: this.roomId,
      targetSocketId: peerId
    });
  }

  public async handleAnswer(peerId: string, answer: RTCSessionDescription): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) {
      console.warn(`No peer connection for ${peerId} to apply answer`);
      return;
    }
    if (pc.signalingState !== 'have-local-offer') {
      console.error(`Cannot set remote answer for ${peerId}: state is ${pc.signalingState}`);
      return;
    }
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    await this.processQueuedCandidates(peerId);
  }

  public async handleCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (!candidate) return;
      const pc = this.peerConnections.get(peerId);
      if (!pc?.remoteDescription) {
        const queue = this.candidateQueues.get(peerId) ?? [];
        queue.push(candidate);
        this.candidateQueues.set(peerId, queue);
        return;
      }
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error(`Error adding ICE candidate for ${peerId}:`, error);
    }
  }

  public removePeer(peerId: string): void {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      // Detach listeners before closing to prevent re-entrant calls
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.close();
      this.peerConnections.delete(peerId);
    }
    this.candidateQueues.delete(peerId);
    this.iceRestartAttempts.delete(peerId);
    this.remoteStreams.update((current) => {
      if (!current.has(peerId)) return current;
      const next = new Map(current);
      next.delete(peerId);
      return next;
    });
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  private getOrCreatePeerConnection(peerId: string): RTCPeerConnection {
    let pc = this.peerConnections.get(peerId);
    if (pc) return pc;
    pc = new RTCPeerConnection(this.rtcConfig);
    this.peerConnections.set(peerId, pc);
    this.candidateQueues.set(peerId, []);
    this.registerConnectionListeners(peerId, pc);
    return pc;
  }

  private addLocalTracks(pc: RTCPeerConnection): void {
    if (!this.localStream) return;
    // Only add tracks if they haven't been added yet
    const senders = pc.getSenders();
    this.localStream.getTracks().forEach((track) => {
      if (!senders.some((s) => s.track === track)) {
        pc.addTrack(track, this.localStream!);
      }
    });
  }

  private async processQueuedCandidates(peerId: string): Promise<void> {
    const queue = this.candidateQueues.get(peerId);
    if (!queue) return;
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;
    while (queue.length > 0) {
      const candidate = queue.shift();
      if (candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    }
  }

  private readonly iceRestartAttempts = new Map<string, number>();
  private static readonly MAX_ICE_RESTARTS = 2;

  private async attemptIceRestart(peerId: string, pc: RTCPeerConnection): Promise<void> {
    const attempts = this.iceRestartAttempts.get(peerId) ?? 0;
    if (attempts >= CallService.MAX_ICE_RESTARTS) {
      console.error(`[${peerId}] ICE restart limit reached (${attempts}). Cleaning up.`);
      this.removePeer(peerId);
      return;
    }
    this.iceRestartAttempts.set(peerId, attempts + 1);
    console.warn(`[${peerId}] Attempting ICE restart (attempt ${attempts + 1}).`);
    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      if (this.roomId) {
        this.socketService.emit('call', {
          event: 'offer',
          data: offer,
          roomId: this.roomId,
          targetSocketId: peerId
        });
      }
    } catch (err) {
      console.error(`[${peerId}] ICE restart failed:`, err);
      this.removePeer(peerId);
    }
  }

  private registerConnectionListeners(peerId: string, pc: RTCPeerConnection): void {
    pc.onconnectionstatechange = () => {
      console.log(`[${peerId}] Connection state:`, pc.connectionState);
      switch (pc.connectionState) {
        case 'connected':
          // Reset restart counter on successful connection
          this.iceRestartAttempts.delete(peerId);
          break;
        case 'failed':
          void this.attemptIceRestart(peerId, pc);
          break;
        case 'disconnected':
          // Peer may reconnect briefly — wait before cleaning up
          setTimeout(() => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
              console.warn(`[${peerId}] Still disconnected. Attempting ICE restart.`);
              void this.attemptIceRestart(peerId, pc);
            }
          }, 5000);
          break;
        case 'closed':
          this.iceRestartAttempts.delete(peerId);
          this.removePeer(peerId);
          break;
      }
    };
    pc.oniceconnectionstatechange = () => {
      console.log(`[${peerId}] ICE connection state:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        void this.attemptIceRestart(peerId, pc);
      }
    };
    pc.onicegatheringstatechange = () => {
      console.log(`[${peerId}] ICE gathering state:`, pc.iceGatheringState);
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && this.roomId) {
        this.socketService.emit('call', {
          event: 'candidate',
          data: event.candidate.toJSON(),
          roomId: this.roomId,
          targetSocketId: peerId
        });
      }
    };
    pc.ontrack = (event) => {
      console.log(`[${peerId}] Remote track received:`, event.track.kind, event.track.readyState);
      const stream = event.streams?.[0] ?? new MediaStream([event.track]);
      this.remoteStreams.update((current) => {
        const next = new Map(current);
        next.set(peerId, stream);
        return next;
      });
    };
  }
}
