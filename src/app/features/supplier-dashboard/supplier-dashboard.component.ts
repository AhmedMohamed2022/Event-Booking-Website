import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupplierDashboardData } from '../../core/models/supplier-dashboard.model';
import { SupplierDashboardService } from '../../core/services/supplier-dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { ContactService } from '../../core/services/contact.service';
import { RateLimiterService } from '../../core/services/rate-limiter.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatService } from '../../core/services/chat.service';
import { Message, ActiveChat, ChatPreview } from '../../core/models/chat.model';
import {
  ContactRequest,
  ContactLimitInfo,
} from '../../core/models/contact.model';
import { Subscription } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { ChatComponent } from '../chat/chat.component';
import { SubscriptionOverviewComponent } from '../subscription-overview/subscription-overview.component';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    ChatComponent,
    SubscriptionOverviewComponent,
  ],
  templateUrl: './supplier-dashboard.component.html',
  styleUrls: ['./supplier-dashboard.component.css'],
})
export class SupplierDashboardComponent implements OnInit, OnDestroy {
  dashboardData: SupplierDashboardData | null = null;
  isLoading = true;
  error: string | null = null;
  processingBooking: string | null = null;

  // Chat related properties
  activeChats: ChatPreview[] = []; // Changed from ActiveChat to ChatPreview
  unreadMessages: { [userId: string]: number } = {};
  showChatWindow = false;
  currentChatUserId: string | null = null;
  currentChatUserName: string | null = null;
  private messageSubscription!: Subscription;
  private currentUserId: string | null = null;
  private processedMessageIds = new Set<string>(); // Add this to track message IDs

  // Contact request properties
  contactRequests: ContactRequest[] = [];
  contactLimitInfo: ContactLimitInfo | null = null;
  showContactRequests = false;

  // Caching and rate limiting
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  private lastContactLoad = 0;
  private lastLimitLoad = 0;
  private contactCache: ContactRequest[] = [];
  private limitCache: ContactLimitInfo | null = null;
  private rateLimitSubscription?: Subscription;
  rateLimitStatus: { isLimited: boolean; message?: string } = {
    isLimited: false,
  };

  constructor(
    private supplierService: SupplierDashboardService,
    private bookingService: BookingService,
    private authService: AuthService,
    private chatService: ChatService,
    private contactService: ContactService,
    private rateLimiterService: RateLimiterService,
    private router: Router,
    public translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadDashboard();
    this.setupChatNotifications();
    this.loadContactLimitInfo(); // Automatically load contact limit info

    // Subscribe to rate limit status
    this.rateLimitSubscription =
      this.rateLimiterService.rateLimitStatus$.subscribe((status) => {
        this.rateLimitStatus = status;
        if (status.isLimited) {
          console.warn(
            'Rate limit active in supplier dashboard:',
            status.message
          );
        }
      });
  }

