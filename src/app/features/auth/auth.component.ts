// src/app/features/auth/auth.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import {
  OtpSendRequest,
  OtpVerifyRequest,
  AuthState,
} from '../../core/models/auth.model';

type AuthStep = 'phone' | 'otp' | 'register';
type AuthAction = 'login' | 'register';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Component State
  currentStep: AuthStep = 'phone';
  authAction: AuthAction = 'login';

  // Form Data
  phoneNumber: string = '';
  otp: string = '';
  userName: string = '';

  // UI State
  isLoading: boolean = false;
  error: string = '';
  successMessage: string = '';
  otpSent: boolean = false;
  countdown: number = 0;
  canResend: boolean = true;

  // OTP Session
  private otpId: string = '';
  private countdownInterval: any;

  // Phone validation
  readonly phonePattern = /^(\+962|0)?(7[789])\d{7}$/;
  readonly jordanianCities = [
    'Amman',
    'Irbid',
    'Zarqa',
    'Aqaba',
    'Salt',
    'Madaba',
    'Karak',
    'Tafilah',
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subscribeToAuthState();
    this.checkRedirectUrl();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCountdown();
  }

  private subscribeToAuthState(): void {
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: AuthState) => {
        this.isLoading = state.loading;
        this.error = state.error || '';

        if (state.isAuthenticated) {
          this.handleAuthSuccess();
        }
      });
  }

  private checkRedirectUrl(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.authService.setRedirectUrl(returnUrl);
    }
  }

  // Toggle between login and register
  toggleAuthAction(): void {
    this.authAction = this.authAction === 'login' ? 'register' : 'login';
    this.resetForm();
  }

  // Phone number formatting
  formatPhoneNumber(): void {
    let cleaned = this.phoneNumber.replace(/\D/g, '');

    if (cleaned.startsWith('962')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('07')) {
      cleaned = '+962' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '+9627' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+962') && cleaned.length === 10) {
      cleaned = '+962' + cleaned;
    }

    this.phoneNumber = cleaned;
  }

  // Validate phone number
  isPhoneValid(): boolean {
    // Remove any spaces or special characters except + sign
    const cleanPhone = this.phoneNumber.trim().replace(/[^\d+]/g, '');

    // Check if the number matches either format
    if (cleanPhone.startsWith('+962')) {
      // For +962 format, should be exactly 13 chars (+962 7xx xxx xxx)
      return (
        cleanPhone.length === 13 && /^\+962(7[789])\d{7}$/.test(cleanPhone)
      );
    } else if (cleanPhone.startsWith('07')) {
      // For 07 format, should be exactly 10 chars (07xx xxx xxx)
      return cleanPhone.length === 10 && /^07[789]\d{7}$/.test(cleanPhone);
    } else if (cleanPhone.startsWith('7')) {
      // For 7 format, should be exactly 9 chars (7xx xxx xxx)
      return cleanPhone.length === 9 && /^7[789]\d{7}$/.test(cleanPhone);
    }

    return false;
  }

  // Validate OTP
  isOtpValid(): boolean {
    return this.otp.length === 6 && /^\d{6}$/.test(this.otp);
  }

  // Validate user name
  isNameValid(): boolean {
    return this.userName.trim().length >= 2;
  }

  // Send OTP
  async onSendOtp(form: NgForm): Promise<void> {
    if (!form.valid || !this.isPhoneValid()) {
      this.error = 'Please enter a valid Jordanian phone number';
      return;
    }

    this.formatPhoneNumber();
    this.clearMessages();

    const request: OtpSendRequest = {
      phone: this.phoneNumber,
      action: this.authAction,
      ...(this.authAction === 'register' && { name: this.userName }),
    };

    try {
      const response = await this.authService.sendOtp(request).toPromise();

      if (response?.success) {
        this.otpId = response.otpId || '';
        this.successMessage = 'OTP sent via WhatsApp successfully!';
        this.currentStep = 'otp';
        this.otpSent = true;
        this.startCountdown();
      }
    } catch (error: any) {
      this.error =
        error.error?.message || 'Failed to send OTP. Please try again.';
    }
  }

  // Verify OTP
  async onVerifyOtp(form: NgForm): Promise<void> {
    if (!form.valid || !this.isOtpValid()) {
      this.error = 'Please enter a valid 6-digit OTP';
      return;
    }

    this.clearMessages();

    const request: OtpVerifyRequest = {
      phone: this.phoneNumber,
      otp: this.otp,
      action: this.authAction,
      otpId: this.otpId,
      ...(this.authAction === 'register' && { name: this.userName }),
    };

    try {
      const response = await this.authService.verifyOtp(request).toPromise();

      if (response?.token) {
        this.successMessage =
          this.authAction === 'register'
            ? 'Account created successfully!'
            : 'Login successful!';
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Invalid OTP. Please try again.';
    }
  }

  // Handle successful authentication
  private handleAuthSuccess(): void {
    setTimeout(() => {
      this.authService.redirectAfterAuth('/');
    }, 1000);
  }

  // Resend OTP
  async onResendOtp(): Promise<void> {
    if (!this.canResend) return;

    const request: OtpSendRequest = {
      phone: this.phoneNumber,
      action: this.authAction,
      ...(this.authAction === 'register' && { name: this.userName }),
    };

    try {
      const response = await this.authService.sendOtp(request).toPromise();

      if (response?.success) {
        this.otpId = response.otpId || '';
        this.successMessage = 'New OTP sent successfully!';
        this.startCountdown();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to resend OTP';
    }
  }

  // Countdown timer
  private startCountdown(): void {
    this.countdown = 60;
    this.canResend = false;

    this.countdownInterval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        this.canResend = true;
        this.clearCountdown();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  // Navigation methods
  goBackToPhone(): void {
    this.currentStep = 'phone';
    this.clearMessages();
    this.clearCountdown();
  }

  goToRegister(): void {
    this.currentStep = 'register';
    this.authAction = 'register';
    this.clearMessages();
  }

  // Utility methods
  private resetForm(): void {
    this.phoneNumber = '';
    this.otp = '';
    this.userName = '';
    this.currentStep = 'phone';
    this.clearMessages();
    this.clearCountdown();
  }

  private clearMessages(): void {
    this.error = '';
    this.successMessage = '';
  }

  // Getters for template
  get showPhoneStep(): boolean {
    return this.currentStep === 'phone';
  }

  get showOtpStep(): boolean {
    return this.currentStep === 'otp';
  }

  get showRegisterStep(): boolean {
    return this.currentStep === 'register';
  }

  get isLoginMode(): boolean {
    return this.authAction === 'login';
  }

  get pageTitle(): string {
    return this.isLoginMode ? 'Login to Your Account' : 'Create New Account';
  }

  get submitButtonText(): string {
    if (this.currentStep === 'phone') {
      return 'Send OTP via WhatsApp';
    }
    return this.isLoginMode ? 'Login' : 'Create Account';
  }
}
