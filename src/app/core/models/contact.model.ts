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
