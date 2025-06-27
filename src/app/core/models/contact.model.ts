export interface ContactMessage {
  _id: string; // Optional for new messages
  name: string;
  email: string;
  message: string;
  createdAt?: string; // Optional for new messages
  status: 'pending' | 'read'; // Optional for new messages
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

// Client and Service interfaces for populated objects
export interface ContactClient {
  _id: string;
  name: string;
  phone: string;
}

export interface ContactService {
  _id: string;
  name: string;
  category: string;
}

// New interfaces for contact requests
export interface ContactRequest {
  _id?: string;
  client: string | ContactClient;
  supplier: string;
  service: string | ContactService;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactRequestResponse {
  success: boolean;
  message: string;
  contactRequest?: ContactRequest;
}

export interface ContactLimitInfo {
  currentContacts: number;
  maxContacts: number;
  isLocked: boolean;
  lockReason?: string;
  hasWarning: boolean;
  warningType?: 'near-limit' | 'locked';
  usagePercentage: number;
}
