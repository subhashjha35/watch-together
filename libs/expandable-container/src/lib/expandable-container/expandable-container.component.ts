import { ChangeDetectionStrategy, Component, inject, Input, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';


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
  public isOpen = false;
  private renderer = inject(Renderer2);

  // Update the toggle function to make sure it only toggles when clicked properly.
  toggleSlideUpDown(event: MouseEvent): void {
    // Check if the event originated from the intended button or the header.
    const targetElement = event.target as HTMLElement;

    if (
      targetElement.classList.contains('toggle-expansion') ||
      targetElement.classList.contains('header')
    ) {
      this.isOpen = !this.isOpen;
    }
  }
}
