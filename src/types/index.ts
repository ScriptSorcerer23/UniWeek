export type UserRole = 'student' | 'society';
export type SocietyType = 'ACM' | 'CLS' | 'CSS';
export type EventCategory = 'Technical' | 'Cultural' | 'Sports' | 'Workshop' | 'Competition' | 'Seminar' | 'Social' | 'Other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  societyType?: SocietyType;
  registeredEvents: string[];
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  venue: string;
  society: SocietyType;
  category: EventCategory;
  capacity: number;
  registeredStudents: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  timestamp: Date;
  attended: boolean;
  rating?: number;
  feedback?: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  eventId?: string;
  recipientIds: string[];
  sentBy: string;
  sentAt: Date;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole, societyType?: SocietyType) => Promise<void>;
  logout: () => Promise<void>;
}

export interface EventContextType {
  events: Event[];
  loading: boolean;
  fetchEvents: () => Promise<void>;
  createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registeredStudents'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  registerForEvent: (eventId: string) => Promise<void>;
  unregisterFromEvent: (eventId: string) => Promise<void>;
}
