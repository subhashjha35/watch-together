import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovieRoomComponent } from './movie-room.component';
import { ActivatedRoute } from '@angular/router';
import {
  CallService,
  CallServiceMock,
  ENV_DATA,
  MediaService,
  MediaServiceMock,
  RTCPeerConnectionMock
} from '@watch-together/shared';

describe('MovieRoomComponent', () => {
  let component: MovieRoomComponent;
  let fixture: ComponentFixture<MovieRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieRoomComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { params: { pipe: () => ({ subscribe: jest.fn() }) } },
        },
        { provide: ENV_DATA, useValue: {} },
        { provide: CallService, useClass: CallServiceMock },
        { provide: MediaService, useClass: MediaServiceMock },
        { provide: 'RTCPeerConnection', useClass: RTCPeerConnectionMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
