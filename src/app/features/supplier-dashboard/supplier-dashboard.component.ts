import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupplierDashboardData } from '../../core/models/supplier-dashboard.model';
import { SupplierDashboardService } from '../../core/services/supplier-dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatService } from '../../core/services/chat.service';
import { Message, ActiveChat, ChatPreview } from '../../core/models/chat.model';
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

  constructor(
    private supplierService: SupplierDashboardService,
    private bookingService: BookingService,
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router,
    public translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadDashboard();
    this.setupChatNotifications();
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
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.userId || decodedToken.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  ngOnDestroy() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
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
    newStatus: 'pending' | 'confirmed' | 'cancelled'
  ) {
    if (!this.dashboardData) return;

    // Find the booking in our list
    const booking = this.dashboardData.bookings.find(
      (b) => b._id === bookingId
    );

    if (booking) {
      const oldStatus = booking.status;
      booking.status = newStatus;

      // Update counts in supplier data
      if (oldStatus === 'pending') {
        this.dashboardData.supplier.pendingBookings--;

        if (newStatus === 'confirmed') {
          this.dashboardData.supplier.confirmedBookings++;
          // Add to total revenue if confirmed
          this.dashboardData.supplier.totalRevenue += booking.totalPrice || 0;
        } else if (newStatus === 'cancelled') {
          this.dashboardData.supplier.cancelledBookings++;
        }
      }
    }
  }
}
