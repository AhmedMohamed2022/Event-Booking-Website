import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupplierDashboardData } from '../models/supplier-dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class SupplierDashboardService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getSupplierDashboard(): Observable<SupplierDashboardData> {
    return this.http.get<SupplierDashboardData>(
      `${this.apiUrl}/supplier/dashboard`,
      { headers: this.getAuthHeaders() }
    );
  }

  getSupplierBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings/supplier-bookings`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'cancelled'
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/bookings/${bookingId}/status`,
      { status },
      { headers: this.getAuthHeaders() }
    );
  }
}
