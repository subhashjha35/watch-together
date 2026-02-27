import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RemoteVideoComponent } from './remote-video.component';

describe('RemoteVideo', () => {
  let component: RemoteVideoComponent;
  let fixture: ComponentFixture<RemoteVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemoteVideoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RemoteVideoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
