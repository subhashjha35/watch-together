import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICON_REGISTRY, type IconName } from './icon-registry';

@Component({
  selector: 'shared-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      [innerHTML]="svgContent()"
    ></svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .icon {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
  `,
  host: {
    '[attr.aria-hidden]': '"true"'
  }
})
export class IconComponent {
  readonly name = input.required<IconName>();

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly svgContent = computed(() => {
    const raw = ICON_REGISTRY[this.name()] ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });
}
