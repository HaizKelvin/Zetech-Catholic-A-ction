import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL?: string;
  bio?: string;
  role: UserRole;
  createdAt: Timestamp;
}

export interface Resource {
  id: string;
  title: string;
  category: 'Hymn' | 'Sheet Music' | 'Liturgical Guide' | 'Audio';
  content?: string;
  fileUrl?: string;
  uploadedBy: string;
  createdAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Timestamp;
}

export interface PrayerPetition {
  id: string;
  userId: string;
  userName: string;
  text: string;
  isPublic: boolean;
  timestamp: Timestamp;
}

export interface Event {
  id: string;
  title: string;
  date: Timestamp;
  location: string;
  description: string;
  createdAt: Timestamp;
}

export interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  purpose: string;
  transactionId?: string;
  status: 'pending' | 'verified';
  timestamp: Timestamp;
}

export interface Trivia {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

export interface DailyControl {
  verse: string;
  reference: string;
  saintName: string;
  saintInfo: string;
  updatedAt: Timestamp;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
