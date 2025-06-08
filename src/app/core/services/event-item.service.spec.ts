/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { EventItemService } from './event-item.service';

describe('Service: EventItem', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventItemService]
    });
  });

  it('should ...', inject([EventItemService], (service: EventItemService) => {
    expect(service).toBeTruthy();
  }));
});
