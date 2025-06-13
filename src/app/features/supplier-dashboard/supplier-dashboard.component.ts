import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupplierDashboardData } from '../../core/models/supplier-dashboard.model';
import { SupplierDashboardService } from '../../core/services/supplier-dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router,
    public translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading = true;
    this.error = null;

    this.supplierService.getSupplierDashboard().subscribe({
      next: (data) => {
        if (data && data.supplier) {
          console.log('Raw dashboard data:', data); // Debug raw data
          console.log('Revenue before:', data.supplier.totalRevenue); // Debug revenue before processing

          this.dashboardData = data;

          // Calculate total revenue from confirmed bookings if not provided
          if (!this.dashboardData.supplier.totalRevenue) {
            this.dashboardData.supplier.totalRevenue =
              this.dashboardData.bookings
                .filter((booking) => booking.status === 'confirmed')
                .reduce(
                  (total, booking) => total + (booking.totalPrice || 0),
                  0
                );
          }

          console.log(
            'Revenue after:',
            this.dashboardData.supplier.totalRevenue
          ); // Debug final revenue
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

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null || isNaN(amount)) {
      console.log('Invalid amount:', amount);
      return this.translate.instant('supplierDashboard.stats.defaults.amount', {
        amount: '0.00',
      });
    }

    try {
      const currentLang = this.translate.currentLang;
      const formatter = new Intl.NumberFormat(
        currentLang === 'ar' ? 'ar-JO' : 'en-US',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      );

      const formattedAmount = formatter.format(amount);

      // Use translation for currency symbol placement based on language
      return this.translate.instant('supplierDashboard.stats.currency.format', {
        amount: formattedAmount,
        currency: 'JD',
      });
    } catch (error) {
      console.error('Currency formatting error:', error);
      return this.translate.instant('supplierDashboard.stats.defaults.amount', {
        amount: '0.00',
      });
    }
  }

  logout() {
    this.translate
      .get('supplierDashboard.confirmations.logout')
      .subscribe((msg: string) => {
        if (confirm(msg)) {
          this.authService.logout();
          this.router.navigate(['/']);
        }
      });
  }

  confirmBooking(bookingId: string) {
    this.translate
      .get('supplierDashboard.bookings.actions.confirmAccept')
      .subscribe((msg: string) => {
        if (confirm(msg)) {
          this.processingBooking = bookingId;

          this.bookingService
            .updateBookingStatus(bookingId, 'confirmed')
            .subscribe({
              next: (response) => {
                this.updateBookingStatus(bookingId, 'confirmed');
                this.translate
                  .get('supplierDashboard.bookings.actions.success.confirmed')
                  .subscribe((successMsg: string) => alert(successMsg));
              },
              error: (error) => {
                console.error('Error confirming booking:', error);
                this.translate
                  .get('supplierDashboard.bookings.actions.error.confirmed')
                  .subscribe((errorMsg: string) => alert(errorMsg));
              },
              complete: () => {
                this.processingBooking = null;
              },
            });
        }
      });
  }

  rejectBooking(bookingId: string) {
    this.translate
      .get('supplierDashboard.bookings.actions.confirmReject')
      .subscribe((msg: string) => {
        if (confirm(msg)) {
          this.processingBooking = bookingId;

          this.bookingService
            .updateBookingStatus(bookingId, 'cancelled')
            .subscribe({
              next: (response) => {
                this.updateBookingStatus(bookingId, 'cancelled');
                this.translate
                  .get('supplierDashboard.bookings.actions.success.rejected')
                  .subscribe((successMsg: string) => alert(successMsg));
              },
              error: (error) => {
                console.error('Error rejecting booking:', error);
                this.translate
                  .get('supplierDashboard.bookings.actions.error.rejected')
                  .subscribe((errorMsg: string) => alert(errorMsg));
              },
              complete: () => {
                this.processingBooking = null;
              },
            });
        }
      });
  }

  private updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'cancelled'
  ) {
    if (this.dashboardData) {
      const booking = this.dashboardData.bookings.find(
        (b) => b._id === bookingId
      );
      if (booking) {
        const oldStatus = booking.status;
        booking.status = status;

        // Update booking counts
        if (oldStatus === 'pending') {
          this.dashboardData.supplier.pendingBookings--;
          if (status === 'confirmed') {
            this.dashboardData.supplier.confirmedBookings++;
            // Add to total revenue when confirming
            this.dashboardData.supplier.totalRevenue += booking.totalPrice || 0;
          } else {
            this.dashboardData.supplier.cancelledBookings++;
          }
        }

        console.log('Updated dashboard data:', this.dashboardData); // Debug updated data
      }
    }
  }
}
