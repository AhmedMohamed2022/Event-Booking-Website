export interface JoinRequest {
  name: string;
  phone: string;
  city: string;
  serviceType: string;
  notes?: string;
}

export interface JoinResponse {
  message: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type JoinStatus = 'pending' | 'approved' | 'rejected';
