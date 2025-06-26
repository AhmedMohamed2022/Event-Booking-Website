import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SideDrawerComponent } from '../side-drawer/side-drawer.component';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';

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
    <header class="navbar navbar-expand-lg bg-white shadow-sm sticky-top">
      <div class="container">
        <!-- Brand -->
        <a class="navbar-brand fw-bold text-dark" routerLink="/">
          <span class="text-warning">✨</span> EventBook
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
          <ng-content></ng-content>
        </nav>
      </div>

      <!-- Side Drawer for mobile -->
      <app-side-drawer [open]="drawerOpen" (close)="drawerOpen = false">
        <div class="drawer-menu">
          <a class="navbar-brand fw-bold text-dark mb-4" routerLink="/">
            <span class="text-warning">✨</span> EventBook
          </a>
          <ng-content></ng-content>
        </div>
      </app-side-drawer>
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
      }
    `,
  ],
})
export class HeaderComponent {
  drawerOpen = false;
}
