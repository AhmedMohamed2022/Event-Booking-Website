import { Injectable } from '@angular/core';
import { PHONE_CONFIG } from '../constants/phone.constants';

@Injectable({
  providedIn: 'root',
})
export class PhoneService {
  constructor() {}

  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Handle different formats
    if (cleaned.startsWith('07')) {
      cleaned = '+962' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '+962' + cleaned;
    } else if (!cleaned.startsWith('+962')) {
      throw new Error(PHONE_CONFIG.ERROR_MESSAGES.FORMAT);
    }

    return cleaned;
  }

  validatePhoneNumber(phone: string): boolean {
    const regex = /^\+962[7][7-9]\d{7}$/;
    return regex.test(phone);
  }

  formatForDisplay(phone: string): string {
    // Format: +962 7X XXX XXXX
    if (!this.validatePhoneNumber(phone)) return phone;

    const cleaned = phone.substring(4); // Remove +962
    return `+962 ${cleaned.substring(0, 1)} ${cleaned.substring(
      1,
      4
    )} ${cleaned.substring(4)}`;
  }

  parsePhoneNumber(phone: string): {
    countryCode: string;
    operatorCode: string;
    number: string;
  } {
    const cleaned = this.formatPhoneNumber(phone);
    return {
      countryCode: cleaned.substring(0, 4),
      operatorCode: cleaned.substring(4, 5),
      number: cleaned.substring(5),
    };
  }
}
