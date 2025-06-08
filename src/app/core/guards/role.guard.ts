import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: any): boolean {
    const requiredRole = route.data['role'];

    if (!this.authService.canAccessDashboard(requiredRole)) {
      this.router.navigate(['/auth']);
      return false;
    }

    return true;
  }
}
