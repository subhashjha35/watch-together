import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { BehaviorSubject } from 'rxjs';


export const slideUpDown = trigger('slideUpDown', [
  state('open', style({
    height: '*',
    opacity: 1,
    overflow: 'hidden'
  })),
  state('closed', style({
    height: '0px',
    opacity: 0,
    overflow: 'hidden'
  })),
  transition('open <=> closed', [
    animate('300ms ease-in-out')
  ])
]);

@Component({
  selector: 'lib-expandable-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expandable-container.component.html',
  styleUrl: './expandable-container.component.scss',
  animations: [slideUpDown],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpandableContainerComponent {
  @Input()
  public title: string | null = null;
  public isOpen$ = new BehaviorSubject<boolean>(false);

  toggleSlideUpDown(): void {
    this.isOpen$.next(!this.isOpen$.value);
  }
}
