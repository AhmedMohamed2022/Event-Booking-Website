import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse, User } from '../../core/models/auth.model';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Form data
  phone: string = '';
  otp: string = '';
  name: string = '';

  // UI state
  currentStep: 'phone' | 'otp' = 'phone';
  isLoading: boolean = false;
  error: string = '';
  success: string = '';
  isNewUser: boolean = false;
  returnUrl: string = '';

  ngOnInit() {
    // Get return URL from route params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    // Store return URL in auth service
    if (this.returnUrl) {
      this.authService.setRedirectUrl(this.returnUrl);
    }

    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectUser();
    }
  }

  async sendOTP() {
    // Name validation remains the same
    if (!this.name.trim() || this.name.trim().length < 2) {
      this.error = 'Please enter your full name (minimum 2 characters)';
      return;
    }

    if (!this.phone.trim()) {
      this.error = 'Please enter your phone number';
      return;
    }

    // Updated Jordan phone number validation
    const jordanPhoneRegex = /^(\+962|962|0)?7[789]\d{7}$/;
    if (!jordanPhoneRegex.test(this.phone.replace(/[\s\-\(\)]/g, ''))) {
      this.error = 'Please enter a valid Jordanian phone number';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.success = '';

    try {
      // Clean phone number before sending to API
      const cleanPhone = this.phone.replace(/[\s\-\(\)]/g, '');
      await this.authService.sendOTP(cleanPhone, this.name.trim());
      this.success = 'OTP sent successfully via WhatsApp!';
      this.currentStep = 'otp';

      setTimeout(() => {
        this.success = '';
      }, 3000);
    } catch (error: any) {
      this.error = error.message || 'Failed to send OTP. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async verifyOTP() {
    // Remove the isNewUser check since name is already collected
    if (!this.otp.trim()) {
      this.error = 'Please enter the OTP';
      return;
    }

    if (this.otp.trim().length !== 6) {
      this.error = 'OTP must be 6 digits';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      const response: AuthResponse = await this.authService.verifyOTP(
        this.phone.trim(),
        this.otp.trim(),
        this.name.trim() // Always send the name
      );

      // Store JWT and user info
      this.authService.setToken(response.token);
      this.authService.setUser(response.user);

      this.success = 'Login successful! Redirecting...';

      // Redirect after short delay
      setTimeout(() => {
        this.redirectUser(response.user);
      }, 1000);
    } catch (error: any) {
      this.error = error.message || 'Invalid OTP. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private redirectUser(user?: User) {
    const currentUser = user || this.authService.getCurrentUser();
    const savedReturnUrl = this.authService.getRedirectUrl();

    if (!currentUser) {
      this.router.navigate(['/']);
      return;
    }

    // Handle role-based redirects
    switch (currentUser.role) {
      case 'admin':
        this.router.navigate(['/admin-dashboard']);
        break;
      case 'supplier':
        this.router.navigate(['/supplier-dashboard']);
        break;
      default:
        if (savedReturnUrl) {
          this.authService.clearRedirectUrl();
          this.router.navigateByUrl(savedReturnUrl);
        } else {
          this.router.navigate(['/']);
        }
    }
  }

  goBack() {
    this.currentStep = 'phone';
    this.otp = '';
    this.name = '';
    this.error = '';
    this.success = '';
    this.isNewUser = false;
  }

  clearError() {
    this.error = '';
  }

  formatPhoneNumber() {
    // Remove all non-digit characters
    let value = this.phone.replace(/\D/g, '');

    // Remove leading zeros or country code
    if (value.startsWith('962')) {
      value = value.substring(3);
    } else if (value.startsWith('0')) {
      value = value.substring(1);
    }

    // Ensure maximum length of 9 digits for Jordan numbers
    if (value.length > 9) {
      value = value.substring(0, 9);
    }

    // Format as (07X) XXX-XXXX
    if (value.length > 0) {
      this.phone =
        value.length <= 3
          ? `(${value})`
          : value.length <= 6
          ? `(${value.substring(0, 3)}) ${value.substring(3)}`
          : `(${value.substring(0, 3)}) ${value.substring(
              3,
              6
            )}-${value.substring(6)}`;
    }
  }
}
