export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

export interface EventResponse {
  id: string;
  title: string;
  description?: string;
  date: Date;
  location: string;
  capacity: number;
  price?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketResponse {
  id: string;
  eventId: string;
  userId: string;
  quantity: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';
  ticketCode: string;
  purchasedAt: Date;
  checkedInAt?: Date;
  createdAt: Date;
}
