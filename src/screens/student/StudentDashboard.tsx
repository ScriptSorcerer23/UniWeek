import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { SocietyType, EventCategory } from '../../types';

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  society: SocietyType;
  category: EventCategory;
  capacity: number;
  image_url: string | null;
  registrationCount?: number;
  registered_students?: string[];
}

type FilterType = 'All' | 'ACM' | 'CLS' | 'CSS' | 'Upcoming' | 'Past';

const SOCIETY_COLORS = {
  ACM: { primary: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] as const },
  CLS: { primary: '#10B981', gradient: ['#10B981', '#059669'] as const },
  CSS: { primary: '#F97316', gradient: ['#F97316', '#EA580C'] as const },
};

export const StudentDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters: FilterType[] = ['All', 'ACM', 'CLS', 'CSS', 'Upcoming', 'Past'];

  useEffect(() => {
    fetchEvents();

    // Set up realtime subscription for live event updates
    const channel = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedFilter, events]);

  const fetchEvents = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all events with registration counts
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      if (!eventsData) {
        setEvents([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch registration counts for each event
      const eventsWithCounts = await Promise.all(
        eventsData.map(async (event) => {
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          return {
            ...event,
            registrationCount: count || 0,
          };
        })
      );

      setEvents(eventsWithCounts);

      // Set featured events (upcoming events with high registration)
      const upcoming = eventsWithCounts.filter((e) => e.date >= today);
      const featured = upcoming
        .sort((a, b) => (b.registrationCount || 0) - (a.registrationCount || 0))
        .slice(0, 5);
      setFeaturedEvents(featured);
    } catch (error: any) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const applyFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    let filtered = [...events];

    if (selectedFilter === 'Upcoming') {
      filtered = filtered.filter((e) => e.date >= today);
    } else if (selectedFilter === 'Past') {
      filtered = filtered.filter((e) => e.date < today);
    } else if (['ACM', 'CLS', 'CSS'].includes(selectedFilter)) {
      filtered = filtered.filter((e) => e.society === selectedFilter);
    }

    setFilteredEvents(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFilterColor = (filter: FilterType) => {
    if (filter === 'ACM') return SOCIETY_COLORS.ACM.primary;
    if (filter === 'CLS') return SOCIETY_COLORS.CLS.primary;
    if (filter === 'CSS') return SOCIETY_COLORS.CSS.primary;
    return '#667eea';
  };

  const renderFilterChip = (filter: FilterType) => {
    const isSelected = selectedFilter === filter;
    const color = getFilterColor(filter);

    return (
      <TouchableOpacity
        key={filter}
        onPress={() => setSelectedFilter(filter)}
        activeOpacity={0.7}
      >
        <Animatable.View
          animation={isSelected ? 'pulse' : undefined}
          style={[
            styles.filterChip,
            isSelected && {
              backgroundColor: color,
            },
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              isSelected && styles.filterChipTextSelected,
            ]}
          >
            {filter}
          </Text>
        </Animatable.View>
      </TouchableOpacity>
    );
  };

  const renderFeaturedCard = ({ item, index }: { item: Event; index: number }) => {
    const societyColor = SOCIETY_COLORS[item.society];

    return (
      <Animatable.View
        animation="fadeInRight"
        delay={index * 100}
        duration={600}
        style={styles.featuredCard}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
        >
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.featuredImage} />
          ) : (
            <LinearGradient
              colors={societyColor.gradient}
              style={styles.featuredImagePlaceholder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="calendar" size={40} color="#fff" />
            </LinearGradient>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.featuredOverlay}
          >
            <View style={[styles.societyBadge, { backgroundColor: societyColor.primary }]}>
              <Text style={styles.societyBadgeText}>{item.society}</Text>
            </View>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.featuredInfo}>
              <Ionicons name="calendar-outline" size={14} color="#fff" />
              <Text style={styles.featuredDate}>{formatDate(item.date)}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => {
    const societyColor = SOCIETY_COLORS[item.society];
    const registrationPercentage = (item.registrationCount || 0) / item.capacity;
    const isRegistered = item.registered_students?.includes(user?.id || '');
    const isPast = item.date < new Date().toISOString().split('T')[0];

    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 50}
        duration={600}
        style={styles.eventCard}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
        >
          <View style={styles.eventCardContent}>
            {/* Event Poster */}
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.eventPoster} />
            ) : (
              <LinearGradient
                colors={societyColor.gradient}
                style={styles.eventPosterPlaceholder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="image-outline" size={32} color="#fff" />
              </LinearGradient>
            )}

            {/* Event Info */}
            <View style={styles.eventInfo}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={[styles.eventSocietyBadge, { backgroundColor: societyColor.primary }]}>
                  <Text style={styles.eventSocietyText}>{item.society}</Text>
                </View>
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
                    {item.registrationCount || 0} / {item.capacity}
                  </Text>
                </View>
              </View>

              {/* Registration Bar */}
              <View style={styles.registrationBarContainer}>
                <View style={styles.registrationBarBackground}>
                  <View
                    style={[
                      styles.registrationBarFill,
                      {
                        width: `${Math.min(registrationPercentage * 100, 100)}%`,
                        backgroundColor: societyColor.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.registrationBarText}>
                  {Math.round(registrationPercentage * 100)}% filled
                </Text>
              </View>

              {/* Register Button */}
              {!isPast && (
                <TouchableOpacity
                  style={styles.registerButtonContainer}
                  onPress={(e) => {
                    e.stopPropagation();
                    // Navigate to event details or handle registration
                    navigation.navigate('EventDetails', { eventId: item.id });
                  }}
                >
                  <LinearGradient
                    colors={isRegistered ? ['#10B981', '#059669'] : societyColor.gradient}
                    style={styles.registerButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons
                      name={isRegistered ? 'checkmark-circle' : 'add-circle-outline'}
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.registerButtonText}>
                      {isRegistered ? 'Registered' : 'Register Now'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {isPast && (
                <View style={styles.pastBadge}>
                  <Text style={styles.pastBadgeText}>Event Ended</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  const renderEmptyState = () => (
    <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Events Found</Text>
      <Text style={styles.emptyText}>
        {selectedFilter !== 'All'
          ? `No ${selectedFilter} events available`
          : 'Check back later for upcoming events'}
      </Text>
    </Animatable.View>
  );

  const ListHeaderComponent = () => (
    <>
      {/* Featured Events Section */}
      {featuredEvents.length > 0 && selectedFilter === 'All' && (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Events</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScrollContent}
          >
            {featuredEvents.map((event, index) => (
              <View key={event.id}>{renderFeaturedCard({ item: event, index })}</View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* All Events Section Title */}
      <View style={styles.allEventsHeader}>
        <Text style={styles.sectionTitle}>All Events</Text>
        <Text style={styles.eventCount}>
          {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
        </Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="calendar" size={28} color="#fff" />
            <Text style={styles.logoText}>UniWeek</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => {
                // TODO: Implement search
              }}
            >
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => {
                // TODO: Navigate to notifications
              }}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filters.map(renderFilterChip)}
        </ScrollView>
      </View>

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  featuredSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  featuredScrollContent: {
    paddingLeft: 20,
    gap: 16,
  },
  featuredCard: {
    width: width * 0.7,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  societyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  societyBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  featuredInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredDate: {
    fontSize: 14,
    color: '#fff',
  },
  allEventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  eventCount: {
    fontSize: 14,
    color: '#666',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventCardContent: {
    flexDirection: 'row',
  },
  eventPoster: {
    width: 120,
    height: '100%',
    minHeight: 200,
  },
  eventPosterPlaceholder: {
    width: 120,
    height: '100%',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
    padding: 16,
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  eventSocietyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  eventSocietyText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
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
  registrationBarContainer: {
    marginBottom: 12,
  },
  registrationBarBackground: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  registrationBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  registrationBarText: {
    fontSize: 12,
    color: '#999',
  },
  registerButtonContainer: {
    marginTop: 4,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pastBadge: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  pastBadgeText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    lineHeight: 20,
  },
});
