// src/app/core/services/admin.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminStats, JoinRequest } from '../models/admin.model';
import { environment } from '../../environments/environment';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private joinApiUrl = `${environment.apiUrl}/join`; // Base URL for join endpoints
  private apiUrl = environment.apiUrl; // Base URL for other admin endpoints
  constructor(private http: HttpClient) {}

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/admin/stats`);
  }

  getJoinRequests(status?: string): Observable<JoinRequest[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<JoinRequest[]>(`${this.joinApiUrl}/join-requests`, {
      params,
    });
  }

  approveJoinRequest(requestId: string): Observable<any> {
    return this.http.patch(`${this.joinApiUrl}/${requestId}/approve`, {}).pipe(
      tap((response) => {
        console.log('Supplier approved:', response);
      }),
      catchError((error) => {
        console.error('Error approving supplier:', error);
        throw error;
      })
    );
  }

  rejectJoinRequest(requestId: string): Observable<any> {
    return this.http.patch(`${this.joinApiUrl}/${requestId}/reject`, {});
  }

  markAsReviewed(requestId: string): Observable<any> {
    return this.http.patch(`${this.joinApiUrl}/${requestId}/review`, {});
  }

  getRecentActivity(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/activity`);
  }

  // Add any other admin-related API calls here
}
