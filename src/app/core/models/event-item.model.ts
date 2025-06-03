export interface EventItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  minCapacity: number;
  maxCapacity: number;
  location: {
    city: string;
    area: string;
  };
  availableDates: Date[];
  supplier: {
    _id: string;
    name: string;
    phone: string;
  };
  images?: string[];
  videos?: string[]; // Add videos array
}
