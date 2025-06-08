import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  sendApprovalNotification(phone: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications/send-approval`, {
      phone,
    });
  }
}
