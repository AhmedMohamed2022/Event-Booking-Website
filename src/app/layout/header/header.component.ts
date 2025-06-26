import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SideDrawerComponent } from '../../shared/components/side-drawer/side-drawer.component';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SideDrawerComponent,
    LanguageToggleComponent,
  ],
  template: `
    <header
      class="navbar navbar-expand-lg bg-white shadow-sm sticky-top"
      [class.side-drawer-open]="drawerOpen"
    >
      <div class="container">
        <!-- Brand -->
        <a class="navbar-brand fw-bold text-dark" routerLink="/">
          <span class="text-warning">✨</span>
          {{ getCurrentLanguage() === 'ar' ? 'حجز المناسبات' : 'EventBook' }}
        </a>

        <!-- Hamburger for mobile -->
        <button
          class="navbar-toggler d-lg-none"
          type="button"
          (click)="drawerOpen = true"
          aria-label="Open menu"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Desktop Nav -->
        <nav
          class="navbar-nav ms-auto d-none d-lg-flex align-items-center gap-3"
        >
          <ng-container *ngTemplateOutlet="navLinks"></ng-container>
          <app-language-toggle></app-language-toggle>
        </nav>
      </div>

      <!-- Side Drawer for mobile -->
      <app-side-drawer [open]="drawerOpen" (close)="drawerOpen = false">
        <div class="drawer-menu">
          <a class="navbar-brand fw-bold text-dark mb-4" routerLink="/">
            <span class="text-warning">✨</span>
            {{ getCurrentLanguage() === 'ar' ? 'حجز المناسبات' : 'EventBook' }}
          </a>
          <ng-container *ngTemplateOutlet="navLinks"></ng-container>
          <app-language-toggle></app-language-toggle>
        </div>
      </app-side-drawer>

      <!-- Shared nav links/user menu template -->
      <ng-template #navLinks>
        <ng-container *ngIf="!isAuthenticated">
          <button class="btn btn-warning rounded-pill px-4" routerLink="/login">
            <i class="fas fa-sign-in-alt me-2"></i
            >{{ getCurrentLanguage() === 'ar' ? 'تسجيل الدخول' : 'Sign In' }}
          </button>
        </ng-container>
        <div class="nav-item dropdown" *ngIf="isAuthenticated">
          <button
            class="btn btn-outline-primary dropdown-toggle rounded-pill px-4"
            data-bs-toggle="dropdown"
          >
            <i class="fas fa-user me-2"></i>{{ currentUser?.name }}
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow">
            <li>
              <a class="dropdown-item" [routerLink]="getDashboardLink()">
                <i class="fas fa-tachometer-alt me-2"></i
                >{{
                  getCurrentLanguage() === 'ar' ? 'لوحة التحكم' : 'Dashboard'
                }}
              </a>
            </li>
            <li>
              <hr class="dropdown-divider" />
            </li>
            <li>
              <button class="dropdown-item text-danger" (click)="logout()">
                <i class="fas fa-sign-out-alt me-2"></i
                >{{ getCurrentLanguage() === 'ar' ? 'تسجيل الخروج' : 'Logout' }}
              </button>
            </li>
          </ul>
        </div>
      </ng-template>
    </header>
  `,
  styles: [
    `
      .navbar {
        padding: 1rem 0;
        min-height: 64px;
      }
      .navbar-toggler {
        border: none;
        background: transparent;
        font-size: 2rem;
        color: #cba135;
        outline: none;
      }
      .navbar-toggler:focus {
        box-shadow: 0 0 0 0.2rem rgba(203, 161, 53, 0.25);
      }
      .navbar-toggler-icon {
        display: inline-block;
        width: 2rem;
        height: 2rem;
        background: url("data:image/svg+xml;utf8,<svg viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'><path stroke='%23cba135' stroke-width='2' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/></svg>")
          center/contain no-repeat;
      }
      .drawer-menu {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-top: 2rem;
      }
      @media (max-width: 991.98px) {
        .navbar-nav {
          display: none !important;
        }
        .side-drawer-open
          .container
          > :not(.navbar-brand):not(.navbar-toggler) {
          display: none !important;
        }
        .side-drawer-open .navbar-toggler {
          z-index: 1051;
        }
        .side-drawer-open {
          /* Optionally add a subtle blur or dim effect to header when drawer is open */
          /* filter: blur(2px); */
        }
      }
    `,
  ],
})
export class HeaderComponent {
  drawerOpen = false;
  isAuthenticated = false;
  currentUser: any = null;

  constructor(
    public languageService: LanguageService,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });
  }

  getCurrentLanguage(): string {
    return this.languageService.getCurrentLanguage();
  }

  getDashboardLink(): string {
    if (!this.currentUser) return '/';
    switch (this.currentUser.role) {
      case 'admin':
        return '/admin-dashboard';
      case 'supplier':
        return '/supplier-dashboard';
      default:
        return '/client-dashboard';
    }
  }

  logout() {
    this.authService.logout();
  }
}
