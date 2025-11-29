import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, EventCategory, SocietyType } from '../types';
import { eventService, EventFilters, CreateEventData, UpdateEventData } from '../services/events';
import { useAuth } from './AuthContext';

interface EventContextType {
  events: Event[];
  userRegisteredEvents: Event[];
  loading: boolean;
  error: string | null;
  
  // Event management
  fetchEvents: (filters?: EventFilters) => Promise<void>;
  createEvent: (eventData: CreateEventData) => Promise<Event>;
  updateEvent: (eventId: string, updates: UpdateEventData) => Promise<Event>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEventById: (eventId: string) => Promise<Event | null>;
  
  // Registration management
  registerForEvent: (eventId: string) => Promise<void>;
  unregisterFromEvent: (eventId: string) => Promise<void>;
  isUserRegistered: (eventId: string) => Promise<boolean>;
  fetchUserRegisteredEvents: () => Promise<void>;
  
  // Filtering and search
  searchEvents: (searchQuery: string) => Promise<Event[]>;
  filterEvents: (filters: EventFilters) => Promise<Event[]>;
  
  // Analytics
  getEventAnalytics: (societyType?: SocietyType, userId?: string) => Promise<any>;
  getEventCapacityInfo: (eventId: string) => Promise<any>;
  
  // Feedback
  submitEventFeedback: (eventId: string, rating: number, feedback?: string) => Promise<void>;
  
  // Utility methods
  refreshData: () => Promise<void>;
  clearError: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [userRegisteredEvents, setUserRegisteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  /**
   * Fetch all events with optional filters
   */
  const fetchEvents = async (filters?: EventFilters) => {
    setLoading(true);
    setError(null);
    try {
      const eventsData = await eventService.getEvents(filters);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create new event (Society handlers only)
   */
  const createEvent = async (eventData: CreateEventData): Promise<Event> => {
    if (!user || user.role !== 'society') {
      throw new Error('Only society handlers can create events');
    }

    setLoading(true);
    setError(null);
    try {
      const newEvent = await eventService.createEvent(eventData, user.id);
      setEvents(prev => [newEvent, ...prev]);
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update existing event (Society handlers only)
   */
  const updateEvent = async (eventId: string, updates: UpdateEventData): Promise<Event> => {
    if (!user || user.role !== 'society') {
      throw new Error('Only society handlers can update events');
    }

    setLoading(true);
    setError(null);
    try {
      const updatedEvent = await eventService.updateEvent(eventId, updates, user.id);
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent : event
      ));
      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete event (Society handlers only)
   */
  const deleteEvent = async (eventId: string): Promise<void> => {
    if (!user || user.role !== 'society') {
      throw new Error('Only society handlers can delete events');
    }

    setLoading(true);
    setError(null);
    try {
      await eventService.deleteEvent(eventId, user.id);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setUserRegisteredEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get single event by ID
   */
  const getEventById = async (eventId: string): Promise<Event | null> => {
    try {
      return await eventService.getEventById(eventId);
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch event');
      return null;
    }
  };

  /**
   * Register user for event
   */
  const registerForEvent = async (eventId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to register for events');
    }

    setLoading(true);
    setError(null);
    try {
      await eventService.registerForEvent(eventId, user.id);
      
      // Update local state
      const event = events.find(e => e.id === eventId);
      if (event) {
        const updatedEvent = {
          ...event,
          registeredStudents: [...event.registeredStudents, user.id],
        };
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
        setUserRegisteredEvents(prev => [...prev, updatedEvent]);
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register for event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Unregister user from event
   */
  const unregisterFromEvent = async (eventId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to unregister from events');
    }

    setLoading(true);
    setError(null);
    try {
      await eventService.unregisterFromEvent(eventId, user.id);
      
      // Update local state
      const event = events.find(e => e.id === eventId);
      if (event) {
        const updatedEvent = {
          ...event,
          registeredStudents: event.registeredStudents.filter(id => id !== user.id),
        };
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
        setUserRegisteredEvents(prev => prev.filter(e => e.id !== eventId));
      }
    } catch (error) {
      console.error('Error unregistering from event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to unregister from event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user is registered for event
   */
  const isUserRegistered = async (eventId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      return await eventService.isUserRegistered(eventId, user.id);
    } catch (error) {
      console.error('Error checking registration status:', error);
      return false;
    }
  };

  /**
   * Fetch user's registered events
   */
  const fetchUserRegisteredEvents = async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    try {
      const registeredEvents = await eventService.getUserRegisteredEvents(user.id);
      setUserRegisteredEvents(registeredEvents);
    } catch (error) {
      console.error('Error fetching user registered events:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch registered events');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search events
   */
  const searchEvents = async (searchQuery: string): Promise<Event[]> => {
    try {
      return await eventService.searchEvents(searchQuery);
    } catch (error) {
      console.error('Error searching events:', error);
      setError(error instanceof Error ? error.message : 'Failed to search events');
      return [];
    }
  };

  /**
   * Filter events
   */
  const filterEvents = async (filters: EventFilters): Promise<Event[]> => {
    try {
      return await eventService.getEvents(filters);
    } catch (error) {
      console.error('Error filtering events:', error);
      setError(error instanceof Error ? error.message : 'Failed to filter events');
      return [];
    }
  };

  /**
   * Get event analytics
   */
  const getEventAnalytics = async (societyType?: SocietyType, userId?: string) => {
    try {
      return await eventService.getEventAnalytics(societyType, userId);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics');
      throw error;
    }
  };

  /**
   * Get event capacity info
   */
  const getEventCapacityInfo = async (eventId: string) => {
    try {
      return await eventService.getEventCapacityInfo(eventId);
    } catch (error) {
      console.error('Error fetching capacity info:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch capacity info');
      throw error;
    }
  };

  /**
   * Submit event feedback
   */
  const submitEventFeedback = async (eventId: string, rating: number, feedback?: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to submit feedback');
    }

    setLoading(true);
    setError(null);
    try {
      await eventService.submitEventFeedback(eventId, user.id, rating, feedback);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh all data
   */
  const refreshData = async (): Promise<void> => {
    await Promise.all([
      fetchEvents(),
      user ? fetchUserRegisteredEvents() : Promise.resolve(),
    ]);
  };

  /**
   * Clear error state
   */
  const clearError = (): void => {
    setError(null);
  };

  // Initial data load
  useEffect(() => {
    fetchEvents();
  }, []);

  // Load user registered events when user changes
  useEffect(() => {
    if (user) {
      fetchUserRegisteredEvents();
    } else {
      setUserRegisteredEvents([]);
    }
  }, [user]);

  const contextValue: EventContextType = {
    events,
    userRegisteredEvents,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    registerForEvent,
    unregisterFromEvent,
    isUserRegistered,
    fetchUserRegisteredEvents,
    searchEvents,
    filterEvents,
    getEventAnalytics,
    getEventCapacityInfo,
    submitEventFeedback,
    refreshData,
    clearError,
  };

  return <EventContext.Provider value={contextValue}>{children}</EventContext.Provider>;
};

export const useEvents = (): EventContextType => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};
