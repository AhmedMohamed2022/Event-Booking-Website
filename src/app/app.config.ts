// src/app/app.config.ts

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
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { LOCALE_ID } from '@angular/core';

// Import your routes
import { routes } from './app.routes';

// Import interceptors

import { Observable } from 'rxjs';
import { authInterceptorFn } from './core/interceptors/auth.interceptor';
import { languageInterceptorFn } from './core/interceptors/language.interceptor';

registerLocaleData(localeAr);

export const appConfig: ApplicationConfig = {
  providers: [
    // Router configuration
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideZoneChangeDetection({ eventCoalescing: true }),

    // HTTP Client with interceptors
    provideHttpClient(
      withInterceptors([authInterceptorFn, languageInterceptorFn])
    ),

    // Animations
    provideAnimations(),

    // Forms
    importProvidersFrom(FormsModule, ReactiveFormsModule),
    {
      provide: LOCALE_ID,
      useValue: localStorage.getItem('language') || 'en',
    },
  ],
};
