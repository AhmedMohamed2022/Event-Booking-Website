// src/app/core/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuth(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map((authState) => {
        if (authState.isAuthenticated) {
          return true;
        }

        // Store the attempted URL for redirecting after login
        this.authService.setRedirectUrl(url);

        // Navigate to login
        this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: url },
        });

        return false;
      })
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class NoAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map((authState) => {
        if (!authState.isAuthenticated) {
          return true;
        }

        // User is already logged in, redirect to dashboard or home
        if (this.authService.isSupplier()) {
          this.router.navigate(['/supplier-dashboard']);
        } else {
          this.router.navigate(['/']);
        }

        return false;
      })
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[];

    return this.authService.authState$.pipe(
      take(1),
      map((authState) => {
        if (!authState.isAuthenticated) {
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url },
          });
          return false;
        }

        const userRole = authState.user?.role;
        if (!userRole || !requiredRoles.includes(userRole)) {
          // User doesn't have required role
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}
