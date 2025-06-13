import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupplierDashboardData } from '../../core/models/supplier-dashboard.model';
import { SupplierDashboardService } from '../../core/services/supplier-dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './supplier-dashboard.component.html',
  styleUrls: ['./supplier-dashboard.component.css'],
})
export class SupplierDashboardComponent implements OnInit {
  dashboardData: SupplierDashboardData | null = null;
  isLoading = true;
  error: string | null = null;
  processingBooking: string | null = null;

  constructor(
    private supplierService: SupplierDashboardService,
    private bookingService: BookingService, // Add this
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading = true;
    this.error = null;

    this.supplierService.getSupplierDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load dashboard data';
        this.isLoading = false;
        console.error('Dashboard error:', error);
      },
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'cancelled':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatCurrency(amount: number): string {
    return `${amount} JD`;
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/']);
    }
  }

  confirmBooking(bookingId: string) {
    if (!confirm('Are you sure you want to accept this booking?')) {
      return;
    }

    this.processingBooking = bookingId;

    this.bookingService.updateBookingStatus(bookingId, 'confirmed').subscribe({
      next: (response) => {
        // Update local state after successful API call
        if (this.dashboardData) {
          const booking = this.dashboardData.bookings.find(
            (b) => b._id === bookingId
          );
          if (booking) {
            booking.status = 'confirmed';
            this.dashboardData.supplier.pendingBookings--;
            this.dashboardData.supplier.confirmedBookings++;
          }
        }
        alert('Booking confirmed successfully');
      },
      error: (error) => {
        console.error('Error confirming booking:', error);
        alert('Failed to confirm booking. Please try again.');
      },
      complete: () => {
        this.processingBooking = null;
      },
    });
  }

  rejectBooking(bookingId: string) {
    if (!confirm('Are you sure you want to reject this booking?')) {
      return;
    }

    this.processingBooking = bookingId;

    this.bookingService.updateBookingStatus(bookingId, 'cancelled').subscribe({
      next: (response) => {
        // Update local state after successful API call
        if (this.dashboardData) {
          const booking = this.dashboardData.bookings.find(
            (b) => b._id === bookingId
          );
          if (booking) {
            booking.status = 'cancelled';
            this.dashboardData.supplier.pendingBookings--;
            this.dashboardData.supplier.cancelledBookings++;
          }
        }
        alert('Booking rejected successfully');
      },
      error: (error) => {
        console.error('Error rejecting booking:', error);
        alert('Failed to reject booking. Please try again.');
      },
      complete: () => {
        this.processingBooking = null;
      },
    });
  }
}
