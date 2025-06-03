// src/app/core/models/auth.models.ts

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'client' | 'supplier' | 'admin';
  isLocked: boolean;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  phone: string;
  password: string;
  role?: 'client' | 'supplier';
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export interface OtpSendRequest {
  phone: string;
  action: 'login' | 'register';
  name?: string; // Required for register
}

export interface OtpSendResponse {
  message: string;
  success: boolean;
  otpId?: string; // For tracking the OTP session
}

export interface OtpVerifyRequest {
  phone: string;
  otp: string;
  action: 'login' | 'register';
  name?: string; // Required for register
  otpId?: string;
}

export interface OtpVerifyResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  message: string;
  isNewUser?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
