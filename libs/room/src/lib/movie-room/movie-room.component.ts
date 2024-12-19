import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextChatComponent } from '@watch-together/chat';
import { VideoPlayerComponent } from '@watch-together/video-player';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';
import { CommonSocketService, MediaService } from '@watch-together/utils';
import { Socket } from 'socket.io-client';
import { VideoComponent } from '../video/video.component';


@Component({
  selector: 'lib-movie-room',
  standalone: true,
  imports: [CommonModule, TextChatComponent, VideoPlayerComponent, VideoComponent],
  templateUrl: './movie-room.component.html',
  styleUrl: './movie-room.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovieRoomComponent implements OnInit, AfterViewInit {
  @ViewChild('video') videoComponent!: VideoComponent;
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;
  private route = inject(ActivatedRoute);
  private commonSocketService = inject(CommonSocketService);
  private mediaService = inject(MediaService);
  private socket!: Socket;

  private peerConnection!: RTCPeerConnection;
  private roomId = 'abcd'; // Can be dynamic

  private servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  ngOnInit(): void {
    this.socket = this.commonSocketService.socket;

    this.route.params.pipe(filter((params) => !!params)).subscribe(params => {
      console.log('params', params);
      // this.emit('createRoom', params['roomId']);
    });

    this.initWebRTC();
    this.joinRoom();

  }

  async ngAfterViewInit() {
    console.error(this.videoComponent);
    try {

      this.mediaService.selectedVideoDevice$.subscribe(async (deviceId) => {
        const constraints: MediaStreamConstraints = {
          video: {
            aspectRatio: 1.77778,
            width: { exact: 320 },
            deviceId: { exact: deviceId || undefined }
          },
          audio: { noiseSuppression: true }
        };

        const stream = await this.mediaService.getUserMediaStream(constraints);
        this.videoComponent.setVideo(stream);

      });
    } catch (error) {
      console.error('Error opening video camera.', error);
    }
  }

  // Join the chat room
  joinRoom() {
    this.socket.emit('join-room', this.roomId);

    // When another user joins, handle signaling
    this.socket.on('user-joined', (socketId) => {
      console.log('User joined:', socketId);
      this.createOffer();
    });

    this.socket.on('offer', (socketId, offer) => {
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      this.createAnswer();
    });

    this.socket.on('answer', (socketId, answer) => {
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    this.socket.on('ice-candidate', (socketId, candidate) => {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    this.socket.on('user-left', (socketId) => {
      console.log('User left:', socketId);
    });
  }

  initWebRTC() {
    this.peerConnection = new RTCPeerConnection(this.servers);

    // Add local stream
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      this.videoComponent.setVideo(stream);
      stream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, stream);
      });
    });

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.error(event.streams);
      this.remoteVideo.nativeElement.srcObject = event.streams[0];
    };

    // ICE candidate exchange
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', this.roomId, event.candidate);
      }
    };
  }

  // Create and send offer
  createOffer() {
    this.peerConnection.createOffer().then((offer) => {
      this.peerConnection.setLocalDescription(offer);
      this.socket.emit('offer', this.roomId, offer);
    });
  }

  // Create and send answer
  createAnswer() {
    this.peerConnection.createAnswer().then((answer) => {
      this.peerConnection.setLocalDescription(answer);
      this.socket.emit('answer', this.roomId, answer);
    });
  }
}
