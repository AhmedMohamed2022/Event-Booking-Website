// src/app/core/services/admin.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AdminStats, JoinRequest } from '../models/admin.model';
import { environment } from '../../environments/environment';
import { ContactMessage, ContactResponse } from '../models/contact.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly baseUrl = environment.apiUrl;
  private readonly adminUrl = `${this.baseUrl}/admin`;
  private readonly joinUrl = `${this.baseUrl}/join`;
  private readonly contactUrl = `${this.baseUrl}/contact`;

  constructor(private http: HttpClient) {}

  // Admin Stats
  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.adminUrl}/stats`);
  }

  // Join Requests
  getJoinRequests(status?: string): Observable<JoinRequest[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<JoinRequest[]>(`${this.joinUrl}/join-requests`, {
      params,
    });
  }

  approveJoinRequest(requestId: string): Observable<any> {
    return this.http.patch(`${this.joinUrl}/${requestId}/approve`, {});
  }

  rejectJoinRequest(requestId: string): Observable<any> {
    return this.http.patch(`${this.joinUrl}/${requestId}/reject`, {});
  }

  markAsReviewed(requestId: string): Observable<any> {
    return this.http.patch(`${this.joinUrl}/${requestId}/review`, {});
  }

  // getRecentActivity(): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.apiUrl}/activity`);
  // }

  // Add any other admin-related API calls here
  // Add to AdminService
  // Contact Messages
  getContactMessages(): Observable<any> {
    return this.http.get<any>(`${this.contactUrl}`).pipe(
      map((response) => {
        // Ensure we're returning an array even if the backend returns an object
        return {
          messages: Array.isArray(response.messages) ? response.messages : [],
          success: response.success,
        };
      }),
      catchError((error) => {
        console.error('Error fetching contact messages:', error);
        return of({ messages: [], success: false });
      })
    );
  }

  markContactMessageAsRead(messageId: string): Observable<ContactResponse> {
    return this.http.patch<ContactResponse>(
      `${this.contactUrl}/${messageId}/read`,
      {}
    );
  }

  // Supplier Management
  unlockSupplier(supplierId: string): Observable<any> {
    return this.http.patch(
      `${this.adminUrl}/unlock-supplier/${supplierId}`,
      {}
    );
  }
}
