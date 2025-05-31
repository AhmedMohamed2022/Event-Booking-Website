import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  searchEvents(params: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/event-items/search`, { params });
  }
}
