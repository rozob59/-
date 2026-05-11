import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  joinedAt: Date | Timestamp;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  available: boolean;
  description?: string;
  coverURL?: string;
  category?: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  memberId: string;
  borrowDate: Date | Timestamp;
  dueDate: Date | Timestamp;
  returnDate?: Date | Timestamp;
  status: 'active' | 'returned';
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: Date | Timestamp;
  read: boolean;
}
