export interface CategoryConfig {
  value: string;
  label: string;
  subcategories: { value: string; label: string; contactOnly?: boolean }[];
  contactOnly?: boolean; // If true, all subcategories are contact-only
}

export const EVENT_CATEGORIES: CategoryConfig[] = [
  {
    value: 'wedding',
    label: 'Wedding',
    subcategories: [
      { value: 'wedding-halls', label: 'Wedding Halls', contactOnly: true },
      { value: 'catering', label: 'Catering Services' },
      { value: 'decoration', label: 'Decoration' },
      { value: 'photography', label: 'Photography & Video' },
      { value: 'entertainment', label: 'Entertainment' },
      { value: 'equipment', label: 'Equipment Rental' },
      { value: 'chairs', label: 'Chairs & Seating' },
      { value: 'flowers', label: 'Flowers & Bouquets' },
      { value: 'tables', label: 'Tables & Settings' },
    ],
  },
  {
    value: 'engagement',
    label: 'Engagement',
    subcategories: [
      { value: 'venues', label: 'Venues & Halls', contactOnly: true },
      { value: 'catering', label: 'Catering Services' },
      { value: 'decoration', label: 'Decoration' },
      { value: 'photography', label: 'Photography' },
    ],
  },
  {
    value: 'conference',
    label: 'Conference',
    subcategories: [
      {
        value: 'conference-halls',
        label: 'Conference Halls',
        contactOnly: true,
      },
      { value: 'audio-equipment', label: 'Audio Equipment' },
      { value: 'catering', label: 'Catering Services' },
      { value: 'photography', label: 'Photography & Documentation' },
    ],
  },
  {
    value: 'birthday',
    label: 'Birthday',
    subcategories: [
      { value: 'venues', label: 'Party Venues', contactOnly: true },
      { value: 'catering', label: 'Food & Beverages' },
      { value: 'decoration', label: 'Party Decoration' },
      { value: 'entertainment', label: 'Entertainment' },
    ],
  },
  {
    value: 'corporate',
    label: 'Corporate Event',
    subcategories: [
      { value: 'venues', label: 'Corporate Venues', contactOnly: true },
      { value: 'equipment', label: 'Audio/Visual Equipment' },
      { value: 'catering', label: 'Corporate Catering' },
      { value: 'decoration', label: 'Stage & Decoration' },
    ],
  },
  {
    value: 'graduation',
    label: 'Graduation',
    subcategories: [
      { value: 'venues', label: 'Graduation Venues', contactOnly: true },
      { value: 'photography', label: 'Photography & Video' },
      { value: 'catering', label: 'Catering Services' },
      { value: 'decoration', label: 'Decoration' },
    ],
  },
  {
    value: 'funeral',
    label: 'Funeral',
    subcategories: [
      { value: 'funeral-halls', label: 'Funeral Halls', contactOnly: true },
      { value: 'catering', label: 'Memorial Catering' },
      { value: 'flowers', label: 'Funeral Flowers & Wreaths' },
      { value: 'chairs', label: 'Seating Arrangements' },
      { value: 'tents', label: 'Memorial Tents', contactOnly: true },
      { value: 'transport', label: 'Transportation Services' },
    ],
  },
  {
    value: 'farm',
    label: 'Farm & Outdoor',
    contactOnly: true, // All farm services are contact-only
    subcategories: [
      { value: 'farm-venues', label: 'Farm Venues', contactOnly: true },
      { value: 'outdoor-events', label: 'Outdoor Events', contactOnly: true },
      { value: 'farm-catering', label: 'Farm Catering' },
      { value: 'farm-decoration', label: 'Farm Decoration' },
      { value: 'farm-photography', label: 'Farm Photography' },
    ],
  },
];

// Helper function to check if a service should be contact-only
export function isContactOnlyService(
  category: string,
  subcategory?: string
): boolean {
  const categoryConfig = EVENT_CATEGORIES.find((c) => c.value === category);

  if (!categoryConfig) return false;

  // If the entire category is contact-only
  if (categoryConfig.contactOnly) return true;

  // If subcategory is specified, check if it's contact-only
  if (subcategory) {
    const subcategoryConfig = categoryConfig.subcategories.find(
      (s) => s.value === subcategory
    );
    return subcategoryConfig?.contactOnly || false;
  }

  return false;
}

// List of contact-only subcategories for easy reference
export const CONTACT_ONLY_SUBCATEGORIES = [
  'wedding-halls',
  'venues',
  'conference-halls',
  'funeral-halls',
  'tents',
];

// List of contact-only categories (entire categories)
export const CONTACT_ONLY_CATEGORIES = [
  'farm', // Farm category is entirely contact-only
];
