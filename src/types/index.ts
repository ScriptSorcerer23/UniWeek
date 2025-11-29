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
  coverImageUrl?: string;
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
  userRegisteredEvents: Event[];
  loading: boolean;
  error: string | null;
  
  // Event management
  fetchEvents: (filters?: any) => Promise<void>;
  createEvent: (eventData: any) => Promise<Event>;
  updateEvent: (eventId: string, updates: any) => Promise<Event>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEventById: (eventId: string) => Promise<Event | null>;
  
  // Registration management
  registerForEvent: (eventId: string) => Promise<void>;
  unregisterFromEvent: (eventId: string) => Promise<void>;
  isUserRegistered: (eventId: string) => Promise<boolean>;
  fetchUserRegisteredEvents: () => Promise<void>;
  
  // Filtering and search
  searchEvents: (searchQuery: string) => Promise<Event[]>;
  filterEvents: (filters: any) => Promise<Event[]>;
  
  // Analytics
  getEventAnalytics: (societyType?: SocietyType, userId?: string) => Promise<any>;
  getEventCapacityInfo: (eventId: string) => Promise<any>;
  
  // Feedback
  submitEventFeedback: (eventId: string, rating: number, feedback?: string) => Promise<void>;
  
  // Utility methods
  refreshData: () => Promise<void>;
  clearError: () => void;
}