  loadDashboard() {
    this.isLoading = true;
    this.error = null;

    this.supplierService.getSupplierDashboard().subscribe({
      next: (data) => {
        if (data && data.supplier) {
          console.log('Raw dashboard data:', data); // Debug raw data
          console.log('Revenue before:', data.supplier.totalRevenue); // Debug revenue before processing

          // Ensure data is properly structured
          this.dashboardData = {
            supplier: {
              ...data.supplier,
              totalRevenue: data.supplier.totalRevenue || 0, // Ensure totalRevenue is at least 0
            },
            services: Array.isArray(data.services) ? data.services : [],
            bookings: Array.isArray(data.bookings) ? data.bookings : [],
          };

          // Calculate total revenue from confirmed bookings if not provided or zero
          if (!this.dashboardData.supplier.totalRevenue) {
            const calculatedRevenue = this.dashboardData.bookings
              .filter((booking) => booking.status === 'confirmed')
              .reduce((total, booking) => total + (booking.totalPrice || 0), 0);

            // Only update if we calculated something
            if (calculatedRevenue > 0) {
              this.dashboardData.supplier.totalRevenue = calculatedRevenue;
            }
          }

          console.log(
            'Revenue after:',
            this.dashboardData.supplier.totalRevenue
          ); // Debug final revenue
        } else {
          console.error('Invalid dashboard data structure:', data);
          this.error = this.translate.instant(
            'supplierDashboard.errors.invalidData'
          );
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Dashboard loading error:', error);
        this.error = this.translate.instant(
          'supplierDashboard.errors.loadDashboard'
        );
        this.isLoading = false;
      },
    });
  }

  setupChatNotifications() {
    // Get current user ID
    this.currentUserId = this.getCurrentUserId();
    if (!this.currentUserId) {
      console.error('Unable to determine current user ID for chat');
      return;
    }

    // Initialize socket if not already connected
    if (!this.chatService.isSocketConnected()) {
      console.log('Socket not connected, initializing for notifications...');
      this.chatService.reinitializeSocket();
    }

    // Join the room with current user ID
    console.log('Joining room with supplier ID:', this.currentUserId);
    this.chatService.joinRoom(this.currentUserId);

    // Update message subscription to handle duplicates
    this.messageSubscription = this.chatService.newMessage$.subscribe(
      (message: any) => {
        if (message && message.to === this.currentUserId) {
          // Only process new messages
          if (!this.processedMessageIds.has(message._id)) {
            console.log('New message received in supplier dashboard:', message);
            this.processedMessageIds.add(message._id);

            // Update unread count for this sender
            if (!this.unreadMessages[message.from]) {
              this.unreadMessages[message.from] = 0;
            }
            this.unreadMessages[message.from]++;

            // If this is a new chat, load active chats
            this.loadActiveChats();

            // Play notification sound
            this.playNotificationSound();
          }
        }
      },
      (error: any) => {
        console.error('Error in message subscription:', error);
      }
    );

    // Load active chats initially
    this.loadActiveChats();
  }

  loadActiveChats() {
    this.chatService.getActiveChats().subscribe(
      (chats) => {
        console.log('Active chats loaded:', chats);
        // Convert ActiveChat to ChatPreview format
        this.activeChats = chats.map((chat) => ({
          userId: chat.otherUser._id,
          userName: chat.otherUser.name,
          lastMessage: chat.lastMessage.content,
          lastMessageTime: chat.lastMessage.timestamp,
          unreadCount: chat.unreadCount,
        }));

        // Update unread messages count
        this.activeChats.forEach((chat) => {
          if (chat.unreadCount > 0) {
            this.unreadMessages[chat.userId] = chat.unreadCount;
          }
        });
      },
      (error) => {
        console.error('Error loading active chats:', error);
      }
    );
  }

  openChat(userId: string, userName: string) {
    this.currentChatUserId = userId;
    this.currentChatUserName = userName;
    this.showChatWindow = true;

    // Reset unread count for this user
    this.unreadMessages[userId] = 0;
  }

  closeChat = () => {
    console.log('Closing chat window');
    this.showChatWindow = false;
    this.currentChatUserId = null;
    this.currentChatUserName = null;
  };

  getTotalUnreadMessages(): number {
    return Object.values(this.unreadMessages).reduce(
      (total, count) => total + count,
      0
    );
  }

  playNotificationSound() {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  getCurrentUserId(): string | null {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      return user.id;
    }

    // Fallback to token decoding if user object is not available
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  ngOnDestroy() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.rateLimitSubscription) {
      this.rateLimitSubscription.unsubscribe();
    }
    // Clear any open chat windows
    this.closeChat();
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(this.translate.currentLang, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat(this.translate.currentLang, {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  confirmBooking(bookingId: string) {
    this.processingBooking = bookingId;
    this.bookingService.updateBookingStatus(bookingId, 'confirmed').subscribe(
      () => {
        // Update local data
        this.updateBookingStatus(bookingId, 'confirmed');
        this.processingBooking = null;
      },
      (error) => {
        console.error('Error confirming booking:', error);
        this.processingBooking = null;
      }
    );
  }

  rejectBooking(bookingId: string) {
    this.processingBooking = bookingId;
    this.bookingService.updateBookingStatus(bookingId, 'cancelled').subscribe(
      () => {
        // Update local data
        this.updateBookingStatus(bookingId, 'cancelled');
        this.processingBooking = null;
      },
      (error) => {
        console.error('Error rejecting booking:', error);
        this.processingBooking = null;
      }
    );
  }

  private updateBookingStatus(
    bookingId: string,
    newStatus: 'confirmed' | 'cancelled'
  ) {
    this.bookingService.updateBookingStatus(bookingId, newStatus).subscribe({
      next: () => {
        this.loadDashboard(); // Reload dashboard data
      },
      error: (error) => {
        console.error('Error updating booking status:', error);
      },
    });
  }

  // Contact request methods
  loadContactRequests() {
    // Check cache first
    const now = Date.now();
    if (
      this.contactCache.length > 0 &&
      now - this.lastContactLoad < this.cacheTimeout
    ) {
      console.log('Using cached contact requests data');
      this.contactRequests = this.contactCache;
      return;
    }

    this.contactService.getContactRequests().subscribe({
      next: (requests: ContactRequest[]) => {
        console.log('Contact requests loaded:', requests);
        this.contactRequests = requests;
        this.contactCache = requests; // Cache the results
        this.lastContactLoad = now;
      },
      error: (error: any) => {
        console.error('Error loading contact requests:', error);
      },
    });
  }

  loadContactLimitInfo() {
    // Check cache first
    const now = Date.now();
    if (this.limitCache && now - this.lastLimitLoad < this.cacheTimeout) {
      console.log('Using cached contact limit info');
      this.contactLimitInfo = this.limitCache;
      return;
    }

    this.contactService.getContactLimitInfo().subscribe({
      next: (limitInfo: ContactLimitInfo) => {
        console.log('Contact limit info loaded:', limitInfo);
        this.contactLimitInfo = limitInfo;
        this.limitCache = limitInfo; // Cache the results
        this.lastLimitLoad = now;
      },
      error: (error: any) => {
        console.error('Error loading contact limit info:', error);
      },
    });
  }

  updateContactRequestStatus(
    requestId: string,
    status: 'accepted' | 'rejected'
  ) {
    this.contactService
      .updateContactRequestStatus(requestId, status)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Reload contact requests and limit info
            this.loadContactRequests();
            this.loadContactLimitInfo();
            alert(`Contact request ${status} successfully`);
          } else {
            alert(response.message || 'Failed to update contact request');
          }
        },
        error: (error) => {
          console.error('Error updating contact request status:', error);
          alert('Failed to update contact request status');
        },
      });
  }

  toggleContactRequests() {
    this.showContactRequests = !this.showContactRequests;
    if (this.showContactRequests) {
      this.loadContactRequests();
    }
  }

  // Helper methods to safely access client and service properties
  getClientName(request: ContactRequest): string {
    if (typeof request.client === 'string') {
      return 'Unknown Client';
    }
    return request.client.name || 'Unknown Client';
  }

  getClientPhone(request: ContactRequest): string {
    if (typeof request.client === 'string') {
      return '';
    }
    return request.client.phone || '';
  }

  getServiceName(request: ContactRequest): string {
    if (typeof request.service === 'string') {
      return 'Unknown Service';
    }
    return request.service.name || 'Unknown Service';
  }

  getServiceCategory(request: ContactRequest): string {
    if (typeof request.service === 'string') {
      return '';
    }
    return request.service.category || '';
  }
}
