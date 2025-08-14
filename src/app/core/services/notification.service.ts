import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  actionLabel?: string;
  action?: () => void;
  duration?: number;
  show?: boolean;
}

// Legacy Notification interface used by NotificationToastComponent
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  // New toasts API (kept for forward-compat and any new usages)
  private toastsSubject = new BehaviorSubject<NotificationToast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  // Legacy notifications API (used by NotificationToastComponent and existing calls)
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  // Unread message tracking
  private unreadMessagesSubject = new BehaviorSubject<{
    [key: string]: number;
  }>({});
  public unreadMessages$ = this.unreadMessagesSubject.asObservable();

  constructor() {
    this.loadUnreadMessagesFromStorage();
  }

  // Toast notification methods (new API)
  show(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration: number = 5000
  ) {
    const toast: NotificationToast = {
      id: this.generateId(),
      type,
      title,
      message,
      duration,
      show: true,
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(toast.id), duration);
    }

    // Also mirror into legacy notifications for compatibility
    this.showLegacy({ id: toast.id, type, title, message, duration });
  }

  showWithAction(
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    actionLabel: string,
    action: () => void,
    duration: number = 8000
  ) {
    const toast: NotificationToast = {
      id: this.generateId(),
      type,
      title,
      message,
      actionLabel,
      action,
      duration,
      show: true,
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(toast.id), duration);
    }

    // Also mirror into legacy notifications for compatibility
    this.showLegacy({
      id: toast.id,
      type,
      title,
      message,
      duration,
      action: { label: actionLabel, callback: action },
    });
  }

  remove(id: string) {
    // Remove from new toasts
    const currentToasts = this.toastsSubject.value;
    const updatedToasts = currentToasts.filter((toast) => toast.id !== id);
    this.toastsSubject.next(updatedToasts);

    // Remove from legacy notifications
    const currentLegacy = this.notificationsSubject.value;
    const updatedLegacy = currentLegacy.filter((n) => n.id !== id);
    this.notificationsSubject.next(updatedLegacy);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Legacy helpers (backward compatibility)
  success(title: string, message: string, duration: number = 5000): string {
    return this.showLegacy({
      id: this.generateId(),
      type: 'success',
      title,
      message,
      duration,
    });
  }

  error(title: string, message: string, duration: number = 8000): string {
    return this.showLegacy({
      id: this.generateId(),
      type: 'error',
      title,
      message,
      duration,
    });
  }

  warning(title: string, message: string, duration: number = 6000): string {
    return this.showLegacy({
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      duration,
    });
  }

  info(title: string, message: string, duration: number = 5000): string {
    return this.showLegacy({
      id: this.generateId(),
      type: 'info',
      title,
      message,
      duration,
    });
  }

  private showLegacy(notification: Notification): string {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([...current, notification]);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => this.remove(notification.id), notification.duration);
    }

    return notification.id;
  }

  // Unread message tracking methods
  setUnreadCount(key: string, count: number) {
    const currentUnread = this.unreadMessagesSubject.value;
    const updatedUnread = { ...currentUnread, [key]: count };
    this.unreadMessagesSubject.next(updatedUnread);
    this.saveUnreadMessagesToStorage(updatedUnread);
  }

  getUnreadCount(key: string): number {
    return this.unreadMessagesSubject.value[key] || 0;
  }

  incrementUnreadCount(key: string) {
    const currentCount = this.getUnreadCount(key);
    this.setUnreadCount(key, currentCount + 1);
  }

  decrementUnreadCount(key: string) {
    const currentCount = this.getUnreadCount(key);
    if (currentCount > 0) {
      this.setUnreadCount(key, currentCount - 1);
    }
  }

  resetUnreadCount(key: string) {
    this.setUnreadCount(key, 0);
  }

  getTotalUnreadCount(): number {
    const unreadMessages = this.unreadMessagesSubject.value;
    return Object.values(unreadMessages).reduce(
      (total, count) => total + count,
      0
    );
  }

  // Persistence methods
  private saveUnreadMessagesToStorage(unreadMessages: {
    [key: string]: number;
  }) {
    try {
      localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
    } catch (error) {
      console.error('Failed to save unread messages to localStorage:', error);
    }
  }

  private loadUnreadMessagesFromStorage() {
    try {
      const stored = localStorage.getItem('unreadMessages');
      if (stored) {
        const unreadMessages = JSON.parse(stored);
        this.unreadMessagesSubject.next(unreadMessages);
      }
    } catch (error) {
      console.error('Failed to load unread messages from localStorage:', error);
    }
  }

  // Clear all unread messages (useful for logout)
  clearAllUnreadMessages() {
    this.unreadMessagesSubject.next({});
    this.saveUnreadMessagesToStorage({});
  }
}
