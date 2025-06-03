// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  AuthState,
} from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000/api';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null,
  });

  public authState$ = this.authStateSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.updateAuthState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null,
        });
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  private updateAuthState(newState: Partial<AuthState>): void {
    const currentState = this.authStateSubject.value;
    this.authStateSubject.next({ ...currentState, ...newState });
  }

  private setLoading(loading: boolean): void {
    this.updateAuthState({ loading });
  }

  private setError(error: string | null): void {
    this.updateAuthState({ error, loading: false });
  }

  private getHttpOptions(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  }

  // OTP Methods
  sendOtp(request: OtpSendRequest): Observable<OtpSendResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .post<OtpSendResponse>(
        `${this.API_URL}/auth/send-otp`,
        request,
        this.getHttpOptions()
      )
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => {
          this.setError(error.error?.message || 'Failed to send OTP');
          return throwError(() => error);
        })
      );
  }

  verifyOtp(request: OtpVerifyRequest): Observable<OtpVerifyResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .post<OtpVerifyResponse>(
        `${this.API_URL}/auth/verify-otp`,
        request,
        this.getHttpOptions()
      )
      .pipe(
        tap((response) => {
          this.handleAuthSuccess(response);
        }),
        catchError((error) => {
          this.setError(error.error?.message || 'Invalid OTP');
          return throwError(() => error);
        })
      );
  }

  // Traditional Auth Methods (for backward compatibility)
  login(request: LoginRequest): Observable<LoginResponse> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .post<LoginResponse>(
        `${this.API_URL}/auth/login`,
        request,
        this.getHttpOptions()
      )
      .pipe(
        tap((response) => {
          this.handleAuthSuccess(response);
        }),
        catchError((error) => {
          this.setError(error.error?.message || 'Login failed');
          return throwError(() => error);
        })
      );
  }

  register(request: RegisterRequest): Observable<{ message: string }> {
    this.setLoading(true);
    this.setError(null);

    return this.http
      .post<{ message: string }>(
        `${this.API_URL}/auth/register`,
        request,
        this.getHttpOptions()
      )
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => {
          this.setError(error.error?.message || 'Registration failed');
          return throwError(() => error);
        })
      );
  }

  private handleAuthSuccess(response: LoginResponse | OtpVerifyResponse): void {
    const { token, user } = response;

    // Store in localStorage
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    // Update auth state
    this.updateAuthState({
      isAuthenticated: true,
      user: user as User,
      token,
      loading: false,
      error: null,
    });
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/']);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    });
  }

  // Utility Methods
  getToken(): string | null {
    return this.authStateSubject.value.token;
  }

  getCurrentUser(): User | null {
    return this.authStateSubject.value.user;
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  isSupplier(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'supplier';
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  // Helper method for route redirection
  redirectAfterAuth(defaultRoute: string = '/'): void {
    // Check if there's a stored redirect URL
    const redirectUrl = sessionStorage.getItem('redirect_url');

    if (redirectUrl) {
      sessionStorage.removeItem('redirect_url');
      this.router.navigateByUrl(redirectUrl);
    } else if (this.isSupplier()) {
      this.router.navigate(['/supplier-dashboard']);
    } else {
      this.router.navigate([defaultRoute]);
    }
  }

  // Store redirect URL for after login
  setRedirectUrl(url: string): void {
    sessionStorage.setItem('redirect_url', url);
  }
}
