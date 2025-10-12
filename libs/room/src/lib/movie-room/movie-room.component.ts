import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextChatComponent } from '@watch-together/chat';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';
import {
  CallService,
  ICall,
  IRoom,
  MediaService,
  SocketService,
} from '@watch-together/shared';
import { VideoComponent } from '../video';
import { VideoPlayerComponent } from '@watch-together/video-player-new';

@Component({
  selector: 'lib-movie-room',
  standalone: true,
  imports: [
    CommonModule,
    TextChatComponent,
    VideoPlayerComponent,
    VideoComponent,
  ],
  templateUrl: './movie-room.component.html',
  styleUrl: './movie-room.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieRoomComponent implements OnInit, AfterViewInit {
  readonly myVideo = viewChild.required<VideoComponent>('myVideo');
  readonly remoteVideo =
    viewChild.required<ElementRef<HTMLVideoElement>>('remoteVideo');
  private readonly route = inject(ActivatedRoute);
  private readonly socketService = inject(SocketService<ICall>);
  private readonly roomSocketService = inject(SocketService<IRoom>);
  private readonly callService = inject(CallService);
  private readonly mediaService = inject(MediaService);
  private roomId = '';

  ngOnInit(): void {
    this.route.params.pipe(filter((params) => !!params)).subscribe((params) => {
      this.roomId = params['roomId'] || 'abc';
      this.callService.setRoomId(this.roomId); // Set roomId
      this.joinRoom();
    });
  }

  async ngAfterViewInit() {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          aspectRatio: 1.77778,
          width: { exact: 320 },
          deviceId: {
            exact: this.mediaService.selectedVideoDevice$.value || undefined,
          },
        },
        audio: { noiseSuppression: true },
      };
      await this.callService.initializeStreams(this.remoteVideo(), constraints);
      const localStream = this.callService.getLocalStream();
      if (localStream) {
        this.myVideo().setVideo(localStream);
      }
    } catch (error) {
      console.error('Error initializing video stream:', error);
    }
  }

  joinRoom() {
    this.roomSocketService.emit('room', { event: 'join', roomId: this.roomId });
    this.roomSocketService.on(
      'room',
      async (data: { socketId: string; event: string }) => {
        if (
          data.event === 'join' &&
          data.socketId !== this.socketService.socket.id
        ) {
          console.log(`Initiating call to peer: ${data.socketId}`);
          await this.startCall();
        }
      },
    );
  }

  async startCall() {
    try {
      await this.callService.makeCall(this.remoteVideo());
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }
}
