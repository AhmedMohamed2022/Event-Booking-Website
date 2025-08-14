import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NotificationService,
  Notification,
} from '../../../core/services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container" *ngIf="notifications.length > 0">
      <div
        *ngFor="let notification of notifications"
        [ngClass]="['notification-toast', 'notification-' + notification.type]"
      >
        <div class="notification-icon">
          <i [class]="getIconClass(notification.type)"></i>
        </div>

        <div class="notification-content">
          <h6 class="notification-title">{{ notification.title }}</h6>
          <p class="notification-message">{{ notification.message }}</p>
        </div>

        <div class="notification-actions">
          <button
            *ngIf="notification.action"
            class="btn btn-sm btn-outline-primary"
            (click)="notification.action && notification.action.callback()"
          >
            {{ notification.action.label }}
          </button>

          <button
            class="btn btn-sm btn-outline-secondary ms-2"
            (click)="removeNotification(notification.id)"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./notification-toast.component.css'],
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notifications = notifications;
        console.log('Notifications updated:', notifications); // Debug log
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeNotification(id: string) {
    this.notificationService.remove(id);
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-bell';
    }
  }
}
