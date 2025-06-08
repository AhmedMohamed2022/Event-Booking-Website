import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Booking } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { ChatDialogService } from '../../core/services/chat-dialog.service';
import { Router } from '@angular/router';
import { Message } from '../../core/models/chat.model';

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
  imports: [CommonModule, RouterModule],
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

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private chatService: ChatService,
    private chatDialog: ChatDialogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
    this.loadChats();
    this.subscribeToNewMessages();
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  loadBookings(): void {
    this.loading = true;
    this.error = null;

    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.initializeChatsWithSuppliers(bookings);
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load your bookings. Please try again.';
        this.loading = false;
        console.error('Error loading bookings:', error);
      },
    });
  }

  cancelBooking(bookingId: string): void {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

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
        this.error = 'Failed to cancel booking. Please try again.';
        this.cancelling = null;
        console.error('Error cancelling booking:', error);
      },
    });
  }

  loadChats(): void {
    this.chatService.getActiveChats().subscribe({
      next: (chats) => {
        this.activeChats = chats.map((chat) => ({
          userId: chat.otherUser._id,
          userName: 'User', // You'll need to get this from your user service
          lastMessage: chat.lastMessage.content || '',
          lastMessageTime: new Date(chat.lastMessage.timestamp),
          unreadCount: 0, // Initialize as 0 since backend doesn't have this yet
        }));
      },
      error: (error) => {
        console.error('Error loading chats:', error);
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
    switch (booking.status) {
      case 'cancelled':
        return 'Booking cancelled successfully';
      case 'confirmed':
        return 'Cannot be cancelled - Booking is already confirmed. Please contact support for assistance.';
      default:
        return 'Cannot be cancelled';
    }
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

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/']);
    }
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
      this.error = 'Please login to chat with supplier';
      return;
    }

    // Only allow chat if booking is confirmed
    if (booking.status !== 'confirmed') {
      alert('You can only chat with supplier after booking is confirmed');
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
}
