import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaConfigurationComponent } from './media-configuration.component';

describe('MediaConfigurationComponent', () => {
  let component: MediaConfigurationComponent;
  let fixture: ComponentFixture<MediaConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaConfigurationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
