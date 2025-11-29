import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  },

  /**
   * Get push notification token
   */
  async getPushToken(): Promise<string | null> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  /**
   * Schedule local notification for event reminder
   */
  async scheduleEventReminder(
    eventId: string,
    eventTitle: string,
    eventDate: Date
  ): Promise<string> {
    // Schedule notification 24 hours before event
    const reminderDate = new Date(eventDate);
    reminderDate.setHours(reminderDate.getHours() - 24);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Event Reminder 📅',
        body: `${eventTitle} is tomorrow!`,
        data: { eventId },
      },
      trigger: reminderDate,
    });

    return notificationId;
  },

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  /**
   * Send custom notification to registered students
   */
  async sendCustomNotification(
    eventId: string,
    title: string,
    body: string,
    sentBy: string
  ): Promise<void> {
    // Store notification in database
    const { error } = await supabase.from('notifications').insert([
      {
        title,
        body,
        event_id: eventId,
        sent_by: sentBy,
        sent_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    // In production, you would send push notifications via a backend service
    // For now, we'll schedule a local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { eventId },
      },
      trigger: null, // Send immediately
    });
  },

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('sent_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
