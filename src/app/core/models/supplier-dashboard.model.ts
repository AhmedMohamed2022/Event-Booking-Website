export interface SupplierDashboardData {
  supplier: {
    id: string;
    name: string;
    phone: string;
    serviceCount: number;
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
  };
  services: Array<{
    _id: string;
    name: string;
  }>;
  bookings: Array<{
    _id: string;
    eventItem: {
      _id: string;
      name: string;
      category: string;
    };
    client: {
      _id: string;
      name: string;
      phone: string;
    };
    eventDate: string;
    numberOfPeople: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    totalPrice: number;
    paidAmount: number;
    createdAt: string;
  }>;
}
