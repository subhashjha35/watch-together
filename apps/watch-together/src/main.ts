import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ENV_DATA } from '@watch-together/shared';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    {
      provide: ENV_DATA,
      useValue: {
        HOST: environment.apiUrl
      }
    }
  ]
}).catch((err) => console.error(err));
