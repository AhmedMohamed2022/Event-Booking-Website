// Should update frontend model to match backend
export interface SupplierSubscription {
  _id: string;
  supplier: string; // Missing
  plan: 'basic' | 'premium'; // Named 'type' in frontend
  startDate: string;
  endDate: string; // Named 'expiryDate' in frontend
  status: 'active' | 'expired' | 'cancelled'; // Different enum values
  paymentId?: string; // Missing
  amount?: number; // Missing
  createdAt?: string; // Missing
  updatedAt?: string; // Missing
}

export interface SubscriptionStats {
  isLocked: boolean;
  lockReason?: string;
  lockExpiryDate?: string;
  usagePercentage: number;
  daysUntilExpiry: number;
  hasWarning: boolean;
  warningType?: 'near-limit' | 'expiring' | 'locked';
}
