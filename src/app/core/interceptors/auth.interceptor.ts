// src/app/core/interceptors/auth.interceptor.ts

import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';

// Shared state for auth refresh logic
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  let authReq = req;
  if (token && isApiRequest(req.url)) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isApiRequest(req.url)) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Bad Request';
            break;
          case 401:
            errorMessage = 'Unauthorized - Please login again';
            break;
          case 403:
            errorMessage = 'Access Denied - Insufficient permissions';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 422:
            errorMessage = error.error?.message || 'Validation Error';
            break;
          case 500:
            errorMessage = 'Internal Server Error - Please try again later';
            break;
          case 503:
            errorMessage = 'Service Unavailable - Please try again later';
            break;
          default:
            errorMessage =
              error.error?.message || `Error Code: ${error.status}`;
        }
      }

      console.error('HTTP Error:', errorMessage, error);

      return throwError(() => ({
        ...error,
        userMessage: errorMessage,
      }));
    })
  );
};

// Loading state management
let activeRequests = 0;
const loadingSubject = new BehaviorSubject<boolean>(false);
export const loading$ = loadingSubject.asObservable();

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const skipLoading = req.headers.get('X-Skip-Loading') === 'true';

  if (!skipLoading) {
    activeRequests++;
    loadingSubject.next(true);
  }

  return next(req).pipe(
    catchError((error) => {
      if (!skipLoading) {
        decrementRequests();
      }
      return throwError(() => error);
    }),
    tap(() => {
      if (!skipLoading) {
        decrementRequests();
      }
    })
  );
};

// Helper functions
function isApiRequest(url: string): boolean {
  return url.includes('/api/') || url.startsWith('http://localhost:5000/api/');
}

function addTokenHeader(
  request: HttpRequest<any>,
  token: string
): HttpRequest<any> {
  return request.clone({
    headers: request.headers.set('Authorization', `Bearer ${token}`),
  });
}

function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    // Clear auth state and redirect to login
    authService.logout();

    // Store current URL for redirect after login
    const currentUrl = router.url;
    if (currentUrl && !currentUrl.includes('/auth')) {
      authService.setRedirectUrl(currentUrl);
    }

    isRefreshing = false;
    router.navigate(['/auth/login']);
  }

  return refreshTokenSubject.pipe(
    filter((token) => token !== null),
    take(1),
    switchMap(() => next(request))
  );
}

function decrementRequests(): void {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    loadingSubject.next(false);
  }
}
