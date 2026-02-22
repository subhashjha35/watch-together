import type { Route } from '@angular/router';
import { MovieRoomComponent } from '@watch-together/movie-room';
import { HomeComponent } from '@watch-together/home';
import { mainRoutes } from '@watch-together/main-menu-common';

export const appRoutes: Route[] = [
  { path: '', component: HomeComponent },
  { path: mainRoutes.home.path, component: HomeComponent },
  { path: `${mainRoutes.room.path}/:roomId`, component: MovieRoomComponent },
  { path: '**', redirectTo: '' }
];
