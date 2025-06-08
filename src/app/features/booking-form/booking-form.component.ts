import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EventItem } from '../../core/models/event-item.model';
import { AuthService } from '../../core/services/auth.service';
import { BookingFormService } from '../../core/services/booking-form.service';

interface BookingRequest {
  eventItemId: string;
  eventDate: string;
  numberOfPeople: number;
  phone?: string;
  name?: string;
}

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.css',
})
export class BookingFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingFormService);
  private authService = inject(AuthService);

  eventItem: EventItem | null = null;
  loading = false;
  submitting = false;
  error = '';
  success = false;

  bookingForm: BookingRequest = {
    eventItemId: '',
    eventDate: '',
    numberOfPeople: 50,
    phone: '',
    name: '',
  };

  isLoggedIn = false;
  currentUser: any = null;

  ngOnInit() {
    this.checkAuthStatus();
    this.loadEventItem();
  }

  private checkAuthStatus() {
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.currentUser = this.authService.getCurrentUser();
      if (this.currentUser) {
        this.bookingForm.phone = this.currentUser.phone || '';
        this.bookingForm.name = this.currentUser.name || '';
      }
    }
  }

  private loadEventItem() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId) {
      this.router.navigate(['/']);
      return;
    }

    this.loading = true;
    this.bookingForm.eventItemId = eventId;

    this.bookingService.getEventItem(eventId).subscribe({
      next: (item) => {
        this.eventItem = item;
        this.loading = false;

        // Set default number of people to minimum capacity
        if (this.eventItem.minCapacity) {
          this.bookingForm.numberOfPeople = this.eventItem.minCapacity;
        }
      },
      error: (err) => {
        console.error('Error loading event item:', err);
        this.error = 'Failed to load service details';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/']), 3000);
      },
    });
  }

  onSubmit() {
    if (!this.isLoggedIn) {
      // Redirect to login with return URL
      const returnUrl = `/booking/${this.bookingForm.eventItemId}`;
      this.router.navigate(['/login'], { queryParams: { returnUrl } });
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.submitting = true;
    this.error = '';

    const bookingData = {
      eventItemId: this.bookingForm.eventItemId,
      eventDate: this.bookingForm.eventDate,
      numberOfPeople: this.bookingForm.numberOfPeople,
    };

    this.bookingService.createBooking(bookingData).subscribe({
      next: (response) => {
        this.success = true;
        this.submitting = false;

        // Show success message and redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/client-dashboard']);
          alert('Booking created successfully!');
        }, 2000);
      },
      error: (err) => {
        console.error('Booking error:', err);
        this.submitting = false;

        if (err.status === 403) {
          this.error =
            'This service provider has reached their booking limit. Please try another service.';
        } else if (err.status === 401) {
          this.error = 'Please log in to continue with your booking.';
          setTimeout(() => {
            const returnUrl = `/booking/${this.bookingForm.eventItemId}`;
            this.router.navigate(['/login'], { queryParams: { returnUrl } });
          }, 2000);
        } else {
          this.error =
            err.error?.message || 'Failed to create booking. Please try again.';
        }
      },
    });
  }

  private validateForm(): boolean {
    // Check required fields
    if (!this.bookingForm.eventDate) {
      this.error = 'Please select an event date';
      return false;
    }

    if (
      !this.bookingForm.numberOfPeople ||
      this.bookingForm.numberOfPeople < 1
    ) {
      this.error = 'Please enter a valid number of people';
      return false;
    }

    // Check capacity limits
    if (this.eventItem) {
      if (this.bookingForm.numberOfPeople < this.eventItem.minCapacity) {
        this.error = `Minimum capacity is ${this.eventItem.minCapacity} people`;
        return false;
      }

      if (this.bookingForm.numberOfPeople > this.eventItem.maxCapacity) {
        this.error = `Maximum capacity is ${this.eventItem.maxCapacity} people`;
        return false;
      }
    }

    // Check if selected date is available
    if (this.eventItem && !this.isDateAvailable(this.bookingForm.eventDate)) {
      this.error = 'Selected date is not available';
      return false;
    }

    if (!this.bookingForm.phone || this.bookingForm.phone.trim().length < 10) {
      this.error = 'Please enter a valid phone number';
      return false;
    }

    if (!this.bookingForm.name || this.bookingForm.name.trim().length < 2) {
      this.error = 'Please enter your full name';
      return false;
    }

    return true;
  }

  isDateAvailable(dateString: string): boolean {
    if (!this.eventItem || !dateString) return false;

    const selectedDate = new Date(dateString);
    return this.eventItem.availableDates.some((availableDate) => {
      const available = new Date(availableDate);
      return available.toDateString() === selectedDate.toDateString();
    });
  }

  getFormattedDate(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  calculateDepositAmount(): number {
    return this.eventItem ? this.eventItem.price * 0.1 : 0;
  }

  goBack() {
    if (this.eventItem) {
      this.router.navigate(['/service', this.eventItem._id]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
