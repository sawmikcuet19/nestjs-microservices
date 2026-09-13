export interface IUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ORGANIZER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthUser {
  sub: string;
  email: string;
}
