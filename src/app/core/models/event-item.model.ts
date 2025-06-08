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
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  availableDates: Date[];
  supplier: {
    _id: string;
    name: string;
    phone: string;
  };
  images?: string[];
  videos?: string[];
}

export interface CreateEventItemRequest {
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  location: {
    city?: string;
    area?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
  availableDates?: string[];
  minCapacity?: number;
  maxCapacity?: number;
}

export interface UpdateEventItemRequest
  extends Partial<CreateEventItemRequest> {
  images?: string[];
  videos?: string[];
}
