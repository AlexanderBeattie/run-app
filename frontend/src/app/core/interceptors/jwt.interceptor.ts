import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);

  // Skip auth endpoints to avoid circular refresh loops
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const attachToken = (r: HttpRequest<unknown>) => {
    const token = auth.getToken();
    if (!token) return r;
    return r.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  };

  // Proactively refresh if token is near expiry
  if (auth.isLoggedIn() && auth.isTokenExpired()) {
    return auth.refresh().pipe(
      switchMap(() => next(attachToken(req))),
      catchError(() => {
        auth.logout();
        return throwError(() => new Error('Session expired'));
      })
    );
  }

  return next(attachToken(req));
};
