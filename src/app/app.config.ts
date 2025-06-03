// src/app/app.config.ts

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
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

// Import your routes
import { routes } from './app.routes';

// Import interceptors
import {
  authInterceptor,
  errorInterceptor,
  loadingInterceptor,
} from './core/interceptors/auth.interceptor';
import { Observable } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router configuration
    provideRouter(routes, withEnabledBlockingInitialNavigation()),

    // HTTP Client with interceptors
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])
    ),

    // Animations
    provideAnimations(),

    // Forms
    importProvidersFrom(FormsModule, ReactiveFormsModule),
  ],
};
