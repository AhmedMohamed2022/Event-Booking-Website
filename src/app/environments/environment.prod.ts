// src/app/environments/environment.prod.ts
export const environmentProd = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',
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
