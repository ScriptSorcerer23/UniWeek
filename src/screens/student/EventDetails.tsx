import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as Calendar from 'expo-calendar';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { SocietyType, EventCategory } from '../../types';

const { width, height } = Dimensions.get('window');

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
  created_at: string;
}

interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  timestamp: string;
  users?: {
    full_name: string;
    avatar_url?: string;
  };
}

const SOCIETY_COLORS = {
  ACM: { primary: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] as const },
  CLS: { primary: '#10B981', gradient: ['#10B981', '#059669'] as const },
  CSS: { primary: '#F97316', gradient: ['#F97316', '#EA580C'] as const },
};

const CATEGORY_ICONS: Record<EventCategory, string> = {
  Technical: 'code-slash',
  Workshop: 'construct',
  Seminar: 'school',
  Competition: 'trophy',
  Social: 'people',
  Sports: 'football',
  Cultural: 'color-palette',
  Other: 'ellipsis-horizontal-circle',
};

export const EventDetails: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const { eventId } = route.params;

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    fetchRegistrations();

    // Set up realtime subscription for registration updates
    const channel = supabase
      .channel('registrations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error: any) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      // Check if current user is registered
      const { data: userReg, error: userError } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user?.id || '');

      if (userError) throw userError;
      setIsRegistered(userReg && userReg.length > 0);

      // Fetch all registrations with user details
      const { data: allRegs, error: allError } = await supabase
        .from('registrations')
        .select(
          `
          *,
          users:user_id (
            full_name,
            avatar_url
          )
        `
        )
        .eq('event_id', eventId)
        .order('timestamp', { ascending: true });

      if (allError) throw allError;
      setRegistrations(allRegs || []);
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
    }
  };

  const handleRegister = async () => {
    if (!user || !event) return;

    // Check if event is full
    if (registrations.length >= event.capacity) {
      Toast.show({
        type: 'error',
        text1: 'Event Full',
        text2: 'This event has reached maximum capacity',
        position: 'bottom',
        visibilityTime: 3000,
      });
      return;
    }

    // Check if already registered
    if (isRegistered) {
      Toast.show({
        type: 'info',
        text1: 'Already Registered',
        text2: 'You are already registered for this event',
        position: 'bottom',
        visibilityTime: 3000,
      });
      return;
    }

    setRegistering(true);

    try {
      const { error } = await supabase.from('registrations').insert({
        user_id: user.id,
        event_id: eventId,
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;

      setIsRegistered(true);
      fetchRegistrations();

      Toast.show({
        type: 'success',
        text1: 'Registration Successful! 🎉',
        text2: `You're registered for ${event.title}`,
        position: 'bottom',
        visibilityTime: 4000,
      });
    } catch (error: any) {
      console.error('Error registering:', error);
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message || 'Please try again',
        position: 'bottom',
        visibilityTime: 3000,
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!event) return;

    setAddingToCalendar(true);

    try {
      // Request calendar permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable calendar permissions to add events'
        );
        setAddingToCalendar(false);
        return;
      }

      // Get default calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find((cal) => cal.allowsModifications) || calendars[0];

      if (!defaultCalendar) {
        Alert.alert('Error', 'No calendar found');
        setAddingToCalendar(false);
        return;
      }

      // Parse date and time
      const eventDate = new Date(event.date);
      const [hours, minutes] = event.time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes));

      // Create end date (2 hours later by default)
      const endDate = new Date(eventDate);
      endDate.setHours(endDate.getHours() + 2);

      // Create calendar event
      const eventDetails = {
        title: event.title,
        startDate: eventDate,
        endDate: endDate,
        location: event.venue,
        notes: event.description,
        timeZone: 'Asia/Karachi',
        alarms: [
          { relativeOffset: -60 }, // 1 hour before
          { relativeOffset: -1440 }, // 1 day before
        ],
      };

      await Calendar.createEventAsync(defaultCalendar.id, eventDetails);

      Toast.show({
        type: 'success',
        text1: 'Added to Calendar! 📅',
        text2: `${event.title} has been added to your calendar`,
        position: 'bottom',
        visibilityTime: 3000,
      });
    } catch (error: any) {
      console.error('Error adding to calendar:', error);
      Toast.show({
        type: 'error',
        text1: 'Calendar Error',
        text2: 'Failed to add event to calendar',
        position: 'bottom',
        visibilityTime: 3000,
      });
    } finally {
      setAddingToCalendar(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;

    try {
      await Share.share({
        message: `Check out this event!\n\n${event.title}\n\nDate: ${formatDate(
          event.date
        )}\nTime: ${event.time}\nVenue: ${event.venue}\n\nOrganized by ${event.society}`,
        title: event.title,
      });
    } catch (error: any) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRegistrationPercentage = (): number => {
    if (!event) return 0;
    return (registrations.length / event.capacity) * 100;
  };

  const isEventFull = (): boolean => {
    if (!event) return false;
    return registrations.length >= event.capacity;
  };

  const isEventPast = (): boolean => {
    if (!event) return false;
    return event.date < new Date().toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={80} color="#ccc" />
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const societyColor = SOCIETY_COLORS[event.society];
  const categoryIcon = CATEGORY_ICONS[event.category];
  const registrationPercentage = getRegistrationPercentage();
  const isFull = isEventFull();
  const isPast = isEventPast();
  const isButtonDisabled = isFull || isRegistered || isPast || registering;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={styles.heroImage} />
          ) : (
            <LinearGradient
              colors={societyColor.gradient}
              style={styles.heroImagePlaceholder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="calendar" size={80} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroOverlay}
          />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButtonHero}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </View>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <View style={styles.shareButtonCircle}>
              <Ionicons name="share-social" size={22} color="#333" />
            </View>
          </TouchableOpacity>

          {/* Society Badge */}
          <Animatable.View animation="fadeInDown" delay={300} style={styles.societyBadgeContainer}>
            <View style={[styles.societyBadge, { backgroundColor: societyColor.primary }]}>
              <Ionicons name="people" size={14} color="#fff" />
              <Text style={styles.societyBadgeText}>{event.society}</Text>
            </View>
          </Animatable.View>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Animatable.Text animation="fadeInUp" delay={400} style={styles.title}>
            {event.title}
          </Animatable.Text>

          {/* Info Rows */}
          <Animatable.View animation="fadeInUp" delay={500} style={styles.infoSection}>
            {/* Date */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="calendar-outline" size={20} color="#667eea" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
              </View>
            </View>

            {/* Time */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{event.time}</Text>
              </View>
            </View>

            {/* Venue */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="location-outline" size={20} color="#10B981" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Venue</Text>
                <Text style={styles.infoValue}>{event.venue}</Text>
              </View>
            </View>

            {/* Category */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name={categoryIcon as any} size={20} color="#EC4899" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{event.category}</Text>
              </View>
            </View>

            {/* Capacity with Progress Bar */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="people-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Capacity</Text>
                <View style={styles.capacityContainer}>
                  <Text style={styles.infoValue}>
                    {registrations.length} / {event.capacity}
                  </Text>
                  {isFull && (
                    <View style={styles.fullBadge}>
                      <Text style={styles.fullBadgeText}>FULL</Text>
                    </View>
                  )}
                </View>
                <View style={styles.progressBarBackground}>
                  <Animatable.View
                    animation="fadeInRight"
                    duration={1000}
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(registrationPercentage, 100)}%`,
                        backgroundColor: isFull ? '#EF4444' : societyColor.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </Animatable.View>

          {/* Description */}
          <Animatable.View animation="fadeInUp" delay={600} style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </Animatable.View>

          {/* Registered Students */}
          <Animatable.View animation="fadeInUp" delay={700} style={styles.registeredSection}>
            <View style={styles.registeredHeader}>
              <Text style={styles.sectionTitle}>Registered Students</Text>
              <Text style={styles.registeredCount}>{registrations.length}</Text>
            </View>

            {registrations.length > 0 ? (
              <View style={styles.avatarsContainer}>
                {registrations.slice(0, 5).map((reg, index) => (
                  <Animatable.View
                    key={reg.id}
                    animation="bounceIn"
                    delay={800 + index * 100}
                    style={[styles.avatarWrapper, { zIndex: 10 - index }]}
                  >
                    {reg.users?.avatar_url ? (
                      <Image
                        source={{ uri: reg.users.avatar_url }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatarPlaceholder,
                          { backgroundColor: societyColor.primary },
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {reg.users?.full_name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                  </Animatable.View>
                ))}
                {registrations.length > 5 && (
                  <Animatable.View
                    animation="bounceIn"
                    delay={1300}
                    style={[styles.avatarWrapper, styles.moreAvatars]}
                  >
                    <Text style={styles.moreAvatarsText}>+{registrations.length - 5}</Text>
                  </Animatable.View>
                )}
              </View>
            ) : (
              <Text style={styles.noRegistrationsText}>
                Be the first to register for this event!
              </Text>
            )}
          </Animatable.View>

          {/* Add to Calendar Button */}
          <Animatable.View animation="fadeInUp" delay={800}>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={handleAddToCalendar}
              disabled={addingToCalendar}
              activeOpacity={0.7}
            >
              {addingToCalendar ? (
                <ActivityIndicator size="small" color="#667eea" />
              ) : (
                <>
                  <Ionicons name="calendar-outline" size={20} color="#667eea" />
                  <Text style={styles.calendarButtonText}>Add to Calendar</Text>
                </>
              )}
            </TouchableOpacity>
          </Animatable.View>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Register Button (Fixed at Bottom) */}
      <Animatable.View
        animation="fadeInUp"
        delay={900}
        style={styles.registerButtonContainer}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleRegister}
          disabled={isButtonDisabled}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={
              isRegistered
                ? ['#10B981', '#059669']
                : isPast
                ? ['#9CA3AF', '#6B7280']
                : isFull
                ? ['#EF4444', '#DC2626']
                : societyColor.gradient
            }
            style={[styles.registerButton, isButtonDisabled && styles.registerButtonDisabled]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {registering ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={
                    isRegistered
                      ? 'checkmark-circle'
                      : isPast
                      ? 'close-circle'
                      : isFull
                      ? 'ban'
                      : 'add-circle-outline'
                  }
                  size={24}
                  color="#fff"
                />
                <Text style={styles.registerButtonText}>
                  {isRegistered
                    ? 'Registered ✓'
                    : isPast
                    ? 'Event Ended'
                    : isFull
                    ? 'Event Full'
                    : 'Register Now'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroContainer: {
    height: height * 0.35,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButtonHero: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  shareButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  societyBadgeContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  societyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  societyBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
    lineHeight: 36,
  },
  infoSection: {
    gap: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fullBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fullBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  registeredSection: {
    marginBottom: 24,
  },
  registeredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  registeredCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginLeft: -8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  moreAvatars: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAvatarsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#667eea',
  },
  noRegistrationsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    gap: 8,
  },
  calendarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  registerButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  registerButtonDisabled: {
    opacity: 0.8,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
