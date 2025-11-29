import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isPast, isFuture } from 'date-fns';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { APP_THEME, SOCIETY_COLORS } from '../../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';

interface EventRegistration {
  id: string;
  registered_at: string;
  attended: boolean;
  rating: number | null;
  feedback: string | null;
  events: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    society: string;
    category: string;
    cover_image_url: string;
    registered_count: number;
    capacity: number;
  };
}

export const MyEventsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyEvents = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          registered_at,
          attended,
          rating,
          feedback,
          events (
            id,
            title,
            description,
            date,
            time,
            venue,
            society,
            category,
            cover_image_url,
            registered_count,
            capacity
          )
        `)
        .eq('user_id', user.id)
        .order('events.date', { ascending: true });

      if (error) throw error;

      setRegistrations(data as any || []);
    } catch (error) {
      console.error('Error fetching my events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyEvents();
  };

  const getFilteredEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return registrations.filter((reg) => {
      const eventDate = new Date(reg.events.date);
      eventDate.setHours(0, 0, 0, 0);

      if (activeTab === 'upcoming') {
        return isFuture(eventDate) || eventDate.getTime() === today.getTime();
      } else {
        return isPast(eventDate) && eventDate.getTime() !== today.getTime();
      }
    });
  };

  const filteredEvents = getFilteredEvents();

  const renderEventCard = ({ item }: { item: EventRegistration }) => {
    const event = item.events;
    const societyColor = SOCIETY_COLORS[event.society as keyof typeof SOCIETY_COLORS] || APP_THEME.colors.primary;
    const isPastEvent = activeTab === 'past';

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
        activeOpacity={0.7}
      >
        {event.cover_image_url ? (
          <Image
            source={{ uri: event.cover_image_url }}
            style={styles.eventImage}
          />
        ) : (
          <View style={[styles.eventImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={50} color={APP_THEME.colors.border} />
          </View>
        )}
        
        <View style={styles.eventInfo}>
          <View style={styles.eventHeader}>
            <View style={[styles.societyBadge, { backgroundColor: societyColor }]}>
              <Text style={styles.societyText}>{event.society}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
          </View>

          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={APP_THEME.colors.textSecondary} />
              <Text style={styles.detailText}>
                {format(new Date(event.date), 'MMM dd, yyyy')} • {event.time}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={APP_THEME.colors.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {event.venue}
              </Text>
            </View>
          </View>

          {isPastEvent ? (
            item.rating ? (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratedText}>Your Rating: </Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= item.rating! ? 'star' : 'star-outline'}
                      size={18}
                      color="#FFD700"
                    />
                  ))}
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.rateButton}
                onPress={() => navigation.navigate('RateEvent', { 
                  eventId: event.id,
                  registrationId: item.id,
                  eventTitle: event.title 
                })}
              >
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.rateButtonText}>Rate Event</Text>
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
            >
              <Text style={styles.viewButtonText}>View Details</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <ScrollView
      contentContainerStyle={styles.emptyContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Ionicons
        name={activeTab === 'upcoming' ? 'calendar-outline' : 'time-outline'}
        size={80}
        color={APP_THEME.colors.border}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'upcoming' ? 'No Upcoming Events' : 'No Past Events'}
      </Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'upcoming'
          ? 'You haven\'t registered for any upcoming events yet. Browse events and register to see them here!'
          : 'You don\'t have any past events. Once events you\'ve registered for are complete, they\'ll appear here.'}
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.browseButtonText}>Browse Events</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[APP_THEME.colors.primary, APP_THEME.colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Events</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your events...</Text>
        </View>
      ) : filteredEvents.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: APP_THEME.colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.textSecondary,
  },
  activeTabText: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 160,
    backgroundColor: APP_THEME.colors.border,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  eventInfo: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  societyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  societyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: APP_THEME.colors.border,
  },
  categoryText: {
    color: APP_THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_THEME.colors.text,
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    flex: 1,
  },
  viewButton: {
    flexDirection: 'row',
    backgroundColor: APP_THEME.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rateButton: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  rateButtonText: {
    color: '#B8860B',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  ratedText: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: APP_THEME.colors.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: APP_THEME.colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: APP_THEME.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
