export interface CategoryConfig {
  value: string;
  label: string;
  subcategories: { value: string; label: string; contactOnly?: boolean }[];
  contactOnly?: boolean; // If true, all subcategories are contact-only
}

export const EVENT_CATEGORIES: CategoryConfig[] = [
  {
    value: 'chairs',
    label: 'Chairs',
    subcategories: [{ value: 'general', label: 'General' }],
  },
  {
    value: 'tables',
    label: 'Tables',
    subcategories: [{ value: 'general', label: 'General' }],
  },
  {
    value: 'cars',
    label: 'Cars',
    subcategories: [{ value: 'general', label: 'General' }],
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
  {
    value: 'halls',
    label: 'Halls',
    contactOnly: true,
    subcategories: [{ value: 'general', label: 'General' }],
  },
  {
    value: 'photographers',
    label: 'Photographers',
    subcategories: [{ value: 'general', label: 'General' }],
  },
  {
    value: 'hospitality',
    label: 'Hospitality',
    subcategories: [{ value: 'general', label: 'General' }],
  },
  {
    value: 'matbaqeat',
    label: 'Matbaqeat',
    subcategories: [{ value: 'general', label: 'General' }],
  },
  {
    value: 'flowers',
    label: 'Flowers',
    subcategories: [{ value: 'general', label: 'General' }],
  },
  // Legacy/Existing event types kept to avoid breaking existing data
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

// Some newly introduced top-level categories correspond to legacy subcategories in existing data.
// Use these mappings to search by subcategory for backward compatibility until data migration.
export const CATEGORY_TO_SUBCATEGORY_FALLBACK: { [key: string]: string } = {
  chairs: 'chairs',
  tables: 'tables',
  cars: 'transport',
  halls: 'wedding-halls',
  photographers: 'photography',
  hospitality: 'catering',
  matbaqeat: 'matbaqeat',
  flowers: 'flowers',
};

export const SUBCATEGORY_TO_CATEGORY_ALIAS: { [key: string]: string } = {
  chairs: 'chairs',
  tables: 'tables',
  transport: 'cars',
  'wedding-halls': 'halls',
  photography: 'photographers',
  catering: 'hospitality',
  matbaqeat: 'matbaqeat',
  flowers: 'flowers',
};

// Client-requested main categories list (for UI prominence / top categories computation)
export const CLIENT_MAIN_CATEGORIES: string[] = [
  'chairs',
  'tables',
  'cars',
  'farm',
  'halls',
  'photographers',
  'hospitality',
  'matbaqeat',
  'flowers',
];

// Icon mapping for display on service cards (Font Awesome classes)
const SUBCATEGORY_ICON_MAP: { [key: string]: string } = {
  // direct subcategories
  chairs: 'fas fa-chair',
  tables: 'fas fa-table',
  transport: 'fas fa-car',
  photography: 'fas fa-camera',
  catering: 'fas fa-utensils',
  flowers: 'fas fa-spa',
  'wedding-halls': 'fas fa-building',
  venues: 'fas fa-building',
  'conference-halls': 'fas fa-building',
  'funeral-halls': 'fas fa-building',
  tents: 'fas fa-campground',
  equipment: 'fas fa-tools',
  'audio-equipment': 'fas fa-volume-up',
  'av-equipment': 'fas fa-volume-up',
  decoration: 'fas fa-brush',
  'stage-decoration': 'fas fa-brush',
  entertainment: 'fas fa-music',
  seating: 'fas fa-chair',
  'party-venues': 'fas fa-building',
  'food-beverages': 'fas fa-utensils',
  'corporate-venues': 'fas fa-building',
  'corporate-catering': 'fas fa-utensils',
  'memorial-catering': 'fas fa-utensils',
  'funeral-flowers': 'fas fa-spa',
  'farm-venues': 'fas fa-seedling',
  'outdoor-events': 'fas fa-seedling',
  'farm-catering': 'fas fa-utensils',
  'farm-decoration': 'fas fa-brush',
  'farm-photography': 'fas fa-camera',
  matbaqeat: 'fas fa-concierge-bell',
};

const CATEGORY_ICON_MAP: { [key: string]: string } = {
  // client new categories
  chairs: 'fas fa-chair',
  tables: 'fas fa-table',
  cars: 'fas fa-car',
  farm: 'fas fa-seedling',
  halls: 'fas fa-building',
  photographers: 'fas fa-camera',
  hospitality: 'fas fa-utensils',
  matbaqeat: 'fas fa-concierge-bell',
  flowers: 'fas fa-spa',
  // legacy event types
  wedding: 'fas fa-ring',
  engagement: 'fas fa-heart',
  conference: 'fas fa-microphone',
  birthday: 'fas fa-birthday-cake',
  corporate: 'fas fa-briefcase',
  graduation: 'fas fa-graduation-cap',
  funeral: 'fas fa-dove',
};

export function getServiceIconClass(
  category?: string,
  subcategory?: string
): string {
  if (subcategory && SUBCATEGORY_ICON_MAP[subcategory])
    return SUBCATEGORY_ICON_MAP[subcategory];
  if (category && CATEGORY_ICON_MAP[category])
    return CATEGORY_ICON_MAP[category];
  // try aliasing subcategory to category
  if (subcategory && SUBCATEGORY_TO_CATEGORY_ALIAS[subcategory]) {
    const alias = SUBCATEGORY_TO_CATEGORY_ALIAS[subcategory];
    if (CATEGORY_ICON_MAP[alias]) return CATEGORY_ICON_MAP[alias];
  }
  // default
  return 'fas fa-tag';
}
