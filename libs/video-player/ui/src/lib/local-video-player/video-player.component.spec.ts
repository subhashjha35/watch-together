import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { CallService, ENV_DATA, MediaService } from '@watch-together/shared';
import {
    CallServiceMock,
    MediaServiceMock,
    RTCPeerConnectionMock
} from '@watch-together/shared-testing';
import { VideoPlayerComponent } from './video-player.component';

describe('VideoPlayerComponent', () => {
    let component: VideoPlayerComponent;
    let fixture: ComponentFixture<VideoPlayerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VideoPlayerComponent],
            providers: [
                { provide: ENV_DATA, useValue: {} },
                { provide: CallService, useClass: CallServiceMock },
                { provide: MediaService, useClass: MediaServiceMock },
                { provide: 'RTCPeerConnection', useClass: RTCPeerConnectionMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(VideoPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
