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
import { CallService, type IVideo, SocketService } from '@watch-together/shared';

@Component({
    selector: 'lib-video-player',
    imports: [CommonModule],
    templateUrl: './video-player.component.html',
    styleUrl: './video-player.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoPlayerComponent implements OnInit, AfterViewInit {
    readonly videoPlayer = viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');

    public selectedFile: string | undefined = undefined;
    private readonly callService = inject(CallService);
    private readonly socketService = inject(SocketService<IVideo>);
    private isSyncing = false;
    private readonly forwardTime = 5;
    private readonly rewindTime = 5;

    ngOnInit(): void {
        this.socketService.on('video', (data: IVideo['dataType']) => {
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

    performVideoActionOnEvent(
        event: IVideo['dataType']['event'],
        time: IVideo['dataType']['time']
    ) {
        const video = this.videoPlayer().nativeElement;

        if (!this.isSyncing) {
            this.socketService.emit('video', {
                event,
                time,
                roomId: this.callService.getRoomId()
            });
        } else {
            switch (event) {
                case 'play':
                    video.currentTime = time;
                    void video
                        .play()
                        .catch((error) => console.error('Error playing video:', error));
                    break;
                case 'seek':
                    video.currentTime = time;
                    break;
                case 'pause':
                    video.pause();
                    break;
                case 'videoLoaded':
                    video.width = 800;
                    break;
            }
        }
    }

    forward() {
        const video = this.videoPlayer().nativeElement;
        video.currentTime += this.forwardTime;
        this.performVideoActionOnEvent('seek', video.currentTime);
    }

    rewind() {
        const video = this.videoPlayer().nativeElement;
        video.currentTime -= this.rewindTime;
        this.performVideoActionOnEvent('seek', video.currentTime);
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        this.selectedFile = file?.name;
        if (file) {
            this.videoPlayer().nativeElement.src = URL.createObjectURL(file);
            this.performVideoActionOnEvent('videoLoaded', 0);
        }
    }

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

        video.addEventListener('seeking', () => {
            if (!this.isSyncing) {
                this.performVideoActionOnEvent('seek', video.currentTime);
            }
        });

        video.addEventListener('seeked', () => {
            if (this.isSyncing) {
                this.isSyncing = false;
            }
        });

        video.addEventListener('playing', () => {
            if (this.isSyncing) {
                this.isSyncing = false;
            }
        });
    }
}
