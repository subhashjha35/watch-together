import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ENV_DATA } from '@watch-together/utils';


fetch('/config').then((env) => env.json()).then((env) => {
  bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
      ...appConfig.providers,
      {
        provide: ENV_DATA,
        useValue: {
          IP: env.IP ? `https://${env.IP}` : 'https://localhost',
          BACKEND_PORT: env.BACKEND_PORT || 3000,
          FRONTEND_PORT: env.FRONTEND_PORT || 4200
        }
      }
    ]
  }).catch((err) =>
    console.error(err)
  );
});
