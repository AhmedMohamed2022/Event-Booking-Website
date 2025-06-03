import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EventItem } from '../../core/models/event-item.model';
import { environment } from '../../environments/environment';

export interface BookingRequest {
  eventItemId: string;
  eventDate: string;
  numberOfPeople: number;
}

export interface BookingResponse {
  message: string;
  booking: {
    _id: string;
    eventItem: string;
    client: string;
    eventDate: string;
    numberOfPeople: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    totalPrice: number;
    paidAmount: number;
    createdAt: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class BookingFormService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl || 'http://localhost:5000/api';

  /**
   * Get event item details by ID
   */
  getEventItem(id: string): Observable<EventItem> {
    return this.http.get<EventItem>(`${this.apiUrl}/event-items/${id}`).pipe(
      map((response) => {
        // Ensure availableDates are Date objects
        if (response.availableDates) {
          response.availableDates = response.availableDates.map(
            (date) => new Date(date)
          );
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create a new booking
   */
  createBooking(bookingData: BookingRequest): Observable<BookingResponse> {
    const headers = this.getAuthHeaders();

    return this.http
      .post<BookingResponse>(`${this.apiUrl}/bookings`, bookingData, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get user's bookings
   */
  getUserBookings(): Observable<any[]> {
    const headers = this.getAuthHeaders();

    return this.http
      .get<any[]>(`${this.apiUrl}/bookings/my-bookings`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Cancel a booking
   */
  cancelBooking(bookingId: string): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http
      .patch(`${this.apiUrl}/bookings/${bookingId}/cancel`, {}, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Check if a specific date is available for an event item
   */
  checkDateAvailability(
    eventItemId: string,
    date: string
  ): Observable<boolean> {
    return this.getEventItem(eventItemId).pipe(
      map((eventItem) => {
        if (
          !eventItem.availableDates ||
          eventItem.availableDates.length === 0
        ) {
          return false;
        }

        const selectedDate = new Date(date);
        return eventItem.availableDates.some((availableDate) => {
          const available = new Date(availableDate);
          return available.toDateString() === selectedDate.toDateString();
        });
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Validate booking data before submission
   */
  validateBookingData(
    bookingData: BookingRequest,
    eventItem: EventItem
  ): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!bookingData.eventDate) {
      errors.push('Event date is required');
    }

    if (!bookingData.numberOfPeople || bookingData.numberOfPeople < 1) {
      errors.push('Number of people is required and must be greater than 0');
    }

    if (!bookingData.eventItemId) {
      errors.push('Event item ID is required');
    }

    // Check capacity limits
    if (eventItem) {
      if (bookingData.numberOfPeople < eventItem.minCapacity) {
        errors.push(`Minimum capacity is ${eventItem.minCapacity} people`);
      }

      if (bookingData.numberOfPeople > eventItem.maxCapacity) {
        errors.push(`Maximum capacity is ${eventItem.maxCapacity} people`);
      }

      // Check date availability
      if (bookingData.eventDate) {
        const selectedDate = new Date(bookingData.eventDate);
        const isAvailable = eventItem.availableDates?.some((availableDate) => {
          const available = new Date(availableDate);
          return available.toDateString() === selectedDate.toDateString();
        });

        if (!isAvailable) {
          errors.push('Selected date is not available');
        }
      }

      // Check if date is in the future
      if (bookingData.eventDate) {
        const selectedDate = new Date(bookingData.eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          errors.push('Event date must be in the future');
        }
      }
    }

    return errors;
  }

  /**
   * Calculate deposit amount (10% of total price)
   */
  calculateDepositAmount(price: number): number {
    return price * 0.1;
  }

  /**
   * Format date for API submission
   */
  formatDateForApi(date: string): string {
    const d = new Date(date);
    return d.toISOString();
  }

  /**
   * Get available dates in a readable format
   */
  getFormattedAvailableDates(dates: Date[]): string[] {
    return dates.map((date) => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    });
  }

  /**
   * Check if user is within booking time limits (e.g., not too close to event date)
   */
  isBookingAllowed(eventDate: string, minDaysInAdvance: number = 1): boolean {
    const eventDateObj = new Date(eventDate);
    const today = new Date();
    const diffInDays = Math.ceil(
      (eventDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return diffInDays >= minDaysInAdvance;
  }

  /**
   * Get booking status display text
   */
  getBookingStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending Confirmation';
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  /**
   * Get booking status CSS class
   */
  getBookingStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'text-warning';
      case 'confirmed':
        return 'text-success';
      case 'cancelled':
        return 'text-danger';
      default:
        return 'text-muted';
    }
  }

  /**
   * Private method to get authorization headers
   */
  private getAuthHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (!token) {
      throw new Error('No authentication token found');
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Private method to handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    console.error('BookingFormService Error:', error);

    let errorMessage = 'An unknown error occurred';

    if (error.error) {
      // Server-side error
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      }
    } else if (error.message) {
      // Client-side error
      errorMessage = error.message;
    }

    // Handle specific HTTP status codes
    switch (error.status) {
      case 401:
        errorMessage = 'Please log in to continue';
        // Optionally redirect to login page
        break;
      case 403:
        errorMessage = 'You do not have permission to perform this action';
        break;
      case 404:
        errorMessage = 'The requested service was not found';
        break;
      case 409:
        errorMessage = 'This booking conflicts with an existing booking';
        break;
      case 500:
        errorMessage = 'Server error. Please try again later';
        break;
      case 0:
        errorMessage = 'Network error. Please check your internet connection';
        break;
    }

    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      error: error.error,
    }));
  };
}
