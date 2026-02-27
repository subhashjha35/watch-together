import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextChatComponent } from '@watch-together/chat';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';
import {
  CallService,
  DraggableDirective,
  ICall,
  IRoom,
  MediaService,
  ResizableDirective,
  SocketService
} from '@watch-together/shared';
import { VideoComponent } from '../video';
import { YoutubeVideoPlayerComponent } from '@watch-together/youtube-ui';

@Component({
  selector: 'lib-movie-room',
  imports: [
    CommonModule,
    TextChatComponent,
    VideoComponent,
    YoutubeVideoPlayerComponent,
    DraggableDirective,
    ResizableDirective
  ],
  standalone: true,
  templateUrl: './movie-room.component.html',
  styleUrl: './movie-room.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovieRoomComponent implements OnInit, AfterViewInit {
  readonly myVideo = viewChild.required<VideoComponent>('myVideo');
  readonly remoteVideo = viewChild.required<ElementRef<HTMLVideoElement>>('remoteVideo');
  private readonly route = inject(ActivatedRoute);
  private readonly socketService = inject(SocketService<ICall>);
  private readonly roomSocketService = inject(SocketService<IRoom>);
  private readonly callService = inject(CallService);
  private readonly mediaService = inject(MediaService);
  private roomId = '';

  public ngOnInit(): void {
    this.route.params.pipe(filter((params) => !!params)).subscribe((params) => {
      this.roomId = params['roomId'] ?? 'abc';
      this.callService.setRoomId(this.roomId); // Set roomId
    });
  }

  public ngAfterViewInit() {
    void this.initializeVideoStreams().then(() => {
      this.joinRoom();
    });
  }

  public async startCall() {
    try {
      await this.callService.makeCall(this.remoteVideo());
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }

  private async initializeVideoStreams() {
    try {
      const selectedDevice = this.mediaService.selectedVideoDevice();
      const videoConstraints: MediaTrackConstraints = {
        aspectRatio: 1.77778,
        width: { ideal: 1280 }
      };
      if (selectedDevice) {
        videoConstraints.deviceId = { exact: selectedDevice };
      }
      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
        audio: { noiseSuppression: true }
      };
      await this.callService.initializeStreams(this.remoteVideo(), constraints);
      const localStream = this.callService.getLocalStream();
      if (localStream) {
        this.myVideo().setVideo(localStream);
      }
    } catch (error) {
      console.error('Error initializing video stream:', error);
      // Retry without device-specific constraints as a fallback
      try {
        await this.callService.initializeStreams(this.remoteVideo(), {
          video: true,
          audio: true
        });
        const localStream = this.callService.getLocalStream();
        if (localStream) {
          this.myVideo().setVideo(localStream);
        }
      } catch (fallbackError) {
        console.error('Fallback video initialization also failed:', fallbackError);
      }
    }
  }
  private joinRoom() {
    this.roomSocketService.emit('room', { event: 'join', roomId: this.roomId });
    this.roomSocketService.on(
      'room',
      (data: { socketId?: string; event: string; roomId?: string }) => {
        if (
          data.event === 'join' &&
          data.socketId &&
          data.socketId !== this.socketService.socket.id
        ) {
          console.log(`Initiating call to peer: ${data.socketId}`);
          void this.startCall();
        }
      }
    );
  }
}
