export class PhoneUtils {
  /**
   * Masks a phone number for security display
   * Shows only first 3 and last 2 digits
   * Example: 0791234567 -> 079*****67
   */
  static maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 5) return phone;

    const firstThree = phone.substring(0, 3);
    const lastTwo = phone.substring(phone.length - 2);
    const maskedLength = phone.length - 5;
    const maskedPart = '*'.repeat(maskedLength);

    return `${firstThree}${maskedPart}${lastTwo}`;
  }

  /**
   * Formats phone number for display with country code
   * Example: 0791234567 -> +962 79 123 4567
   */
  static formatPhoneNumber(
    phone: string,
    countryCode: string = '+962'
  ): string {
    if (!phone) return '';

    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length === 10 && cleanPhone.startsWith('79')) {
      // Jordan mobile number format
      return `${countryCode} ${cleanPhone.substring(
        0,
        2
      )} ${cleanPhone.substring(2, 5)} ${cleanPhone.substring(
        5,
        7
      )} ${cleanPhone.substring(7)}`;
    }

    return phone;
  }

  /**
   * Creates a clickable phone link for mobile devices
   * Returns masked number for display, but full number for tel: link
   */
  static createPhoneLink(phone: string): { display: string; link: string } {
    return {
      display: this.maskPhoneNumber(phone),
      link: `tel:${phone}`,
    };
  }

  /**
   * Checks if a phone number is valid Jordan mobile number
   */
  static isValidJordanMobile(phone: string): boolean {
    if (!phone) return false;

    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10 && cleanPhone.startsWith('79');
  }
}
