import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface User {
  id: string;
  name: string;
  role: 'client' | 'supplier' | 'admin';
}

interface AuthResponse {
  token: string;
  user: User;
}

interface SendOTPResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_BASE = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly REDIRECT_URL_KEY = 'auth_redirect_url';

  // Reactive state management
  private currentUserSubject = new BehaviorSubject<User | null>(
    this.getUserFromStorage()
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Initialize user state on service creation
    this.initializeUserState();
  }

  /**
   * Initialize user state from localStorage
   */
  private initializeUserState(): void {
    const user = this.getUserFromStorage();
    const token = this.getTokenFromStorage();

    if (user && token) {
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phone: string, name: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<SendOTPResponse>(`${this.API_BASE}/auth/send-otp`, {
          phone,
          name, // Include name in the request
        })
      );

      if (!response.message) {
        throw new Error('Failed to send OTP');
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Verify OTP and authenticate user
   */
  async verifyOTP(
    phone: string,
    otp: string,
    name?: string
  ): Promise<AuthResponse> {
    try {
      const payload = { phone, otp, name };

      const response = await firstValueFrom(
        this.http.post<AuthResponse>(
          `${this.API_BASE}/auth/verify-otp`,
          payload
        )
      );

      if (!response.token || !response.user) {
        throw new Error('Invalid response from server');
      }

      // Store authentication data
      this.setToken(response.token);
      this.setUser(response.user);

      return response;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Store JWT token
   */
  setToken(token: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    return this.getTokenFromStorage();
  }

  /**
   * Store user information
   */
  setUser(user: User): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();

    if (!token || !user) {
      return false;
    }

    // Check if token is expired (basic JWT check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;

      if (payload.exp && payload.exp < currentTime) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user is supplier
   */
  isSupplier(): boolean {
    return this.hasRole('supplier');
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Logout user
   */
  logout(): void {
    // Clear all auth data
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);

    // Clear any stored redirect URLs
    this.clearRedirectUrl();

    // Redirect to home page
    this.router.navigate(['/']);
  }

  /**
   * Refresh user data (could be used to fetch updated user info)
   */
  async refreshUser(): Promise<User | null> {
    // This would typically make an API call to get updated user data
    // For now, return current user from storage
    return this.getCurrentUser();
  }

  /**
   * Get token from localStorage safely
   */
  private getTokenFromStorage(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Get user from localStorage safely
   */
  private getUserFromStorage(): User | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (error) {
          console.warn('Failed to parse user from localStorage:', error);
          localStorage.removeItem(this.USER_KEY);
        }
      }
    }
    return null;
  }

  /**
   * Handle HTTP errors and convert to user-friendly messages
   */
  private handleError(error: any): never {
    let errorMessage = 'An unexpected error occurred';

    if (error instanceof HttpErrorResponse) {
      // Server responded with an error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.status === 0) {
        errorMessage =
          'Unable to connect to server. Please check your internet connection.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 404) {
        errorMessage = 'Service not found. Please contact support.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid request. Please check your input.';
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please try again.';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }

  /**
   * Utility method to redirect based on user role
   */
  redirectAfterLogin(returnUrl?: string): void {
    const user = this.getCurrentUser();

    if (user?.role === 'supplier') {
      this.router.navigate(['/supplier-dashboard']);
    } else if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/']);
    }
  }

  setRedirectUrl(url: string): void {
    if (url) {
      sessionStorage.setItem(this.REDIRECT_URL_KEY, url);
    }
  }

  getRedirectUrl(): string | null {
    return sessionStorage.getItem(this.REDIRECT_URL_KEY);
  }

  clearRedirectUrl(): void {
    sessionStorage.removeItem(this.REDIRECT_URL_KEY);
  }

  canAccessDashboard(role: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    // Check if user has required role
    if (currentUser.role !== role) {
      this.logout(); // Logout if role doesn't match
      return false;
    }

    return true;
  }
}
