import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Booking } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { ChatDialogService } from '../../core/services/chat-dialog.service';
import { ContactService } from '../../core/services/contact.service';
import { Router } from '@angular/router';
import { Message } from '../../core/models/chat.model';
import { ContactRequest } from '../../core/models/contact.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RateLimiterService } from '../../core/services/rate-limiter.service';

interface ChatPreview {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

interface BookingWithSupplier extends Booking {
  supplier: {
    _id: string;
    name: string;
  };
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, TranslateModule],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css'],
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  bookings: Booking[] = [];
  loading = false;
  error: string | null = null;
  cancelling: string | null = null;

  showChats = true;
  activeChats: ChatPreview[] = [];
  private chatSubscription?: Subscription;
  private rateLimitSubscription?: Subscription;

  // Contact request properties
  contactRequests: ContactRequest[] = [];
  showContactRequests = false;
  loadingContactRequests = false;
  lastContactUpdate: Date | null = null;
  isRefreshing = false;
  private contactRefreshInterval: any;
  private previousContactRequests: ContactRequest[] = [];
  private refreshTimeout: any;

  // Caching and rate limiting
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  private lastChatLoad = 0;
  private lastBookingLoad = 0;
  private chatCache: any[] = [];
  private bookingsCache: Booking[] = [];
  private isInitialLoad = true;
  unreadMessages: { [userId: string]: number } = {};
  rateLimitStatus: { isLimited: boolean; message?: string } = {
    isLimited: false,
  };

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private chatService: ChatService,
    private chatDialog: ChatDialogService,
    private router: Router,
    private translate: TranslateService,
    private contactService: ContactService,
    private rateLimiterService: RateLimiterService
  ) {}

  ngOnInit(): void {
    this.loadBookings();
    this.loadChats();
    this.subscribeToNewMessages();
    this.loadContactRequests();

    // Request notification permission
    this.requestNotificationPermission();

    // Subscribe to rate limit status
    this.rateLimitSubscription =
      this.rateLimiterService.rateLimitStatus$.subscribe((status) => {
        this.rateLimitStatus = status;
        if (status.isLimited) {
          console.warn('Rate limit active:', status.message);
        }
      });

    // Remove aggressive auto-refresh - only refresh when user is active
    this.setupSmartRefresh();
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    if (this.rateLimitSubscription) {
      this.rateLimitSubscription.unsubscribe();
    }
    if (this.contactRefreshInterval) {
      clearInterval(this.contactRefreshInterval);
    }
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }

  private setupSmartRefresh(): void {
    // Only refresh when user is actively viewing the page
    let userActive = true;
    let lastActivity = Date.now();

    // Track user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];
    activityEvents.forEach((event) => {
      document.addEventListener(event, () => {
        userActive = true;
        lastActivity = Date.now();
      });
    });

    // Check if user is inactive (no activity for 2 minutes)
    setInterval(() => {
      userActive = Date.now() - lastActivity < 2 * 60 * 1000;
    }, 30000); // Check every 30 seconds

    // Smart refresh every 5 minutes only if user is active
    this.contactRefreshInterval = setInterval(() => {
      if (
        userActive &&
        this.showContactRequests &&
        !this.loadingContactRequests
      ) {
        const timeSinceLastUpdate = this.lastContactUpdate
          ? Date.now() - this.lastContactUpdate.getTime()
          : Infinity;

        // Only refresh if data is older than 5 minutes
        if (timeSinceLastUpdate > this.cacheTimeout) {
          console.log(
            'Smart refresh: User active and data stale, refreshing...'
          );
          this.loadContactRequests();
        } else {
          console.log(
            'Smart refresh: Skipping - data is fresh or user inactive'
          );
        }
      }
    }, 5 * 60 * 1000); // 5 minutes instead of 2 minutes
  }

  loadBookings(): void {
    // Check cache first
    const now = Date.now();
    if (
      !this.isInitialLoad &&
      this.bookingsCache.length > 0 &&
      now - this.lastBookingLoad < this.cacheTimeout
    ) {
      console.log('Using cached bookings data');
      this.bookings = this.bookingsCache;
      this.initializeChatsWithSuppliers(this.bookings);
      return;
    }

    this.loading = true;
    this.error = null;

    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.bookingsCache = bookings; // Cache the results
        this.lastBookingLoad = now;
        this.initializeChatsWithSuppliers(bookings);
        this.loading = false;
        this.isInitialLoad = false;
      },
      error: (error) => {
        this.error = 'Failed to load your bookings. Please try again.';
        this.loading = false;
        console.error('Error loading bookings:', error);
      },
    });
  }

  logout() {
    this.translate
      .get('clientDashboard.confirmations.logout')
      .subscribe((msg: string) => {
        if (confirm(msg)) {
          this.authService.logout();
          this.router.navigate(['/']);
        }
      });
  }

  cancelBooking(bookingId: string): void {
    this.translate
      .get('clientDashboard.confirmations.cancelBooking')
      .subscribe((msg: string) => {
        if (confirm(msg)) {
          this.cancelling = bookingId;

          this.bookingService.cancelBooking(bookingId).subscribe({
            next: (response) => {
              // Update the booking status locally
              const bookingIndex = this.bookings.findIndex(
                (b) => b._id === bookingId
              );
              if (bookingIndex !== -1) {
                this.bookings[bookingIndex] = {
                  ...this.bookings[bookingIndex],
                  status: 'cancelled',
                };
              }
              this.cancelling = null;
            },
            error: (error) => {
              this.translate
                .get('clientDashboard.errors.cancelBooking')
                .subscribe((msg: string) => {
                  this.error = msg;
                });
              this.cancelling = null;
              console.error('Error cancelling booking:', error);
            },
          });
        }
      });
  }

  loadChats(): void {
    // Check cache first
    const now = Date.now();
    if (
      !this.isInitialLoad &&
      this.chatCache.length > 0 &&
      now - this.lastChatLoad < this.cacheTimeout
    ) {
      console.log('Using cached chats data');
      this.activeChats = this.chatCache;
      return;
    }

    this.chatService.getActiveChats().subscribe({
      next: (chats) => {
        console.log('Active chats loaded:', chats);
        // Convert ActiveChat to ChatPreview format
        this.activeChats = chats.map((chat) => ({
          userId: chat.otherUser._id,
          userName: 'User', // You'll need to get this from your user service
          lastMessage: chat.lastMessage.content || '',
          lastMessageTime: new Date(chat.lastMessage.timestamp),
          unreadCount: 0, // Initialize as 0 since backend doesn't have this yet
        }));

        // Cache the results
        this.chatCache = this.activeChats;
        this.lastChatLoad = now;

        // Update unread messages count
        this.activeChats.forEach((chat) => {
          if (chat.unreadCount > 0) {
            this.unreadMessages[chat.userId] = chat.unreadCount;
          }
        });
      },
      error: (error) => {
        console.error('Error loading chats:', error);
        // Don't show error to user for chat loading failures
        // Just log it and continue
      },
    });
  }

  subscribeToNewMessages(): void {
    this.chatSubscription = this.chatService.newMessage$.subscribe(
      (message: Message | null) => {
        if (!message) return;

        const chatIndex = this.activeChats.findIndex(
          (chat) => chat.userId === message.from
        );

        if (chatIndex !== -1) {
          this.activeChats[chatIndex] = {
            ...this.activeChats[chatIndex],
            lastMessage: message.text,
            lastMessageTime: new Date(message.createdAt),
            unreadCount: this.activeChats[chatIndex].unreadCount + 1,
          };
        }
      }
    );
  }

  openChat(userId: string): void {
    const chat = this.activeChats.find((c) => c.userId === userId);
    if (chat) {
      // Reset unread count when opening chat
      chat.unreadCount = 0;
      this.chatDialog.openChat(userId, chat.userName);
    }
  }

  toggleChats(): void {
    this.showChats = !this.showChats;
  }

  getCancellationMessage(booking: Booking): string {
    const key =
      `clientDashboard.booking.status.${booking.status}` as keyof typeof this.translate;
    return (
      this.translate.instant(key) ||
      this.translate.instant('clientDashboard.booking.status.default')
    );
  }

  canCancelBooking(booking: Booking): boolean {
    // Only allow cancellation for pending bookings
    return booking.status === 'pending';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'confirmed':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatPrice(price: number): string {
    return `${price.toFixed(2)}`;
  }

  trackByBookingId(index: number, booking: Booking): string {
    return booking._id;
  }

  formatTime(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === now.toDateString()) {
      // Today - show time
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (messageDate.getFullYear() === now.getFullYear()) {
      // This year - show month and day
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } else {
      // Different year - show date with year
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  private handleNewMessage(message: Message) {
    const existingChatIndex = this.activeChats.findIndex(
      (chat) => chat.userId === message.from
    );

    if (existingChatIndex > -1) {
      this.activeChats[existingChatIndex] = {
        ...this.activeChats[existingChatIndex],
        lastMessage: message.text,
        lastMessageTime: new Date(message.createdAt),
        unreadCount: this.activeChats[existingChatIndex].unreadCount + 1,
      };
    }
  }

  private initializeChatsWithSuppliers(bookings: Booking[]): void {
    const uniqueSuppliers = new Map();

    bookings.forEach((booking) => {
      if (booking.supplier && !uniqueSuppliers.has(booking.supplier._id)) {
        uniqueSuppliers.set(booking.supplier._id, {
          userId: booking.supplier._id,
          userName: booking.supplier.name,
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadCount: 0,
        });
      }
    });

    // Merge with existing active chats
    this.activeChats = [
      ...Array.from(uniqueSuppliers.values()),
      ...this.activeChats.filter(
        (chat) => !Array.from(uniqueSuppliers.keys()).includes(chat.userId)
      ),
    ];
  }

  startChatWithSupplier(booking: Booking): void {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      this.translate
        .get('clientDashboard.errors.loginRequired')
        .subscribe((msg: string) => {
          this.error = msg;
        });
      return;
    }

    // Only allow chat if booking is confirmed
    if (booking.status !== 'confirmed') {
      this.translate
        .get('clientDashboard.booking.actions.chatPending')
        .subscribe((msg: string) => {
          alert(msg);
        });
      return;
    }

    if (booking.supplier?._id) {
      this.chatDialog.openChat(
        booking.supplier._id,
        booking.supplier.name || 'Supplier'
      );
    }
  }

  // Add method to check booking status
  canChatWithSupplier(booking: Booking): boolean {
    return booking.status === 'confirmed';
  }

  loadContactRequests(): void {
    // Prevent multiple simultaneous requests
    if (this.loadingContactRequests) {
      console.log('Contact requests already loading, skipping...');
      return;
    }

    // Check if we have recent data
    if (
      this.lastContactUpdate &&
      Date.now() - this.lastContactUpdate.getTime() < this.cacheTimeout
    ) {
      console.log('Using cached contact requests data');
      return;
    }

    this.loadingContactRequests = true;
    this.contactService.getClientContactRequests().subscribe({
      next: (requests) => {
        // Check for status changes
        this.checkForStatusChanges(requests);

        this.contactRequests = requests;
        this.loadingContactRequests = false;
        this.lastContactUpdate = new Date();
        console.log('Contact requests refreshed at:', this.lastContactUpdate);
        console.log('Found contact requests:', requests.length);
      },
      error: (error) => {
        this.loadingContactRequests = false;

        // Handle rate limiting specifically
        if (error.status === 429) {
          console.warn('Rate limit hit, will retry later');
          this.error = this.translate.instant('rateLimit.tooManyRequests');
          // Clear error after 10 seconds
          setTimeout(() => {
            this.error = null;
          }, 10000);

          // Extend cache timeout to prevent immediate retry
          if (this.lastContactUpdate) {
            this.lastContactUpdate = new Date(
              this.lastContactUpdate.getTime() - this.cacheTimeout + 60000
            );
          }
        } else {
          this.error = 'Failed to load contact requests. Please try again.';
          console.error('Error loading contact requests:', error);
        }
      },
    });
  }

  private checkForStatusChanges(newRequests: ContactRequest[]): void {
    if (this.previousContactRequests.length === 0) {
      this.previousContactRequests = [...newRequests];
      return;
    }

    newRequests.forEach((newRequest) => {
      const oldRequest = this.previousContactRequests.find(
        (req) => req._id === newRequest._id
      );

      if (oldRequest && oldRequest.status !== newRequest.status) {
        // Status has changed - show notification
        this.showStatusChangeNotification(
          newRequest,
          oldRequest.status,
          newRequest.status
        );
      }
    });

    this.previousContactRequests = [...newRequests];
  }

  private showStatusChangeNotification(
    request: ContactRequest,
    oldStatus: string,
    newStatus: string
  ): void {
    const serviceName = this.getContactServiceName(request);
    const supplierName = this.getContactSupplierName(request);

    let message = '';
    let type: 'success' | 'warning' | 'info' = 'info';

    if (newStatus === 'accepted') {
      message = `Your contact request for "${serviceName}" has been accepted by ${supplierName}. You can now chat with them!`;
      type = 'success';
    } else if (newStatus === 'rejected') {
      message = `Your contact request for "${serviceName}" has been rejected by ${supplierName}.`;
      type = 'warning';
    }

    if (message) {
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Contact Request Update', {
          body: message,
          icon: '/assets/favicon.ico',
        });
      }

      // Show in-app notification
      this.showInAppNotification(message, type);
    }
  }

  private showInAppNotification(
    message: string,
    type: 'success' | 'warning' | 'info'
  ): void {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${
      type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'
    } alert-dismissible fade show position-fixed`;
    notification.style.cssText =
      'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      <i class="fas fa-${
        type === 'success'
          ? 'check-circle'
          : type === 'warning'
          ? 'exclamation-triangle'
          : 'info-circle'
      } me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  refreshContactRequests(): void {
    // Prevent multiple rapid refreshes
    if (this.isRefreshing) {
      console.log('Refresh already in progress, skipping...');
      return;
    }

    // Check rate limit status
    if (this.rateLimitStatus.isLimited) {
      console.warn('Rate limit active, skipping refresh');
      this.error = this.rateLimitStatus.message || this.translate.instant('rateLimit.tooManyRequests');
      return;
    }

    // Add debouncing - prevent refresh if last refresh was less than 30 seconds ago
    if (
      this.lastContactUpdate &&
      Date.now() - this.lastContactUpdate.getTime() < 30000
    ) {
      console.log('Debouncing refresh - last update was too recent');
      return;
    }

    this.isRefreshing = true;
    this.error = null;

    // Clear any existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    // Add a small delay to prevent rapid successive calls
    this.refreshTimeout = setTimeout(() => {
      this.loadContactRequests();
      this.isRefreshing = false;
    }, 1000);
  }

  toggleContactRequests(): void {
    this.showContactRequests = !this.showContactRequests;
    if (this.showContactRequests) {
      // Only refresh if we don't have recent data or if data is older than 5 minutes
      const shouldRefresh =
        !this.lastContactUpdate ||
        new Date().getTime() - this.lastContactUpdate.getTime() > 5 * 60 * 1000;

      if (shouldRefresh) {
        this.loadContactRequests(); // Refresh if data is stale
      } else {
        console.log('Using cached contact requests data');
      }
    }
  }

  // Helper methods to safely access supplier and service properties
  getContactSupplierName(request: ContactRequest): string {
    if (typeof request.supplier === 'string') {
      return 'Unknown Supplier';
    }
    return (request.supplier as any).name || 'Unknown Supplier';
  }

  getContactServiceName(request: ContactRequest): string {
    if (typeof request.service === 'string') {
      return 'Unknown Service';
    }
    return (request.service as any).name || 'Unknown Service';
  }

  getContactServiceCategory(request: ContactRequest): string {
    if (typeof request.service === 'string') {
      return '';
    }
    return (request.service as any).category || '';
  }

  getContactStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  }

  canChatWithContactSupplier(request: ContactRequest): boolean {
    return request.status === 'accepted';
  }

  startChatWithContactSupplier(request: ContactRequest): void {
    if (this.canChatWithContactSupplier(request)) {
      const supplierId =
        typeof request.supplier === 'string'
          ? request.supplier
          : (request.supplier as any)._id;
      const supplierName = this.getContactSupplierName(request);
      this.chatDialog.openChat(supplierId, supplierName);
    }
  }

  private requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }
  }
}
