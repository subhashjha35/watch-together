import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { EmbeddedVideoPlayerComponent } from './embedded-video-player.js';

describe('EmbeddedVideoPlayerComponent', () => {
  let component: EmbeddedVideoPlayerComponent;
  let fixture: ComponentFixture<EmbeddedVideoPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmbeddedVideoPlayerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmbeddedVideoPlayerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
