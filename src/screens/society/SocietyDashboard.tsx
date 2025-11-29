// Society Dashboard - Manage events
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Button, Card } from '../../components/common';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { Event } from '../../types';
import { APP_THEME } from '../../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../utils/helpers';

export const SocietyDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { events, deleteEvent } = useEvents();
  const { user } = useAuth();
  const [myEvents, setMyEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (user) {
      // Filter events created by this society
      const filtered = events.filter((event) => event.createdBy === user.id);
      setMyEvents(filtered);
    }
  }, [events, user]);

  const handleDelete = (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(eventId);
              Alert.alert('Success', 'Event deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Could not delete event');
            }
          },
        },
      ]
    );
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <Card>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDate}>{formatDate(item.date)} • {item.time}</Text>
      <Text style={styles.registrations}>
        {item.registeredStudents.length} registrations
      </Text>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditEvent', { event: item })}
        >
          <Ionicons name="create-outline" size={20} color={APP_THEME.colors.primary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EventAnalytics', { event: item })}
        >
          <Ionicons name="stats-chart-outline" size={20} color={APP_THEME.colors.primary} />
          <Text style={styles.actionText}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={APP_THEME.colors.error} />
          <Text style={[styles.actionText, { color: APP_THEME.colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Button
        title="Create New Event"
        onPress={() => navigation.navigate('CreateEvent')}
        style={styles.createButton}
      />

      {myEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No events created yet</Text>
        </View>
      ) : (
        <FlatList
          data={myEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.list}
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
  createButton: {
    margin: APP_THEME.spacing.md,
  },
  list: {
    padding: APP_THEME.spacing.md,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_THEME.colors.text,
    marginBottom: APP_THEME.spacing.xs,
  },
  eventDate: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    marginBottom: APP_THEME.spacing.sm,
  },
  registrations: {
    fontSize: 14,
    color: APP_THEME.colors.primary,
    marginBottom: APP_THEME.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.border,
    paddingTop: APP_THEME.spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: APP_THEME.colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: APP_THEME.colors.textSecondary,
  },
});
