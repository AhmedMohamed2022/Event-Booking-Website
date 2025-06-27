import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  SupplierSubscription,
  SubscriptionStats,
  RenewSubscriptionRequest,
  RenewSubscriptionResponse,
} from '../models/subscription.model';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private readonly apiUrl = `${environment.apiUrl}/subscription`;

  constructor(private http: HttpClient) {}

  getCurrentSubscription(): Observable<SupplierSubscription> {
    return this.http.get<SupplierSubscription>(`${this.apiUrl}/current`);
  }

  getSubscriptionStats(): Observable<SubscriptionStats> {
    return this.http.get<SubscriptionStats>(`${this.apiUrl}/stats`);
  }

  renewSubscription(
    planType: 'basic' | 'premium' | 'enterprise'
  ): Observable<RenewSubscriptionResponse> {
    const request: RenewSubscriptionRequest = { planType };
    return this.http.post<RenewSubscriptionResponse>(
      `${this.apiUrl}/renew`,
      request
    );
  }

  toggleAutoRenew(): Observable<{ autoRenew: boolean }> {
    return this.http.patch<{ autoRenew: boolean }>(
      `${this.apiUrl}/auto-renew`,
      {}
    );
  }

  // New method to get available plans
  getAvailablePlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/plans`);
  }
}
