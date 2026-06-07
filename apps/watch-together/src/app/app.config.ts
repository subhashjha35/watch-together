import {
    type ApplicationConfig,
    importProvidersFrom,
    provideZoneChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideHttpClient(withXhr()),
        provideRouter(appRoutes),
        // provide Material dialog + animations providers for standalone bootstrap
        importProvidersFrom(MatDialogModule)
    ]
};
