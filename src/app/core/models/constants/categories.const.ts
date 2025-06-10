export interface CategoryConfig {
  value: string;
  label: string;
  subcategories: { value: string; label: string }[];
}

export const EVENT_CATEGORIES: CategoryConfig[] = [
  {
    value: 'wedding',
    label: 'Wedding',
    subcategories: [
      { value: 'wedding-halls', label: 'Wedding Halls' },
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
      { value: 'venues', label: 'Venues & Halls' },
      { value: 'catering', label: 'Catering Services' },
      { value: 'decoration', label: 'Decoration' },
      { value: 'photography', label: 'Photography' },
    ],
  },
  {
    value: 'conference',
    label: 'Conference',
    subcategories: [
      { value: 'conference-halls', label: 'Conference Halls' },
      { value: 'audio-equipment', label: 'Audio Equipment' },
      { value: 'catering', label: 'Catering Services' },
      { value: 'photography', label: 'Photography & Documentation' },
    ],
  },
  {
    value: 'birthday',
    label: 'Birthday',
    subcategories: [
      { value: 'venues', label: 'Party Venues' },
      { value: 'catering', label: 'Food & Beverages' },
      { value: 'decoration', label: 'Party Decoration' },
      { value: 'entertainment', label: 'Entertainment' },
    ],
  },
  {
    value: 'corporate',
    label: 'Corporate Event',
    subcategories: [
      { value: 'venues', label: 'Corporate Venues' },
      { value: 'equipment', label: 'Audio/Visual Equipment' },
      { value: 'catering', label: 'Corporate Catering' },
      { value: 'decoration', label: 'Stage & Decoration' },
    ],
  },
  {
    value: 'graduation',
    label: 'Graduation',
    subcategories: [
      { value: 'venues', label: 'Graduation Venues' },
      { value: 'photography', label: 'Photography & Video' },
      { value: 'catering', label: 'Catering Services' },
      { value: 'decoration', label: 'Decoration' },
    ],
  },
  {
    value: 'funeral',
    label: 'Funeral',
    subcategories: [
      { value: 'funeral-halls', label: 'Funeral Halls' },
      { value: 'catering', label: 'Memorial Catering' },
      { value: 'flowers', label: 'Funeral Flowers & Wreaths' },
      { value: 'chairs', label: 'Seating Arrangements' },
      { value: 'tents', label: 'Memorial Tents' },
      { value: 'transport', label: 'Transportation Services' },
    ],
  },
];
