import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RateLimiterService } from '../services/rate-limiter.service';

export const rateLimitInterceptorFn: HttpInterceptorFn = (request, next) => {
  const rateLimiter = inject(RateLimiterService);

  // Skip rate limiting for static assets and translation files
  if (shouldSkipRateLimit(request.url)) {
    return next(request);
  }

  const endpoint = getEndpointKey(request.url);

  // Check if we can make this call
  if (!rateLimiter.canMakeCall(endpoint)) {
    const status = rateLimiter.getRateLimitStatus();
    console.warn('Rate limit blocked request to:', endpoint, status);

    return throwError(
      () =>
        new HttpErrorResponse({
          status: 429,
          statusText: 'Too Many Requests',
          error: {
            message:
              'Rate limit exceeded. Please wait before making more requests.',
          },
        })
    );
  }

  // Record the call
  rateLimiter.recordCall(endpoint);

  // Make the request
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // If it's a 429 error, record it in our rate limiter
      if (error.status === 429) {
        rateLimiter.recordFailedCall(endpoint);
        console.warn('Server returned 429 for endpoint:', endpoint);
      }

      return throwError(() => error);
    })
  );
};

function shouldSkipRateLimit(url: string): boolean {
  // Skip rate limiting for static assets and translation files
  const skipPatterns = [
    '/assets/i18n/', // Translation files
    '/assets/', // All assets
    '.json', // JSON files
    '.css', // CSS files
    '.js', // JavaScript files
    '.ico', // Favicon
    '.png', // Images
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    'favicon.ico', // Favicon
    'manifest.json', // Web app manifest
    'ngsw-worker.js', // Service worker
  ];

  return skipPatterns.some((pattern) => url.includes(pattern));
}

function getEndpointKey(url: string): string {
  try {
    // Handle relative URLs properly
    if (url.startsWith('/')) {
      return url; // Return the path directly for relative URLs
    }

    // For absolute URLs, extract the pathname
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch (error) {
    // If URL parsing fails, return the original URL
    console.warn('Failed to parse URL for rate limiting:', url, error);
    return url;
  }
}
