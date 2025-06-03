import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventItem } from '../models/event-item.model';

@Injectable({
  providedIn: 'root',
})
export class ServiceDetailService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  /**
   * Get service details by ID
   * Uses the backend endpoint: GET /api/event-items/:id
   */
  getServiceById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/event-items/${id}`);
  }

  /**
   * Get related services based on category and price range
   * Uses the backend endpoint: GET /api/event-items/search
   */
  getRelatedServices(params: any): Observable<EventItem[]> {
    return this.http.get<EventItem[]>(`${this.baseUrl}/event-items/search`, {
      params,
    });
  }
}
