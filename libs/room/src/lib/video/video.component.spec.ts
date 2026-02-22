import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoComponent } from './video.component';
import { MediaService } from '@watch-together/shared';
import { MediaServiceMock } from '@watch-together/shared-testing';

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
