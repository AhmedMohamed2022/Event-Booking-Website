// src/app/core/models/admin.model.ts

export interface AdminStats {
  totalUsers: number;
  totalSuppliers: number;
  totalServices: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  topCategories: TopCategory[];
  // Add new fields
  totalContactRequests: number;
  contactOnlySuppliers: number;
  lockedSuppliers: number;
  activeSubscriptions: number;
  contactMessages: number;
}

export interface TopCategory {
  _id: string;
  count: number;
}

export interface JoinRequest {
  _id: string;
  name: string;
  phone: string;
  serviceType?: string;
  city?: string;
  notes?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  phone: string;
  role: 'client' | 'supplier' | 'admin';
  isLocked: boolean;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
}
