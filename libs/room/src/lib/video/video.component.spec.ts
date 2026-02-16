import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoComponent } from './video.component';
import { MediaService, MediaServiceMock } from '@watch-together/shared';

describe('VideoComponent', () => {
  let component: VideoComponent;
  let fixture: ComponentFixture<VideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoComponent],
      providers: [{ provide: MediaService, useClass: MediaServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(VideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
