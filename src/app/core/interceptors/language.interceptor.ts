import {
  HttpInterceptorFn,
  HttpHandlerFn,
  HttpRequest,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';

export const languageInterceptorFn: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const currentLang = localStorage.getItem('language') || 'en';

  const clonedRequest = req.clone({
    setHeaders: {
      'Accept-Language': currentLang,
    },
  });

  return next(clonedRequest);
};
