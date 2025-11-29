import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/AuthContext';
import { Event } from '../../types';
import { formatDate } from '../../utils/helpers';
import { supabase } from '../../services/supabase';

const { width } = Dimensions.get('window');

// Society colors
const SOCIETY_COLORS = {
  ACM: {
    primary: '#3B82F6',
    gradient: ['#3B82F6', '#2563EB'],
  },
  CLS: {
    primary: '#10B981',
    gradient: ['#10B981', '#059669'],
  },
  CSS: {
    primary: '#F97316',
    gradient: ['#F97316', '#EA580C'],
  },
};

interface EventWithCount extends Event {
  registrationCount?: number;
}

export const SocietyDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
  });

  const societyColor = user?.societyType
    ? SOCIETY_COLORS[user.societyType]
    : SOCIETY_COLORS.ACM;

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch events created by this society
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', user.id)
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch registration counts for each event
      const eventsWithCounts = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count, error: countError } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          return {
            ...event,
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
            updatedAt: new Date(event.updated_at || event.created_at),
            registrationCount: count || 0,
          } as EventWithCount;
        })
      );

      setEvents(eventsWithCounts);

      // Calculate statistics
      const now = new Date();
      const upcoming = eventsWithCounts.filter((e) => e.date >= now).length;
      const totalRegs = eventsWithCounts.reduce(
        (sum, e) => sum + (e.registrationCount || 0),
        0
      );

      setStats({
        totalEvents: eventsWithCounts.length,
        totalRegistrations: totalRegs,
        upcomingEvents: upcoming,
      });
    } catch (error: any) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();

    // Set up realtime subscription
    if (!user) return;

    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `created_by=eq.${user.id}`,
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const renderStatCard = (
    title: string,
    value: number,
    icon: string,
    colors: string[]
  ) => (
    <Animatable.View animation="fadeInUp" duration={800} style={styles.statCard}>
      <LinearGradient colors={colors} style={styles.statGradient}>
        <Ionicons name={icon as any} size={32} color="rgba(255, 255, 255, 0.9)" />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </LinearGradient>
    </Animatable.View>
  );

  const renderEvent = ({ item, index }: { item: EventWithCount; index: number }) => {
    const isPast = item.date < new Date();
    
    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 100}
        duration={600}
        style={styles.eventCard}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
          activeOpacity={0.9}
        >
          <View style={styles.eventCardContent}>
            <View style={styles.eventHeader}>
              <View style={styles.eventTitleContainer}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: `${societyColor.primary}20` },
                  ]}
                >
                  <Text
                    style={[styles.categoryText, { color: societyColor.primary }]}
                  >
                    {item.category}
                  </Text>
                </View>
              </View>
              {isPast && (
                <View style={styles.pastBadge}>
                  <Text style={styles.pastBadgeText}>Past</Text>
                </View>
              )}
            </View>

            <View style={styles.eventDetails}>
              <View style={styles.eventDetailRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.eventDetailText}>
                  {formatDate(item.date)} • {item.time}
                </Text>
              </View>

              <View style={styles.eventDetailRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.eventDetailText} numberOfLines={1}>
                  {item.venue}
                </Text>
              </View>

              <View style={styles.eventDetailRow}>
                <Ionicons name="people-outline" size={16} color="#666" />
                <Text style={styles.eventDetailText}>
                  {item.registrationCount || 0} / {item.capacity} registered
                </Text>
              </View>
            </View>

            <View style={styles.eventActions}>
              <TouchableOpacity
                style={[
                  styles.editButton,
                  { borderColor: societyColor.primary },
                ]}
                onPress={() => navigation.navigate('EditEvent', { eventId: item.id })}
              >
                <Ionicons name="create-outline" size={16} color={societyColor.primary} />
                <Text style={[styles.editButtonText, { color: societyColor.primary }]}>
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.viewButton,
                  { backgroundColor: societyColor.primary },
                ]}
                onPress={() => navigation.navigate('EventRegistrations', { 
                  eventId: item.id,
                  eventTitle: item.title 
                })}
              >
                <Ionicons name="people" size={16} color="#fff" />
                <Text style={styles.viewButtonText}>
                  {item.registrationCount || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  const renderEmptyState = () => (
    <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Events Yet</Text>
      <Text style={styles.emptyText}>
        Create your first event to get started
      </Text>
    </Animatable.View>
  );

  const ListHeaderComponent = () => (
    <>
      {/* Header with Society Badge */}
      <LinearGradient
        colors={societyColor.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.societyBadge}>
              <Text style={styles.societyBadgeText}>
                {user?.societyType || 'Society'}
              </Text>
            </View>
            <Text style={styles.societyName}>
              {user?.societyType === 'ACM'
                ? 'ACM Society'
                : user?.societyType === 'CLS'
                ? 'CLS Society'
                : 'CSS Society'}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileIcon}>
            <Ionicons name="person-circle-outline" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        {renderStatCard('Total Events', stats.totalEvents, 'calendar', [
          '#667eea',
          '#764ba2',
        ])}
        {renderStatCard(
          'Registrations',
          stats.totalRegistrations,
          'people',
          ['#f093fb', '#f5576c']
        )}
        {renderStatCard('Upcoming', stats.upcomingEvents, 'time', [
          '#4facfe',
          '#00f2fe',
        ])}
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Events</Text>
        {events.length > 0 && (
          <Text style={styles.eventCount}>{events.length} event(s)</Text>
        )}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[societyColor.primary]}
            tintColor={societyColor.primary}
          />
        }
      />

      {/* Floating Action Button */}
      <FAB
        icon={() => <Ionicons name="add" size={24} color="#fff" />}
        style={[styles.fab, { backgroundColor: societyColor.primary }]}
        onPress={() => navigation.navigate('CreateEvent')}
        label="Create Event"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  societyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  societyBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  societyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileIcon: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    marginTop: -20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  eventCount: {
    fontSize: 14,
    color: '#666',
  },
  eventCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventCardContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pastBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pastBadgeText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  eventDetails: {
    gap: 8,
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 16,
  },
});
