/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { BookingFormService } from './booking-form.service';

describe('Service: BookingForm', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookingFormService]
    });
  });

  it('should ...', inject([BookingFormService], (service: BookingFormService) => {
    expect(service).toBeTruthy();
  }));
});
