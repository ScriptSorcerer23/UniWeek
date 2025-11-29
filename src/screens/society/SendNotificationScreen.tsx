import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

// Society colors
const SOCIETY_COLORS = {
  ACM: { primary: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] as const },
  CLS: { primary: '#10B981', gradient: ['#10B981', '#059669'] as const },
  CSS: { primary: '#F97316', gradient: ['#F97316', '#EA580C'] as const },
};

interface SendNotificationScreenProps {
  navigation: any;
  route: {
    params: {
      eventId: string;
      eventTitle: string;
    };
  };
}

export const SendNotificationScreen: React.FC<SendNotificationScreenProps> = ({
  navigation,
  route,
}) => {
  const { eventId, eventTitle } = route.params;
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [registeredCount, setRegisteredCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const societyColor = user?.societyType
    ? SOCIETY_COLORS[user.societyType]
    : SOCIETY_COLORS.ACM;

  const MAX_TITLE_LENGTH = 50;
  const MAX_MESSAGE_LENGTH = 200;

  useEffect(() => {
    fetchRegisteredCount();
  }, [eventId]);

  const fetchRegisteredCount = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('user_id')
        .eq('event_id', eventId);

      if (error) throw error;

      setRegisteredCount(data?.length || 0);
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a notification title');
      return false;
    }

    if (title.trim().length < 3) {
      Alert.alert('Validation Error', 'Title must be at least 3 characters');
      return false;
    }

    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please enter a notification message');
      return false;
    }

    if (message.trim().length < 10) {
      Alert.alert('Validation Error', 'Message must be at least 10 characters');
      return false;
    }

    if (registeredCount === 0) {
      Alert.alert('No Recipients', 'There are no registered students for this event');
      return false;
    }

    return true;
  };

  const handleSendNotification = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);

    try {
      // Fetch all registered student IDs
      const { data: registrations, error: fetchError } = await supabase
        .from('registrations')
        .select('user_id')
        .eq('event_id', eventId);

      if (fetchError) throw fetchError;

      if (!registrations || registrations.length === 0) {
        Alert.alert('Error', 'No registered students found');
        setLoading(false);
        return;
      }

      const recipientIds = registrations.map((reg) => reg.user_id);

      // Store notification in Supabase for each user (batch insert)
      const notifications = recipientIds.map((userId) => ({
        title: title.trim(),
        body: message.trim(),
        event_id: eventId,
        recipient_id: userId,
        sent_by: user.id,
        sent_at: new Date().toISOString(),
        read: false,
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      // TODO: Send actual push notifications using expo-notifications
      // This would require implementing push notification tokens and sending through Expo's push notification service
      // For now, we're storing in database which can be used to display in-app notifications

      // Show success animation
      setShowSuccess(true);

      // Navigate back after 2 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', error.message || 'Failed to send notification');
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <LinearGradient
          colors={societyColor.gradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animatable.View animation="bounceIn" duration={800} style={styles.successContent}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={60} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Notification Sent! 🎉</Text>
          <Text style={styles.successText}>
            Sent to {registeredCount} {registeredCount === 1 ? 'student' : 'students'}
          </Text>
        </Animatable.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={societyColor.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Notification</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {eventTitle}
          </Text>
          <View style={styles.recipientBadge}>
            <Ionicons name="people" size={16} color="#fff" />
            <Text style={styles.recipientText}>
              {registeredCount} {registeredCount === 1 ? 'Recipient' : 'Recipients'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Notification Form Section */}
        <Animatable.View animation="fadeInUp" duration={600} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={24} color={societyColor.primary} />
            <Text style={styles.sectionTitle}>Compose Notification</Text>
          </View>

          {/* Title Input */}
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="Notification Title *"
              placeholder="Enter notification title"
              value={title}
              onChangeText={(text) => {
                if (text.length <= MAX_TITLE_LENGTH) {
                  setTitle(text);
                }
              }}
              style={styles.input}
              outlineColor="#e0e0e0"
              activeOutlineColor={societyColor.primary}
              right={
                <TextInput.Affix
                  text={`${title.length}/${MAX_TITLE_LENGTH}`}
                  textStyle={styles.charCounter}
                />
              }
            />
          </View>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="Notification Message *"
              placeholder="Enter notification message"
              value={message}
              onChangeText={(text) => {
                if (text.length <= MAX_MESSAGE_LENGTH) {
                  setMessage(text);
                }
              }}
              multiline
              numberOfLines={6}
              style={[styles.input, styles.textArea]}
              outlineColor="#e0e0e0"
              activeOutlineColor={societyColor.primary}
            />
            <Text style={styles.charCounterBottom}>
              {message.length}/{MAX_MESSAGE_LENGTH} characters
            </Text>
          </View>
        </Animatable.View>

        {/* Preview Section */}
        <Animatable.View animation="fadeInUp" delay={200} duration={600} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={24} color={societyColor.primary} />
            <Text style={styles.sectionTitle}>Preview</Text>
          </View>

          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewIconContainer}>
                <LinearGradient
                  colors={societyColor.gradient}
                  style={styles.previewIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="notifications" size={20} color="#fff" />
                </LinearGradient>
              </View>
              <View style={styles.previewTextContainer}>
                <Text style={styles.previewTitle} numberOfLines={2}>
                  {title || 'Notification Title'}
                </Text>
                <Text style={styles.previewMessage} numberOfLines={3}>
                  {message || 'Your notification message will appear here...'}
                </Text>
              </View>
            </View>
            <Text style={styles.previewTime}>Just now</Text>
          </View>

          <View style={styles.previewNote}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.previewNoteText}>
              This is how your notification will appear to students
            </Text>
          </View>
        </Animatable.View>

        {/* Send Button */}
        <Animatable.View animation="fadeInUp" delay={400} duration={600}>
          <TouchableOpacity
            onPress={handleSendNotification}
            disabled={loading || registeredCount === 0}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                loading || registeredCount === 0
                  ? ['#ccc', '#999']
                  : societyColor.gradient
              }
              style={styles.sendButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={24} color="#fff" />
                  <Text style={styles.sendButtonText}>
                    Send to All Registered Students
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {registeredCount === 0 && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                No registered students for this event
              </Text>
            </View>
          )}
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  eventInfo: {
    gap: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  recipientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
  },
  recipientText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 120,
  },
  charCounter: {
    fontSize: 12,
    color: '#999',
  },
  charCounterBottom: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  previewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  previewHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  previewIconContainer: {
    alignSelf: 'flex-start',
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTextContainer: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  previewMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  previewTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  previewNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  previewNoteText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  sendButton: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    gap: 20,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  successText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
});
