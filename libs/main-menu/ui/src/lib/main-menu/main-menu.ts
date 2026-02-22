import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { mainRoutes } from '@watch-together/main-menu-common';

@Component({
  selector: 'lib-main-menu',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './main-menu.html',
  styleUrl: './main-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainMenuComponent {
  isCollapsed = signal(true);
  public mainRoutes = mainRoutes;
  toggleNavbar(): void {
    this.isCollapsed.update((collapsed) => !collapsed);
  }
}
