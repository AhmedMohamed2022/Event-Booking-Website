export interface CategoryConfig {
  value: string;
  label: string;
  subcategories: { value: string; label: string }[];
}

export const EVENT_CATEGORIES: CategoryConfig[] = [
  {
    value: 'venues',
    label: 'Venues & Halls',
    subcategories: [
      { value: 'wedding-halls', label: 'Wedding Halls' },
      { value: 'conference-rooms', label: 'Conference Rooms' },
      { value: 'outdoor-venues', label: 'Outdoor Venues' },
      { value: 'hotels', label: 'Hotels' },
    ],
  },
  {
    value: 'catering',
    label: 'Catering Services',
    subcategories: [
      { value: 'buffet', label: 'Buffet Service' },
      { value: 'food-stations', label: 'Food Stations' },
      { value: 'beverages', label: 'Beverages' },
      { value: 'desserts', label: 'Desserts & Cakes' },
    ],
  },
  {
    value: 'decoration',
    label: 'Decoration',
    subcategories: [
      { value: 'floral', label: 'Floral Decoration' },
      { value: 'lighting', label: 'Lighting' },
      { value: 'stage', label: 'Stage Decoration' },
      { value: 'balloons', label: 'Balloon Decoration' },
    ],
  },
  {
    value: 'entertainment',
    label: 'Entertainment',
    subcategories: [
      { value: 'dj', label: 'DJ Services' },
      { value: 'live-music', label: 'Live Music' },
      { value: 'performers', label: 'Performers' },
    ],
  },
  {
    value: 'photography',
    label: 'Photography & Video',
    subcategories: [
      { value: 'photo', label: 'Photography' },
      { value: 'video', label: 'Videography' },
      { value: 'drone', label: 'Drone Coverage' },
    ],
  },
  {
    value: 'equipment',
    label: 'Equipment Rental',
    subcategories: [
      { value: 'chairs', label: 'Chairs & Tables' },
      { value: 'audio', label: 'Audio Equipment' },
      { value: 'lighting-eq', label: 'Lighting Equipment' },
      { value: 'tents', label: 'Tents & Canopies' },
    ],
  },
];

export const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'conference', label: 'Conference' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'social', label: 'Social Gathering' },
];
