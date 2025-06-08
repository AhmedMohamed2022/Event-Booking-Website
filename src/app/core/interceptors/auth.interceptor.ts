import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Get the auth token from the service
    const authToken = this.authService.getToken();

    // Clone the request and add the authorization header if token exists
    let authRequest = request;
    if (authToken && this.shouldAddToken(request.url)) {
      authRequest = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${authToken}`),
      });
    }

    // Handle the request and catch any errors
    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401) {
          // Token might be expired or invalid
          this.authService.logout();
          return throwError(
            () => new Error('Your session has expired. Please log in again.')
          );
        }

        // Handle 403 Forbidden errors
        if (error.status === 403) {
          return throwError(
            () =>
              new Error('You do not have permission to perform this action.')
          );
        }

        // Pass through other errors
        return throwError(() => error);
      })
    );
  }

  /**
   * Determine if we should add the auth token to the request
   * Skip auth token for public endpoints like login/register
   */
  private shouldAddToken(url: string): boolean {
    // Don't add token to auth endpoints
    const publicEndpoints = ['/api/auth/send-otp', '/api/auth/verify-otp'];

    return !publicEndpoints.some((endpoint) => url.includes(endpoint));
  }
}

/**
 * Functional interceptor for Angular 19 (alternative approach)
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Get the auth token from the service
  const authToken = authService.getToken();

  // Clone the request and add the authorization header if token exists
  let authRequest = req;
  if (authToken && shouldAddTokenFn(req.url)) {
    authRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`),
    });
  }

  // Handle the request and catch any errors
  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        // Token might be expired or invalid
        authService.logout();
        return throwError(
          () => new Error('Your session has expired. Please log in again.')
        );
      }

      // Handle 403 Forbidden errors
      if (error.status === 403) {
        return throwError(
          () => new Error('You do not have permission to perform this action.')
        );
      }

      // Pass through other errors
      return throwError(() => error);
    })
  );
};

/**
 * Helper function to determine if we should add the auth token
 */
function shouldAddTokenFn(url: string): boolean {
  // Don't add token to auth endpoints
  const publicEndpoints = ['/api/auth/send-otp', '/api/auth/verify-otp'];

  return !publicEndpoints.some((endpoint) => url.includes(endpoint));
}
