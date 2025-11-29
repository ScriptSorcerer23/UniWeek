import React, { createContext, useState, useEffect, useContext } from 'react';
import { eventService } from '../services/events';
import { Event, EventContextType } from '../types';
import { useAuth } from './AuthContext';

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const fetchedEvents = await eventService.getAllEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registeredStudents'>) => {
    setLoading(true);
    try {
      const newEvent = await eventService.createEvent(event);
      setEvents((prev: Event[]) => [...prev, newEvent]);
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    setLoading(true);
    try {
      await eventService.updateEvent(id, updates);
      setEvents((prev: Event[]) =>
        prev.map((event: Event) =>
          event.id === id ? { ...event, ...updates, updatedAt: new Date() } : event
        )
      );
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    setLoading(true);
    try {
      await eventService.deleteEvent(id);
      setEvents((prev: Event[]) => prev.filter((event: Event) => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerForEvent = async (eventId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await eventService.registerForEvent(user.id, eventId);
      setEvents((prev: Event[]) =>
        prev.map((event: Event) =>
          event.id === eventId
            ? {
                ...event,
                registeredStudents: [...event.registeredStudents, user.id],
              }
            : event
        )
      );
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unregisterFromEvent = async (eventId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      await eventService.unregisterFromEvent(user.id, eventId);
      setEvents((prev: Event[]) =>
        prev.map((event: Event) =>
          event.id === eventId
            ? {
                ...event,
                registeredStudents: event.registeredStudents.filter(
                  (id: string) => id !== user.id
                ),
              }
            : event
        )
      );
    } catch (error) {
      console.error('Error unregistering from event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <EventContext.Provider
      value={{
        events,
        loading,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        registerForEvent,
        unregisterFromEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = (): EventContextType => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};
