import { supabase } from './supabase';
import { Event, Registration } from '../types';

export const eventService = {
  /**
   * Fetch all events
   */
  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    return data.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date),
      time: event.time,
      venue: event.venue,
      society: event.society,
      category: event.category,
      capacity: event.capacity,
      registeredStudents: event.registered_students || [],
      createdBy: event.created_by,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
    }));
  },

  /**
   * Get events by society
   */
  async getEventsBySociety(society: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('society', society)
      .order('date', { ascending: true });

    if (error) throw error;

    return data.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date),
      time: event.time,
      venue: event.venue,
      society: event.society,
      category: event.category,
      capacity: event.capacity,
      registeredStudents: event.registered_students || [],
      createdBy: event.created_by,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
    }));
  },

  /**
   * Get single event by ID
   */
  async getEventById(eventId: string): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      time: data.time,
      venue: data.venue,
      society: data.society,
      category: data.category,
      capacity: data.capacity,
      registeredStudents: data.registered_students || [],
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  /**
   * Create new event
   */
  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registeredStudents'>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert([{
        title: event.title,
        description: event.description,
        date: event.date.toISOString(),
        time: event.time,
        venue: event.venue,
        society: event.society,
        category: event.category,
        capacity: event.capacity,
        created_by: event.createdBy,
        registered_students: [],
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      time: data.time,
      venue: data.venue,
      society: data.society,
      category: data.category,
      capacity: data.capacity,
      registeredStudents: [],
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  /**
   * Update event
   */
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    const { error } = await supabase
      .from('events')
      .update({
        title: updates.title,
        description: updates.description,
        date: updates.date?.toISOString(),
        time: updates.time,
        venue: updates.venue,
        category: updates.category,
        capacity: updates.capacity,
      })
      .eq('id', eventId);

    if (error) throw error;
  },

  /**
   * Delete event
   */
  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  },

  /**
   * Register student for event
   */
  async registerForEvent(userId: string, eventId: string): Promise<void> {
    // Create registration record
    const { error: regError } = await supabase
      .from('registrations')
      .insert([{
        user_id: userId,
        event_id: eventId,
        timestamp: new Date().toISOString(),
        attended: false,
      }]);

    if (regError) throw regError;

    // Update event's registered students array
    const { data: event } = await supabase
      .from('events')
      .select('registered_students')
      .eq('id', eventId)
      .single();

    const registeredStudents = event?.registered_students || [];
    
    const { error: eventError } = await supabase
      .from('events')
      .update({
        registered_students: [...registeredStudents, userId],
      })
      .eq('id', eventId);

    if (eventError) throw eventError;

    // Update user's registered events
    const { data: user } = await supabase
      .from('users')
      .select('registered_events')
      .eq('id', userId)
      .single();

    const registeredEvents = user?.registered_events || [];

    const { error: userError } = await supabase
      .from('users')
      .update({
        registered_events: [...registeredEvents, eventId],
      })
      .eq('id', userId);

    if (userError) throw userError;
  },

  /**
   * Unregister from event
   */
  async unregisterFromEvent(userId: string, eventId: string): Promise<void> {
    // Delete registration record
    const { error: regError } = await supabase
      .from('registrations')
      .delete()
      .match({ user_id: userId, event_id: eventId });

    if (regError) throw regError;

    // Update event's registered students
    const { data: event } = await supabase
      .from('events')
      .select('registered_students')
      .eq('id', eventId)
      .single();

    const registeredStudents = (event?.registered_students || []).filter(
      (id: string) => id !== userId
    );

    const { error: eventError } = await supabase
      .from('events')
      .update({ registered_students: registeredStudents })
      .eq('id', eventId);

    if (eventError) throw eventError;

    // Update user's registered events
    const { data: user } = await supabase
      .from('users')
      .select('registered_events')
      .eq('id', userId)
      .single();

    const registeredEvents = (user?.registered_events || []).filter(
      (id: string) => id !== eventId
    );

    const { error: userError } = await supabase
      .from('users')
      .update({ registered_events: registeredEvents })
      .eq('id', userId);

    if (userError) throw userError;
  },

  /**
   * Get user's registrations
   */
  async getUserRegistrations(userId: string): Promise<Registration[]> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return data.map((reg: any) => ({
      id: reg.id,
      userId: reg.user_id,
      eventId: reg.event_id,
      timestamp: new Date(reg.timestamp),
      attended: reg.attended,
      rating: reg.rating,
      feedback: reg.feedback,
    }));
  },

  /**
   * Get event registrations
   */
  async getEventRegistrations(eventId: string): Promise<Registration[]> {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return data.map((reg: any) => ({
      id: reg.id,
      userId: reg.user_id,
      eventId: reg.event_id,
      timestamp: new Date(reg.timestamp),
      attended: reg.attended,
      rating: reg.rating,
      feedback: reg.feedback,
    }));
  },

  /**
   * Submit event feedback
   */
  async submitFeedback(
    userId: string,
    eventId: string,
    rating: number,
    feedback: string
  ): Promise<void> {
    const { error } = await supabase
      .from('registrations')
      .update({
        rating,
        feedback,
        attended: true,
      })
      .match({ user_id: userId, event_id: eventId });

    if (error) throw error;
  },
};
