// app/(parent)/reminders.tsx
// Parent Reminders Screen (view-only with filters)

import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReminderCard, ReminderFilters } from '../../src/components/reminders';
import { useReminderStore, useUserStore } from '../../src/stores';
import { colors, spacing, typography } from '../../src/constants';
import { ReminderFilterLabel, ReminderFilterStatus } from '../../src/types';

export default function ParentRemindersScreen() {
  const { profile } = useUserStore();
  const {
    filteredReminders,
    filters,
    setFilters,
    initialize,
    markAsDone,
    snooze,
  } = useReminderStore();

  useEffect(() => {
    if (profile?.id) {
      const unsubscribe = initialize(profile.id, true);
      return unsubscribe;
    }
  }, [profile?.id]);

  const handleDone = async (reminderId: string) => {
    await markAsDone(reminderId);
  };

  const handleSnooze = async (reminderId: string) => {
    await snooze(reminderId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
      </View>

      {/* Filters */}
      <ReminderFilters
        searchQuery={filters.searchQuery}
        selectedLabel={filters.label}
        selectedStatus={filters.status}
        onSearchChange={(query) => setFilters({ searchQuery: query })}
        onLabelChange={(label) => setFilters({ label })}
        onStatusChange={(status) => setFilters({ status })}
      />

      {/* Reminders List */}
      <FlatList
        data={filteredReminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ReminderCard
            reminder={item}
            isParent
            onDone={() => handleDone(item.id)}
            onSnooze={() => handleSnooze(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reminders found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 32,
    color: colors.text.primary,
  },
  list: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[20],
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
  },
});

