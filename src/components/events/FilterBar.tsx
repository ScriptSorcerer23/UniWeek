import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SocietyType, EventCategory } from '../../types';
import { SOCIETY_COLORS, EVENT_CATEGORIES, APP_THEME } from '../../utils/constants';

interface FilterBarProps {
  onSocietyFilter: (society: SocietyType | null) => void;
  onCategoryFilter: (category: EventCategory | null) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onSocietyFilter, onCategoryFilter }) => {
  const [selectedSociety, setSelectedSociety] = useState<SocietyType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);

  const societies: SocietyType[] = ['ACM', 'CLS', 'CSS'];

  const handleSocietyPress = (society: SocietyType) => {
    const newSelection = selectedSociety === society ? null : society;
    setSelectedSociety(newSelection);
    onSocietyFilter(newSelection);
  };

  const handleCategoryPress = (category: EventCategory) => {
    const newSelection = selectedCategory === category ? null : category;
    setSelectedCategory(newSelection);
    onCategoryFilter(newSelection);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Society</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {societies.map((society) => (
          <TouchableOpacity
            key={society}
            style={[
              styles.chip,
              selectedSociety === society && {
                backgroundColor: SOCIETY_COLORS[society],
              },
            ]}
            onPress={() => handleSocietyPress(society)}
          >
            <Text
              style={[
                styles.chipText,
                selectedSociety === society && styles.chipTextActive,
              ]}
            >
              {society}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {EVENT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.chip,
              selectedCategory === category && styles.chipActive,
            ]}
            onPress={() => handleCategoryPress(category as EventCategory)}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === category && styles.chipTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: APP_THEME.colors.surface,
    paddingVertical: APP_THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginBottom: APP_THEME.spacing.sm,
    paddingHorizontal: APP_THEME.spacing.md,
  },
  chipRow: {
    paddingHorizontal: APP_THEME.spacing.md,
    marginBottom: APP_THEME.spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: APP_THEME.colors.background,
    marginRight: APP_THEME.spacing.sm,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
  },
  chipActive: {
    backgroundColor: APP_THEME.colors.primary,
    borderColor: APP_THEME.colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: APP_THEME.colors.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
