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
import { IVideo, SocketService } from '@watch-together/utils';


@Component({
  selector: 'lib-video-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoPlayerComponent implements OnInit, AfterViewInit {
  readonly videoPlayer = viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');

  public selectedFile: string | undefined = undefined;

  private socketService = inject(SocketService<IVideo>);
  private isSyncing = false; // Flag to prevent looping
  private forwardTime = 5; // Time to fast forward in seconds
  private rewindTime = 5; // Time to rewind in seconds

  ngOnInit(): void {
    // Listen for play, pause, and seek events from server and synchronize
    this.socketService.on('video', (data: IVideo['dataType']) => {
      // console.warn('video', data);

      // Avoid infinite loop by setting the isSyncing flag
      this.isSyncing = true;

      this.performVideoActionOnEvent(data.event, data.time);
    });

    this.videoPlayer().nativeElement.addEventListener('keydown', (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.key === 'ArrowRight') {
        this.forward();
      } else if (event.key === 'ArrowLeft') {
        this.rewind();
      }
    });
  }

  performVideoActionOnEvent(event: IVideo['dataType']['event'], time: IVideo['dataType']['time']) {
    console.warn('performVideoActionOnEvent', event, time);
    const video = this.videoPlayer().nativeElement;

    if (!this.isSyncing) {
      console.error('emit true');
      this.socketService.emit('video', { event, time });
    } else {
      switch (event) {
        case 'play':
          video.currentTime = time; // Ensure the time is in sync before playing
          video.play().catch(e => console.error('Error playing video:', e));
          break;
        case 'seek':
          video.currentTime = time; // This will be handled by `seeked`
          break;
        case 'pause':
          video.pause();
          break;
        case 'videoLoaded':
          video.width = 800;
          console.warn('Video loaded');
          break;
      }
    }
  }

  forward() {
    const video = this.videoPlayer().nativeElement;
    video.currentTime += this.forwardTime; // Move forward by the defined time
    this.performVideoActionOnEvent('seek', video.currentTime);
  }

  rewind() {
    const video = this.videoPlayer().nativeElement;
    video.currentTime -= this.rewindTime; // Move backward by the defined time
    this.performVideoActionOnEvent('seek', video.currentTime);
  }


  // Handle file selection and video loading
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedFile = file?.name;
    if (file) {
      this.videoPlayer().nativeElement.src = URL.createObjectURL(file);
      this.performVideoActionOnEvent('videoLoaded', 0);
      console.log('video loaded');
    }
  }

  // Bind event listeners after video is loaded
  ngAfterViewInit(): void {
    const video = this.videoPlayer().nativeElement;

    video.addEventListener('play', () => {
      if (!this.isSyncing) {
        this.performVideoActionOnEvent('play', video.currentTime);
      }
    });

    video.addEventListener('pause', () => {
      if (!this.isSyncing) {
        this.performVideoActionOnEvent('pause', video.currentTime);
      }
    });

    // Use `seeking` instead of `seek` to detect when seeking starts
    video.addEventListener('seeking', () => {
      console.warn('Seeking started at:', video.currentTime);
      if (!this.isSyncing) {
        this.performVideoActionOnEvent('seek', video.currentTime);
      }
    });

    // Handle the `seeked` event
    video.addEventListener('seeked', () => {
      console.warn('Seek completed at:', video.currentTime);
      if (this.isSyncing) {
        this.isSyncing = false; // Reset flag when seek is done
      }
    });

    // Reset isSyncing once the video reaches a synced state
    video.addEventListener('playing', () => {
      if (this.isSyncing) {
        this.isSyncing = false; // Reset flag when playback starts
      }
    });
  }
}
