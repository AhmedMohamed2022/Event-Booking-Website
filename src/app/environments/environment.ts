// src/app/environments/environment.ts

export const environment = {
  production: true,
  // apiUrl: 'https://event-booking-backend-production-0d69.up.railway.app/api',
  apiUrl:
    'https://37484aa9-9060-4a7d-985b-fdc8099f1d8c-00-3joc8gi3d72c5.spock.replit.dev/',
  // apiUrl: 'http://localhost:5000/api', // Local development API URL
  appName: 'Event Booking Platform',
  version: '1.0.0',

  // Feature flags
  features: {
    enableOtpAuth: true,
    enableWhatsApp: true,
    enableSocialLogin: false,
    enableAnalytics: false,
  },

  // OTP Configuration
  otp: {
    length: 6,
    expiryMinutes: 5,
    resendCooldownSeconds: 60,
  },

  // WhatsApp Configuration
  whatsapp: {
    enabled: true,
    provider: 'mock', // 'twilio' | '360dialog' | 'mock'
    apiKey: '', // Add your WhatsApp API key
    fromNumber: '+962XXXXXXXXX', // Your WhatsApp business number
  },

  // Storage keys
  storage: {
    tokenKey: 'auth_token',
    userKey: 'auth_user',
    redirectKey: 'redirect_url',
  },
};
