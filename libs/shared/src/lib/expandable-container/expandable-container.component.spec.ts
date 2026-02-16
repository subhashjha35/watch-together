import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpandableContainerComponent } from '.';

describe('ExpandableContainerComponent', () => {
  let component: ExpandableContainerComponent;
  let fixture: ComponentFixture<ExpandableContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandableContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpandableContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
