// src/app/core/models/booking.interface.ts

export interface Booking {
  _id: string;
  eventItem: {
    _id: string;
    name: string;
    images: string[];
    location: string;
    category: string;
  };
  eventDate: string;
  numberOfPeople: number;
  totalPrice: number;
  paidAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  supplier: {
    _id: string;
    name: string;
  };
}

export interface CancelBookingResponse {
  message: string;
}
