import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { SOCIETY_COLORS, APP_THEME } from '../../utils/constants';

interface Event {
  id: string;
  title: string;
  date: string;
  society: string;
  time?: string;
  venue?: string;
}

const QUICK_FEEDBACK = [
  'Great! 🎉',
  'Well Organized 👏',
  'Learned a lot 📚',
  'Could be better 💡',
];

const MAX_FEEDBACK_LENGTH = 500;

export const RateEventScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const { eventId, registrationId } = route.params;

  const [event, setEvent] = useState<Event | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const starScales = useRef(Array.from({ length: 5 }, () => new Animated.Value(1))).current;

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, society, time, venue')
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

  const handleStarPress = (starIndex: number) => {
    setRating(starIndex + 1);

    // Animate the pressed star
    Animated.sequence([
      Animated.timing(starScales[starIndex], {
        toValue: 1.4,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(starScales[starIndex], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleChipPress = (chip: string) => {
    if (selectedChips.includes(chip)) {
      // Remove chip and its text from feedback
      setSelectedChips(selectedChips.filter((c) => c !== chip));
      const chipTextToRemove = chip.replace(/[^\w\s!]/g, '').trim();
      const updatedFeedback = feedback
        .replace(chipTextToRemove, '')
        .replace(/\s+/g, ' ')
        .trim();
      setFeedback(updatedFeedback);
    } else {
      // Add chip
      setSelectedChips([...selectedChips, chip]);
      const chipText = chip.replace(/[^\w\s!]/g, '').trim();
      const newFeedback = feedback ? `${feedback} ${chipText}` : chipText;
      if (newFeedback.length <= MAX_FEEDBACK_LENGTH) {
        setFeedback(newFeedback);
      }
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide a star rating before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          rating,
          feedback: feedback.trim() || null,
          attended: true,
          feedback_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)
        .eq('event_id', eventId);

      if (error) throw error;

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1800);
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', error.message || 'Failed to submit rating. Please try again.');
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading event...</Text>
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

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <Animatable.View animation="bounceIn" duration={800}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-circle" size={120} color="#4CAF50" />
          </View>
        </Animatable.View>
        <Animatable.Text animation="fadeInUp" delay={400} style={styles.successText}>
          Thank you for your feedback!
        </Animatable.Text>
        <Animatable.Text animation="fadeInUp" delay={600} style={styles.successSubtext}>
          Your rating has been submitted
        </Animatable.Text>
      </View>
    );
  }

  const societyColor = SOCIETY_COLORS[event.society as keyof typeof SOCIETY_COLORS] || '#2196F3';
  const canSubmit = rating > 0 && !submitting;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Event Card */}
        <Animatable.View animation="fadeInDown" duration={600} style={styles.eventCard}>
          <View style={styles.eventCardContent}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
              {event.venue && (
                <Text style={styles.eventVenue}>
                  <Ionicons name="location-outline" size={14} color="#666" /> {event.venue}
                </Text>
              )}
            </View>
            <View style={[styles.societyBadge, { backgroundColor: societyColor }]}>
              <Text style={styles.societyText}>{event.society}</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Rating Section */}
        <Animatable.View animation="fadeInUp" delay={200} duration={600} style={styles.section}>
          <Text style={styles.sectionTitle}>How was your experience?</Text>

          {/* Star Rating */}
          <View style={styles.starsContainer}>
            {[0, 1, 2, 3, 4].map((index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleStarPress(index)}
                activeOpacity={0.8}
                style={styles.starButton}
              >
                <Animated.View style={{ transform: [{ scale: starScales[index] }] }}>
                  <Ionicons
                    name={index < rating ? 'star' : 'star-outline'}
                    size={48}
                    color={index < rating ? '#FFC107' : '#E0E0E0'}
                  />
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Animatable.Text animation="fadeIn" style={styles.ratingText}>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent!'}
            </Animatable.Text>
          )}
        </Animatable.View>

        {/* Quick Feedback Chips */}
        <Animatable.View animation="fadeInUp" delay={400} duration={600} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Feedback</Text>
          <View style={styles.chipsContainer}>
            {QUICK_FEEDBACK.map((chip) => (
              <TouchableOpacity
                key={chip}
                onPress={() => handleChipPress(chip)}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  selectedChips.includes(chip) && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedChips.includes(chip) && styles.chipTextSelected,
                  ]}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>

        {/* Feedback Textarea */}
        <Animatable.View animation="fadeInUp" delay={600} duration={600} style={styles.section}>
          <Text style={styles.sectionTitle}>Share your thoughts (optional)</Text>
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={6}
            placeholder="Tell us more about your experience..."
            placeholderTextColor="#999"
            value={feedback}
            onChangeText={(text) => {
              if (text.length <= MAX_FEEDBACK_LENGTH) {
                setFeedback(text);
              }
            }}
            maxLength={MAX_FEEDBACK_LENGTH}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {feedback.length}/{MAX_FEEDBACK_LENGTH}
          </Text>
        </Animatable.View>

        {/* Submit Button */}
        <Animatable.View animation="fadeInUp" delay={800} duration={600} style={styles.section}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.9}
            style={[styles.submitButtonContainer, !canSubmit && styles.submitButtonDisabled]}
          >
            <LinearGradient
              colors={
                canSubmit
                  ? [APP_THEME.colors.primary, '#764BA2']
                  : ['#ccc', '#999']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit Rating</Text>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </View>
  );
};

export default RateEventScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: APP_THEME.colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 13,
    color: '#666',
  },
  societyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  societyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.primary,
    marginTop: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  chipSelected: {
    backgroundColor: APP_THEME.colors.primary,
    borderColor: APP_THEME.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  chipTextSelected: {
    color: '#fff',
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  submitButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.1,
    elevation: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  successCircle: {
    marginBottom: 24,
  },
  successText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 16,
    color: '#666',
  },
});
