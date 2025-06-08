import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JoinRequest, JoinResponse, JoinStatus } from '../models/join.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class JoinService {
  private apiUrl = `${environment.apiUrl}/join`;

  constructor(private http: HttpClient) {}

  submitJoinRequest(request: JoinRequest): Observable<JoinResponse> {
    return this.http.post<JoinResponse>(this.apiUrl, request);
  }

  checkStatus(phone: string): Observable<JoinStatus> {
    return this.http.get<JoinStatus>(`${this.apiUrl}/status`, {
      params: { phone },
    });
  }
}
