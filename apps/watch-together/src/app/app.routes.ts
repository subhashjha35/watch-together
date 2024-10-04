import { Route } from '@angular/router';
import { AppComponent } from './app.component';
import { MovieRoomComponent } from '@watch-together/movie-room';

export const appRoutes: Route[] = [
  {
    path: '',
    component: AppComponent,
    children: [
      { path: 'room/:roomId', component: MovieRoomComponent }
    ]
  }
];
