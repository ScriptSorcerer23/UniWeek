import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../services/supabase';
import { SOCIETY_COLORS, APP_THEME, EVENT_CATEGORIES } from '../../utils/constants';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  society: string;
  category: string;
  capacity: number;
  image_url?: string;
}

const SOCIETIES = ['ACM', 'CLS', 'CSS'];

export const SearchFilterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Filter states
  const [selectedSocieties, setSelectedSocieties] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      fetchEvents();
    }, 400);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, selectedSocieties, selectedCategories, fromDate, toDate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let query = supabase.from('events').select('*');

      // Text search
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Society filter
      if (selectedSocieties.length > 0) {
        query = query.in('society', selectedSocieties);
      }

      // Category filter
      if (selectedCategories.length > 0) {
        query = query.in('category', selectedCategories);
      }

      // Date range filter
      if (fromDate) {
        const fromDateStr = fromDate.toISOString().split('T')[0];
        query = query.gte('date', fromDateStr);
      }
      if (toDate) {
        const toDateStr = toDate.toISOString().split('T')[0];
        query = query.lte('date', toDateStr);
      }

      query = query.order('date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSociety = (society: string) => {
    setSelectedSocieties((prev) =>
      prev.includes(society) ? prev.filter((s) => s !== society) : [...prev, society]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSocieties([]);
    setSelectedCategories([]);
    setFromDate(null);
    setToDate(null);
  };

  const handleApplyFilters = () => {
    setFiltersExpanded(false);
    fetchEvents();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateShort = (date: Date | null): string => {
    if (!date) return 'Select';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const societyColor = SOCIETY_COLORS[item.society as keyof typeof SOCIETY_COLORS] || '#2196F3';

    return (
      <TouchableOpacity
        style={styles.eventCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
      >
        <View style={[styles.eventCardAccent, { backgroundColor: societyColor }]} />
        
        <View style={styles.eventCardContent}>
          <View style={styles.eventCardHeader}>
            <View style={[styles.societyBadge, { backgroundColor: societyColor }]}>
              <Text style={styles.societyText}>{item.society}</Text>
            </View>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>

          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          <View style={styles.eventMeta}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.time}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.venue}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const activeFiltersCount =
    selectedSocieties.length +
    selectedCategories.length +
    (fromDate ? 1 : 0) +
    (toDate ? 1 : 0);

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
        <Text style={styles.headerTitle}>Search & Filter</Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
        {activeFiltersCount === 0 && <View style={{ width: 70 }} />}
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setFiltersExpanded(!filtersExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.filterToggleLeft}>
          <Ionicons name="filter-outline" size={20} color={APP_THEME.colors.primary} />
          <Text style={styles.filterToggleText}>Filters</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={filtersExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </TouchableOpacity>

      {/* Collapsible Filters */}
      {filtersExpanded && (
        <Animatable.View animation="fadeInDown" duration={300} style={styles.filtersContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Society Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Society</Text>
              <View style={styles.checkboxGroup}>
                {SOCIETIES.map((society) => {
                  const isSelected = selectedSocieties.includes(society);
                  const color = SOCIETY_COLORS[society as keyof typeof SOCIETY_COLORS];
                  return (
                    <TouchableOpacity
                      key={society}
                      style={styles.checkboxItem}
                      onPress={() => toggleSociety(society)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && { backgroundColor: color, borderColor: color },
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                      </View>
                      <Text style={styles.checkboxLabel}>{society}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.chipsGroup}>
                {EVENT_CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category);
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                      onPress={() => toggleCategory(category)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextSelected,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Date Range</Text>
              <View style={styles.dateRangeRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowFromDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dateLabel}>From</Text>
                  <Text style={styles.dateValue}>{formatDateShort(fromDate)}</Text>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowToDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dateLabel}>To</Text>
                  <Text style={styles.dateValue}>{formatDateShort(toDate)}</Text>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilters}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[APP_THEME.colors.primary, '#764BA2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.applyButtonGradient}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Animatable.View>
      )}

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>Found {events.length} events</Text>
        {loading && <ActivityIndicator size="small" color={APP_THEME.colors.primary} />}
      </View>

      {/* Results List */}
      {loading && events.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_THEME.colors.primary} />
          <Text style={styles.loadingText}>Searching events...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Animatable.View animation="fadeIn" duration={600}>
            <Ionicons name="search-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or filters
            </Text>
          </Animatable.View>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Date Pickers */}
      {showFromDatePicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowFromDatePicker(false);
            if (date) setFromDate(date);
          }}
        />
      )}
      {showToDatePicker && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowToDatePicker(false);
            if (date) setToDate(date);
          }}
        />
      )}
    </View>
  );
};

export default SearchFilterScreen;

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
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.primary,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 12,
  },
  clearSearchButton: {
    padding: 4,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  filterBadge: {
    backgroundColor: APP_THEME.colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  checkboxGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  chipsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipSelected: {
    backgroundColor: APP_THEME.colors.primary,
    borderColor: APP_THEME.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  dateValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  applyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  applyButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  eventCardAccent: {
    height: 4,
  },
  eventCardContent: {
    padding: 16,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  societyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  societyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
