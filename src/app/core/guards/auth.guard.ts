import { inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateFn,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects routes that require authentication
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting
  authService.setRedirectUrl(state.url);

  // Navigate to login with the return url
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });

  return false;
};

/**
 * Role Guard - Protects routes based on user roles
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/auth'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    const user = authService.getCurrentUser();
    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    // User doesn't have required role, redirect to appropriate page
    if (user?.role === 'supplier') {
      router.navigate(['/supplier/dashboard']);
    } else {
      router.navigate(['/']);
    }

    return false;
  };
};

/**
 * Supplier Guard - Shorthand for supplier-only routes
 */
export const supplierGuard: CanActivateFn = roleGuard(['supplier']);

/**
 * Admin Guard - Shorthand for admin-only routes
 */
export const adminGuard: CanActivateFn = roleGuard(['admin']);

/**
 * Guest Guard - Redirects authenticated users away from auth pages
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();

    // Redirect authenticated users based on their role
    if (user?.role === 'supplier') {
      router.navigate(['/supplier/dashboard']);
    } else {
      router.navigate(['/']);
    }

    return false;
  }

  return true;
};
