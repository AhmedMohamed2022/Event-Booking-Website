import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((c) => c.HomeComponent),
  },
  {
    path: 'login',
    component: AuthComponent,
    title: 'Login | Event Booking Platform',
  },
  {
    path: 'register',
    component: AuthComponent,
    title: 'Register | Event Booking Platform',
  },
  {
    path: 'search-results',
    loadComponent: () =>
      import('./features/search-result/search-result.component').then(
        (m) => m.SearchResultComponent
      ),
  },
  {
    path: 'service/:id',
    loadComponent: () =>
      import('./features/search-details/service-details.component').then(
        (m) => m.ServiceDetailComponent
      ),
  },
  {
    path: 'booking/:id',
    loadComponent: () =>
      import('./features/booking-form/booking-form.component').then(
        (m) => m.BookingFormComponent
      ),
  },
];
