// Student Dashboard - Browse and filter events
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { EventList, FilterBar } from '../../components/events';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { Event, SocietyType, EventCategory } from '../../types';
import { APP_THEME } from '../../utils/constants';
import { Ionicons } from '@expo/vector-icons';

export const StudentDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { events } = useEvents();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [societyFilter, setSocietyFilter] = useState<SocietyType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  useEffect(() => {
    let filtered = events;

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply society filter
    if (societyFilter) {
      filtered = filtered.filter((event) => event.society === societyFilter);
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((event) => event.category === categoryFilter);
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, societyFilter, categoryFilter]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={APP_THEME.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FilterBar
        onSocietyFilter={setSocietyFilter}
        onCategoryFilter={setCategoryFilter}
      />

      <EventList
        events={filteredEvents}
        onEventPress={(event) => navigation.navigate('EventDetails', { event })}
        registeredEventIds={user?.registeredEvents || []}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.surface,
    margin: APP_THEME.spacing.md,
    padding: APP_THEME.spacing.md,
    borderRadius: APP_THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: APP_THEME.spacing.sm,
    fontSize: 16,
  },
});
