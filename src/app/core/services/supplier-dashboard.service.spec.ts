/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SupplierDashboardService } from './supplier-dashboard.service';

describe('Service: SupplierDashboard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupplierDashboardService]
    });
  });

  it('should ...', inject([SupplierDashboardService], (service: SupplierDashboardService) => {
    expect(service).toBeTruthy();
  }));
});
