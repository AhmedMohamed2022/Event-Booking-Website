import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ContactRequest } from '../models/contact.model';
import { environment } from '../../environments/environment';

export interface ContactChatAccess {
  canChat: boolean;
  contactRequestId?: string;
  supplierId?: string;
  supplierName?: string;
  serviceName?: string;
  reason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactChatService {
  private apiUrl = `${environment.apiUrl}/contact-request`;
  private chatAccessSubject = new BehaviorSubject<ContactChatAccess>({
    canChat: false,
  });

  constructor(private http: HttpClient) {}

  /**
   * Check if user can chat with a specific supplier based on contact requests
   */
  checkChatAccess(supplierId: string): Observable<ContactChatAccess> {
    return this.http
      .get<ContactRequest[]>(`${this.apiUrl}/client-requests`)
      .pipe(
        map((requests) => {
          // Find approved contact request for this supplier
          const approvedRequest = requests.find((req) => {
            const reqSupplierId =
              typeof req.supplier === 'string'
                ? req.supplier
                : (req.supplier as any)._id;
            return reqSupplierId === supplierId && req.status === 'accepted';
          });

          if (approvedRequest) {
            const access: ContactChatAccess = {
              canChat: true,
              contactRequestId: approvedRequest._id,
              supplierId: supplierId,
              supplierName:
                typeof approvedRequest.supplier === 'string'
                  ? 'Unknown Supplier'
                  : (approvedRequest.supplier as any).name,
              serviceName:
                typeof approvedRequest.service === 'string'
                  ? 'Unknown Service'
                  : (approvedRequest.service as any).name,
            };
            this.chatAccessSubject.next(access);
            return access;
          } else {
            // Check if there's a pending request
            const pendingRequest = requests.find((req) => {
              const reqSupplierId =
                typeof req.supplier === 'string'
                  ? req.supplier
                  : (req.supplier as any)._id;
              return reqSupplierId === supplierId && req.status === 'pending';
            });

            const access: ContactChatAccess = {
              canChat: false,
              reason: pendingRequest
                ? 'Contact request is pending approval'
                : 'No approved contact request found',
            };
            this.chatAccessSubject.next(access);
            return access;
          }
        })
      );
  }

  /**
   * Get current chat access status
   */
  getChatAccess(): Observable<ContactChatAccess> {
    return this.chatAccessSubject.asObservable();
  }

  /**
   * Refresh chat access for a specific supplier
   */
  refreshChatAccess(supplierId: string): Observable<ContactChatAccess> {
    return this.checkChatAccess(supplierId);
  }

  /**
   * Check if user has any approved contact requests
   */
  hasApprovedRequests(): Observable<boolean> {
    return this.http
      .get<ContactRequest[]>(`${this.apiUrl}/client-requests`)
      .pipe(
        map((requests) => requests.some((req) => req.status === 'accepted'))
      );
  }

  /**
   * Get all approved contact requests for chat access
   */
  getApprovedRequests(): Observable<ContactRequest[]> {
    return this.http
      .get<ContactRequest[]>(`${this.apiUrl}/client-requests`)
      .pipe(
        map((requests) => requests.filter((req) => req.status === 'accepted'))
      );
  }

  /**
   * Get pending contact requests
   */
  getPendingRequests(): Observable<ContactRequest[]> {
    return this.http
      .get<ContactRequest[]>(`${this.apiUrl}/client-requests`)
      .pipe(
        map((requests) => requests.filter((req) => req.status === 'pending'))
      );
  }
}
