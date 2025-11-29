import React from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import { EventCard } from './EventCard';
import { Event } from '../../types';
import { APP_THEME } from '../../utils/constants';

interface EventListProps {
  events: Event[];
  onEventPress: (event: Event) => void;
  registeredEventIds?: string[];
  emptyMessage?: string;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  onEventPress,
  registeredEventIds = [],
  emptyMessage = 'No events available',
}) => {
  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <EventCard
          event={item}
          onPress={() => onEventPress(item)}
          isRegistered={registeredEventIds.includes(item.id)}
        />
      )}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: APP_THEME.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: APP_THEME.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
  },
});
