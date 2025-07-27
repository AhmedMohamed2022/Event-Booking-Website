// src/app/environments/environment.prod.ts
export const environmentProd = {
  production: true,
  apiUrl:
    'https://37484aa9-9060-4a7d-985b-fdc8099f1d8c-00-3joc8gi3d72c5.spock.replit.dev/',
  // 'https://https://event-booking-backend-production-0d69.up.railway.app/api',
  appName: 'Event Booking Platform',
  version: '1.0.0',

  features: {
    enableOtpAuth: true,
    enableWhatsApp: true,
    enableSocialLogin: true,
    enableAnalytics: true,
  },

  otp: {
    length: 6,
    expiryMinutes: 5,
    resendCooldownSeconds: 60,
  },

  whatsapp: {
    enabled: true,
    provider: 'twilio', // or '360dialog'
    apiKey: process.env['WHATSAPP_API_KEY'] || '',
    fromNumber: process.env['WHATSAPP_FROM_NUMBER'] || '',
  },

  storage: {
    tokenKey: 'auth_token',
    userKey: 'auth_user',
    redirectKey: 'redirect_url',
  },
};
