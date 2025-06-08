/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ServiceDetailsService } from './ServiceDetails.service';

describe('Service: ServiceDetails', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServiceDetailsService],
    });
  });

  it('should ...', inject(
    [ServiceDetailsService],
    (service: ServiceDetailsService) => {
      expect(service).toBeTruthy();
    }
  ));
});
