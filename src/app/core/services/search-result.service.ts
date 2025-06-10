import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  searchEvents(params: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/event-items/search`, { params });
  }
}
