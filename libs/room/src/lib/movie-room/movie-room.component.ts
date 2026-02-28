import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  viewChild
} from '@angular/core';
import { TextChatComponent } from '@watch-together/chat';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';
import {
  CallService,
  DraggableDirective,
  IRoom,
  MediaService,
  ResizableDirective,
  SocketService
} from '@watch-together/shared';
import { VideoComponent } from '../video';
import { RemoteVideoComponent } from '../remote-video';
import { YoutubeVideoPlayerComponent } from '@watch-together/youtube-ui';

@Component({
  selector: 'lib-movie-room',
  imports: [
    TextChatComponent,
    VideoComponent,
    RemoteVideoComponent,
    YoutubeVideoPlayerComponent,
    DraggableDirective,
    ResizableDirective
  ],
  templateUrl: './movie-room.component.html',
  styleUrl: './movie-room.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovieRoomComponent implements OnInit, AfterViewInit {
  readonly myVideo = viewChild.required<VideoComponent>('myVideo');
  protected readonly remoteStreams = computed(() => {
    const streams: ReadonlyMap<string, MediaStream> = this.callService.remoteStreams();
    return [...streams.entries()];
  });

  private readonly route = inject(ActivatedRoute);
  private readonly roomSocketService = inject(SocketService<IRoom>);
  private readonly callService = inject(CallService);
  private readonly mediaService = inject(MediaService);
  private roomId = '';

  public ngOnInit(): void {
    this.route.params.pipe(filter((params) => !!params)).subscribe((params) => {
      this.roomId = params['roomId'] ?? 'abc';
      this.callService.setRoomId(this.roomId);
    });
  }

  public ngAfterViewInit() {
    void this.callService.loadIceConfig().then(() => {
      void this.initializeVideoStreams().then(() => {
        this.joinRoom();
      });
    });
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
      await this.callService.initializeStreams(constraints);
      const localStream = this.callService.getLocalStream();
      if (localStream) {
        this.myVideo().setVideo(localStream);
      }
    } catch (error) {
      console.error('Error initializing video stream:', error);
      try {
        await this.callService.initializeStreams({
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
      (data: { socketId?: string; event: string; roomId?: string; peers?: string[] }) => {
        if (data.event === 'peers' && data.peers) {
          // As the new joiner, initiate calls to all existing peers
          for (const peerId of data.peers) {
            console.log(`Initiating call to existing peer: ${peerId}`);
            void this.callService.makeCall(peerId);
          }
        } else if (data.event === 'join' && data.socketId) {
          // A new peer joined — do NOT call them; they will call us
          // via the 'peers' list they receive from the server.
          console.log(`New peer joined: ${data.socketId} (waiting for their offer)`);
        } else if (data.event === 'leave' && data.socketId) {
          console.log(`Peer left: ${data.socketId}`);
          this.callService.removePeer(data.socketId);
        }
      }
    );
  }
}
