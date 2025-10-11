import { Route } from '@angular/router';
import { AppComponent } from './app.component';
import { MovieRoomComponent } from '@watch-together/movie-room';
import { HomeComponent } from '@watch-together/home';

export const appRoutes: Route[] = [
  {
    path: '',
    component: AppComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'room/:roomId', component: MovieRoomComponent },
      { path: '*', redirectTo: '' },
      { path: '**', redirectTo: '' }
    ]
  }
];
