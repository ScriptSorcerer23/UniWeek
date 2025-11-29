// Event Details Screen - View and register for events
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card } from '../../components/common';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { Event } from '../../types';
import { SOCIETY_COLORS, APP_THEME } from '../../utils/constants';
import { formatDate, isEventFull, getAvailableSpots } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export const EventDetails: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { event }: { event: Event } = route.params;
  const { registerForEvent, unregisterFromEvent, loading } = useEvents();
  const { user } = useAuth();
  
  const isRegistered = user?.registeredEvents.includes(event.id) || false;
  const isFull = isEventFull(event);
  const availableSpots = getAvailableSpots(event);

  const handleRegister = async () => {
    try {
      await registerForEvent(event.id);
      Alert.alert('Success', 'You have registered for this event!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not register');
    }
  };

  const handleUnregister = async () => {
    Alert.alert(
      'Unregister',
      'Are you sure you want to unregister from this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unregister',
          style: 'destructive',
          onPress: async () => {
            try {
              await unregisterFromEvent(event.id);
              Alert.alert('Success', 'You have unregistered from this event');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Could not unregister');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: SOCIETY_COLORS[event.society] }]}>
        <Text style={styles.society}>{event.society}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.category}>{event.category}</Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{event.description}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Event Details</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color={APP_THEME.colors.textSecondary} />
          <Text style={styles.detailText}>{formatDate(event.date)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={20} color={APP_THEME.colors.textSecondary} />
          <Text style={styles.detailText}>{event.time}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={20} color={APP_THEME.colors.textSecondary} />
          <Text style={styles.detailText}>{event.venue}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={20} color={APP_THEME.colors.textSecondary} />
          <Text style={styles.detailText}>
            {event.registeredStudents.length} / {event.capacity} registered
          </Text>
        </View>

        {!isFull && (
          <Text style={styles.spotsText}>{availableSpots} spots available</Text>
        )}
        {isFull && <Text style={styles.fullText}>Event is full</Text>}
      </Card>

      <View style={styles.buttonContainer}>
        {isRegistered ? (
          <Button
            title="Unregister"
            onPress={handleUnregister}
            variant="outline"
            loading={loading}
          />
        ) : (
          <Button
            title={isFull ? 'Event Full' : 'Register Now'}
            onPress={handleRegister}
            disabled={isFull}
            loading={loading}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  header: {
    padding: APP_THEME.spacing.xl,
    marginBottom: APP_THEME.spacing.md,
  },
  society: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: APP_THEME.spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: APP_THEME.spacing.sm,
  },
  category: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_THEME.colors.text,
    marginBottom: APP_THEME.spacing.md,
  },
  description: {
    fontSize: 16,
    color: APP_THEME.colors.textSecondary,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: APP_THEME.spacing.md,
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: APP_THEME.colors.text,
  },
  spotsText: {
    fontSize: 14,
    color: APP_THEME.colors.accent,
    marginTop: APP_THEME.spacing.sm,
  },
  fullText: {
    fontSize: 14,
    color: APP_THEME.colors.error,
    fontWeight: '600',
    marginTop: APP_THEME.spacing.sm,
  },
  buttonContainer: {
    padding: APP_THEME.spacing.lg,
  },
});
