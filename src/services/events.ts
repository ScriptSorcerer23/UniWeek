import { supabase } from './supabase';
import { Event, Registration, EventCategory, SocietyType } from '../types';

export interface CreateEventData {
  title: string;
  description: string;
  date: Date;
  time: string;
  venue: string;
  society: SocietyType;
  category: EventCategory;
  capacity: number;
  coverImageUrl?: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {}

export interface EventFilters {
  society?: SocietyType;
  category?: EventCategory;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface EventAnalytics {
  totalEvents: number;
  totalRegistrations: number;
  averageRating: number;
  popularEvents: Event[];
  registrationTrends: { date: string; count: number; }[];
  participationRates: { society: SocietyType; rate: number; }[];
  categoryDistribution: { category: EventCategory; count: number; }[];
}

export interface RegistrationWithUser extends Registration {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const eventService = {
  /**
   * Get all events with optional filters and search
   */
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    let query = supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    // Apply filters
    if (filters?.society) {
      query = query.eq('society', filters.society);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom.toISOString().split('T')[0]);
    }
    if (filters?.dateTo) {
      query = query.lte('date', filters.dateTo.toISOString().split('T')[0]);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,venue.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date + 'T' + event.time),
      time: event.time,
      venue: event.venue,
      society: event.society,
      category: event.category,
      capacity: event.capacity,
      registeredStudents: event.registered_students || [],
      createdBy: event.created_by,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
      coverImageUrl: event.cover_image_url,
    }));
  },



  /**
   * Get single event by ID with full details
   */
  async getEventById(eventId: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: new Date(data.date + 'T' + data.time),
      time: data.time,
      venue: data.venue,
      society: data.society,
      category: data.category,
      capacity: data.capacity,
      registeredStudents: data.registered_students || [],
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      coverImageUrl: data.cover_image_url,
    };
  },

  /**
   * Get events created by a specific user (Society handlers only)
   */
  async getEventsByCreator(userId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date + 'T' + event.time),
      time: event.time,
      venue: event.venue,
      society: event.society,
      category: event.category,
      capacity: event.capacity,
      registeredStudents: event.registered_students || [],
      createdBy: event.created_by,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
      coverImageUrl: event.cover_image_url,
    }));
  },

  /**
   * Create new event (Society handlers only)
   */
  async createEvent(eventData: CreateEventData, createdBy: string): Promise<Event> {
    const eventRecord = {
      title: eventData.title,
      description: eventData.description,
      date: eventData.date.toISOString().split('T')[0],
      time: eventData.time,
      venue: eventData.venue,
      society: eventData.society,
      category: eventData.category,
      capacity: eventData.capacity,
      cover_image_url: eventData.coverImageUrl,
      created_by: createdBy,
      registered_students: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('events')
      .insert([eventRecord])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: new Date(data.date + 'T' + data.time),
      time: data.time,
      venue: data.venue,
      society: data.society,
      category: data.category,
      capacity: data.capacity,
      registeredStudents: data.registered_students || [],
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      coverImageUrl: data.cover_image_url,
    };
  },

  /**
   * Update existing event (Society handlers only, own events)
   */
  async updateEvent(eventId: string, updates: UpdateEventData, userId: string): Promise<Event> {
    const updateRecord: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateRecord.title = updates.title;
    if (updates.description !== undefined) updateRecord.description = updates.description;
    if (updates.date !== undefined) updateRecord.date = updates.date.toISOString().split('T')[0];
    if (updates.time !== undefined) updateRecord.time = updates.time;
    if (updates.venue !== undefined) updateRecord.venue = updates.venue;
    if (updates.category !== undefined) updateRecord.category = updates.category;
    if (updates.capacity !== undefined) updateRecord.capacity = updates.capacity;
    if (updates.coverImageUrl !== undefined) updateRecord.cover_image_url = updates.coverImageUrl;

    const { data, error } = await supabase
      .from('events')
      .update(updateRecord)
      .eq('id', eventId)
      .eq('created_by', userId) // Ensure user can only update their own events
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: new Date(data.date + 'T' + data.time),
      time: data.time,
      venue: data.venue,
      society: data.society,
      category: data.category,
      capacity: data.capacity,
      registeredStudents: data.registered_students || [],
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      coverImageUrl: data.cover_image_url,
    };
  },

  /**
   * Delete event (Society handlers only, own events)
   */
  async deleteEvent(eventId: string, userId: string): Promise<void> {
    // First delete all registrations for this event
    const { error: regError } = await supabase
      .from('registrations')
      .delete()
      .eq('event_id', eventId);

    if (regError) throw regError;

    // Then delete the event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('created_by', userId); // Ensure user can only delete their own events

    if (error) throw error;
  },

  /**
   * Register student for event with capacity and conflict checking
   */
  async registerForEvent(eventId: string, userId: string): Promise<void> {
    // Get event details first
    const event = await this.getEventById(eventId);
    if (!event) throw new Error('Event not found');
    
    // Check capacity
    if (event.registeredStudents.length >= event.capacity) {
      throw new Error('Event is at full capacity');
    }

    // Check if already registered
    const { data: existingRegistration } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (existingRegistration) {
      throw new Error('Already registered for this event');
    }

    // Check for scheduling conflicts (events at same date/time)
    const { data: conflictingEvents, error: conflictError } = await supabase
      .from('registrations')
      .select(`
        event_id,
        events!inner(date, time)
      `)
      .eq('user_id', userId);

    if (conflictError) throw conflictError;

    const hasConflict = conflictingEvents?.some((reg: any) => {
      const regDate = reg.events.date;
      const regTime = reg.events.time;
      const eventDate = event.date.toISOString().split('T')[0];
      const eventTime = event.time;
      return regDate === eventDate && regTime === eventTime;
    });

    if (hasConflict) {
      throw new Error('You have another event scheduled at the same time');
    }

    // Create registration record
    const { error: registrationError } = await supabase
      .from('registrations')
      .insert([{
        user_id: userId,
        event_id: eventId,
        registered_at: new Date().toISOString(),
      }]);

    if (registrationError) throw registrationError;

    // Update event's registered_students array
    const updatedStudents = [...event.registeredStudents, userId];
    const { error: updateError } = await supabase
      .from('events')
      .update({ 
        registered_students: updatedStudents,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (updateError) throw updateError;
  },

  /**
   * Get comprehensive event analytics for society dashboards
   */
  async getEventAnalytics(societyType?: SocietyType, userId?: string): Promise<EventAnalytics> {
    // Build queries based on filters
    let eventsQuery = supabase.from('events').select('*');
    let registrationsQuery = supabase.from('registrations').select('*');

    if (societyType) {
      eventsQuery = eventsQuery.eq('society', societyType);
    }
    if (userId) {
      eventsQuery = eventsQuery.eq('created_by', userId);
    }

    const [eventsResult, registrationsResult] = await Promise.all([
      eventsQuery,
      registrationsQuery,
    ]);

    if (eventsResult.error) throw eventsResult.error;
    if (registrationsResult.error) throw registrationsResult.error;

    const events = eventsResult.data || [];
    const allRegistrations = registrationsResult.data || [];

    // Filter registrations for relevant events
    const eventIds = events.map((e: any) => e.id);
    const registrations = allRegistrations.filter((r: any) => eventIds.includes(r.event_id));

    // Calculate basic metrics
    const totalEvents = events.length;
    const totalRegistrations = registrations.length;
    
    const ratingsWithFeedback = registrations.filter((r: any) => r.rating);
    const averageRating = ratingsWithFeedback.length > 0 
      ? ratingsWithFeedback.reduce((sum: number, r: any) => sum + r.rating, 0) / ratingsWithFeedback.length
      : 0;

    // Popular events (most registrations)
    const eventRegistrationCounts = events.map((event: any) => ({
      ...event,
      registrationCount: registrations.filter((r: any) => r.event_id === event.id).length,
    }));

    const popularEvents = eventRegistrationCounts
      .sort((a, b) => b.registrationCount - a.registrationCount)
      .slice(0, 5)
      .map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: new Date(event.date + 'T' + event.time),
        time: event.time,
        venue: event.venue,
        society: event.society,
        category: event.category,
        capacity: event.capacity,
        registeredStudents: event.registered_students || [],
        createdBy: event.created_by,
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at),
        coverImageUrl: event.cover_image_url,
      }));

    // Registration trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = registrations.filter((r: any) => 
      new Date(r.registered_at) >= thirtyDaysAgo
    );

    const registrationTrends = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const count = recentRegistrations.filter((r: any) => 
        r.registered_at.startsWith(dateStr)
      ).length;

      return { date: dateStr, count };
    });

    // Participation rates by society
    const societyStats = await Promise.all(['ACM', 'CLS', 'CSS'].map(async (society) => {
      const societyEventsQuery = await supabase
        .from('events')
        .select('id, capacity, registered_students')
        .eq('society', society);

      const societyEvents = societyEventsQuery.data || [];
      const totalCapacity = societyEvents.reduce((sum, e) => sum + e.capacity, 0);
      const totalRegistered = societyEvents.reduce((sum, e) => sum + (e.registered_students?.length || 0), 0);
      
      return {
        society: society as SocietyType,
        rate: totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0,
      };
    }));

    // Category distribution
    const categoryMap = new Map<EventCategory, number>();
    events.forEach((event: any) => {
      const count = categoryMap.get(event.category) || 0;
      categoryMap.set(event.category, count + 1);
    });

    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    }));

    return {
      totalEvents,
      totalRegistrations,
      averageRating: Math.round(averageRating * 10) / 10,
      popularEvents,
      registrationTrends,
      participationRates: societyStats,
      categoryDistribution,
    };
  },

  /**
   * Check if user is registered for specific event
   */
  async isUserRegistered(eventId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    return !!data;
  },

  /**
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', nextWeek.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date + 'T' + event.time),
      time: event.time,
      venue: event.venue,
      society: event.society,
      category: event.category,
      capacity: event.capacity,
      registeredStudents: event.registered_students || [],
      createdBy: event.created_by,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
      coverImageUrl: event.cover_image_url,
    }));
  },

  /**
   * Get past events for a user (for feedback)
   */
  async getUserPastEvents(userId: string): Promise<Event[]> {
    const today = new Date();
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('event_id')
      .eq('user_id', userId);

    if (regError) throw regError;
    if (!registrations || registrations.length === 0) return [];

    const eventIds = registrations.map((reg: any) => reg.event_id);
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .lt('date', today.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (eventsError) throw eventsError;

    return (events || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date + 'T' + event.time),
      time: event.time,
      venue: event.venue,
      society: event.society,
      category: event.category,
      capacity: event.capacity,
      registeredStudents: event.registered_students || [],
      createdBy: event.created_by,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
      coverImageUrl: event.cover_image_url,
    }));
  },

  /**
   * Search events by title, description, or venue
   */
  async searchEvents(searchQuery: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,venue.ilike.%${searchQuery}%`)
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date + 'T' + event.time),
      time: event.time,
      venue: event.venue,
      society: event.society,
      category: event.category,
      capacity: event.capacity,
      registeredStudents: event.registered_students || [],
      createdBy: event.created_by,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
      coverImageUrl: event.cover_image_url,
    }));
  },

  /**
   * Get event capacity info
   */
  async getEventCapacityInfo(eventId: string): Promise<{
    capacity: number;
    registered: number;
    available: number;
    percentage: number;
  }> {
    const event = await this.getEventById(eventId);
    if (!event) throw new Error('Event not found');

    const registered = event.registeredStudents.length;
    const available = event.capacity - registered;
    const percentage = Math.round((registered / event.capacity) * 100);

    return {
      capacity: event.capacity,
      registered,
      available,
      percentage,
    };
  },

  /**
   * Unregister student from event
   */
  async unregisterFromEvent(eventId: string, userId: string): Promise<void> {
    // Delete registration record
    const { error: deleteError } = await supabase
      .from('registrations')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (deleteError) throw deleteError;

    // Update event's registered_students array
    const event = await this.getEventById(eventId);
    if (event) {
      const updatedStudents = event.registeredStudents.filter(id => id !== userId);
      const { error: updateError } = await supabase
        .from('events')
        .update({ 
          registered_students: updatedStudents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (updateError) throw updateError;
    }
  },

  /**
   * Get user's registered events (past and upcoming)
   */
  async getUserRegisteredEvents(userId: string): Promise<Event[]> {
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('event_id')
      .eq('user_id', userId);

    if (regError) throw regError;

    if (!registrations || registrations.length === 0) return [];

    const eventIds = registrations.map((reg: any) => reg.event_id);
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .order('date', { ascending: true });

    if (eventsError) throw eventsError;

    return (events || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date + 'T' + event.time),
      time: event.time,
      venue: event.venue,
      society: event.society,
      category: event.category,
      capacity: event.capacity,
      registeredStudents: event.registered_students || [],
      createdBy: event.created_by,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
      coverImageUrl: event.cover_image_url,
    }));
  },

  /**
   * Get event registrations with user details (for Society handlers)
   */
  async getEventRegistrations(eventId: string): Promise<RegistrationWithUser[]> {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((reg: any) => ({
      id: reg.id,
      userId: reg.user_id,
      eventId: reg.event_id,
      timestamp: new Date(reg.registered_at),
      attended: reg.attended || false,
      rating: reg.rating,
      feedback: reg.feedback,
      user: reg.users ? {
        id: reg.users.id,
        name: reg.users.name,
        email: reg.users.email,
      } : undefined,
    }));
  },

  /**
   * Submit event feedback and rating (for past events)
   */
  async submitEventFeedback(
    eventId: string, 
    userId: string, 
    rating: number, 
    feedback?: string
  ): Promise<void> {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const { error } = await supabase
      .from('registrations')
      .update({
        rating,
        feedback,
        feedback_at: new Date().toISOString(),
        attended: true, // Mark as attended when feedback is submitted
      })
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) throw error;
  },
};
