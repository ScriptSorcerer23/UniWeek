import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common';
import { Event } from '../../types';
import { SOCIETY_COLORS, APP_THEME } from '../../utils/constants';
import { formatDate, getAvailableSpots, isEventFull } from '../../utils/helpers';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  isRegistered?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress, isRegistered = false }) => {
  const societyColor = SOCIETY_COLORS[event.society];
  const isFull = isEventFull(event);
  const availableSpots = getAvailableSpots(event);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card>
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: societyColor }]}>
            <Text style={styles.badgeText}>{event.society}</Text>
          </View>
          {isRegistered && (
            <View style={styles.registeredBadge}>
              <Ionicons name="checkmark-circle" size={20} color={APP_THEME.colors.accent} />
              <Text style={styles.registeredText}>Registered</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.category}>{event.category}</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={APP_THEME.colors.textSecondary} />
          <Text style={styles.infoText}>{formatDate(event.date)} • {event.time}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={APP_THEME.colors.textSecondary} />
          <Text style={styles.infoText}>{event.venue}</Text>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.capacityContainer}>
            <Ionicons name="people-outline" size={16} color={APP_THEME.colors.textSecondary} />
            <Text style={styles.capacityText}>
              {event.registeredStudents.length}/{event.capacity}
            </Text>
          </View>
          {isFull && <Text style={styles.fullText}>FULL</Text>}
          {!isFull && <Text style={styles.spotsText}>{availableSpots} spots left</Text>}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: APP_THEME.spacing.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  registeredText: {
    color: APP_THEME.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_THEME.colors.text,
    marginBottom: APP_THEME.spacing.xs,
  },
  category: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    marginBottom: APP_THEME.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: APP_THEME.spacing.xs,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: APP_THEME.spacing.md,
    paddingTop: APP_THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.border,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
  },
  fullText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_THEME.colors.error,
  },
  spotsText: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
  },
});
