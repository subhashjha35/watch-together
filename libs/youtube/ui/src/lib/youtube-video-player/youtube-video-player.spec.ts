import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { YoutubeVideoPlayerComponent } from './youtube-video-player.js';

describe('YoutubeVideoPlayer', () => {
  let component: YoutubeVideoPlayerComponent;
  let fixture: ComponentFixture<YoutubeVideoPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoutubeVideoPlayerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(YoutubeVideoPlayerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
