// src/components/reminders/ReminderFilters.tsx
// Filter chips and search for reminders

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '../common';
import { colors, spacing, radius, typography, reminderIcons } from '../../constants';
import { ReminderFilterLabel, ReminderFilterStatus } from '../../types';

interface ReminderFiltersProps {
  searchQuery: string;
  selectedLabel: ReminderFilterLabel;
  selectedStatus: ReminderFilterStatus;
  onSearchChange: (query: string) => void;
  onLabelChange: (label: ReminderFilterLabel) => void;
  onStatusChange: (status: ReminderFilterStatus) => void;
}

const labelFilters: { id: ReminderFilterLabel; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'medicine', label: 'Medicine', icon: 'medical' },
  { id: 'meal', label: 'Meal', icon: 'restaurant' },
  { id: 'doctor', label: 'Doctor', icon: 'medkit' },
  { id: 'exercise', label: 'Exercise', icon: 'fitness' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export const ReminderFilters: React.FC<ReminderFiltersProps> = ({
  searchQuery,
  selectedLabel,
  selectedStatus,
  onSearchChange,
  onLabelChange,
  onStatusChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="Search reminders..."
        style={styles.searchBar}
      />

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        {labelFilters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            onPress={() => onLabelChange(filter.id)}
            style={[
              styles.filterChip,
              selectedLabel === filter.id && styles.filterChipActive,
            ]}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={
                selectedLabel === filter.id
                  ? colors.neutral.white
                  : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.filterChipText,
                selectedLabel === filter.id && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    paddingVertical: spacing[3],
  },
  searchBar: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  filtersScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    gap: spacing[1],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.neutral.white,
    fontWeight: '500',
  },
});

