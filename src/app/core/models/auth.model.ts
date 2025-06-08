export interface User {
  id: string;
  name: string;
  role: 'client' | 'supplier' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: User;
}
