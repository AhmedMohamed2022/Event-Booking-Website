import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((c) => c.HomeComponent),
  },
  {
    path: 'search-results',
    loadComponent: () =>
      import('./features/search-result/search-result.component').then(
        (m) => m.SearchResultComponent
      ),
  },
  //   {
  //     path: 'service/:id',
  //     loadComponent: () =>
  //       import('./features/service-detail/service-detail.component').then(
  //         (m) => m.ServiceDetailComponent
  //       ),
  //   },
];
