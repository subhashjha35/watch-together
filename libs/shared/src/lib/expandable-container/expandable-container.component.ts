import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'shared-expandable-container',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './expandable-container.component.html',
  styleUrl: './expandable-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpandableContainerComponent {
  @Input()
  public title: string | null = null;
  public readonly isOpen = signal(false);

  toggleSlideUpDown(): void {
    this.isOpen.update((value) => !value);
  }
}
