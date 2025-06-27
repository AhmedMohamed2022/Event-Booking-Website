import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { LOCALE_ID } from '@angular/core';

// NgX-Translate imports
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { authInterceptorFn } from './core/interceptors/auth.interceptor';
import { languageInterceptorFn } from './core/interceptors/language.interceptor';
import { rateLimitInterceptorFn } from './core/interceptors/rate-limit.interceptor';

registerLocaleData(localeAr);

// Translation loader factory
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(
      withInterceptors([
        authInterceptorFn,
        languageInterceptorFn,
        // rateLimitInterceptorFn, // Temporarily disabled - causing translation issues
      ])
    ),
    provideAnimations(),
    importProvidersFrom(FormsModule, ReactiveFormsModule),

    // NgX-Translate providers
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
        defaultLanguage: 'en',
      })
    ),

    {
      provide: LOCALE_ID,
      useFactory: () => localStorage.getItem('language') || 'en',
    },
  ],
};
