export const PHONE_CONFIG = {
  COUNTRY_CODE: '+962',
  MOBILE_PREFIXES: ['7'],
  OPERATOR_CODES: ['7', '8', '9'], // Zain (77,78,79), Umniah (76,77,78), Orange (75,76,77)
  MIN_LENGTH: 12, // Including +962
  MAX_LENGTH: 12,
  DISPLAY_FORMAT: '+962 7X XXX XXXX',
  ERROR_MESSAGES: {
    INVALID: 'Please enter a valid Jordanian phone number',
    FORMAT: 'Phone number must start with 07 or 7 or +962',
    REQUIRED: 'Phone number is required',
  },
};
