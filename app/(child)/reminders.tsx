// app/(child)/reminders.tsx
// Child Reminders Screen (can create/edit/delete)

import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ReminderCard, ReminderFilters } from '../../src/components/reminders';
import { useReminderStore, useUserStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';
import { Reminder } from '../../src/types';

export default function ChildRemindersScreen() {
  const { profile, partner } = useUserStore();
  const {
    filteredReminders,
    filters,
    setFilters,
    initialize,
    deleteReminder,
    setSelectedReminder,
  } = useReminderStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      const unsubscribe = initialize(profile.id, false);
      return unsubscribe;
    }
  }, [profile?.id]);

  const handleCreateReminder = () => {
    // In a full implementation, navigate to create screen or show modal
    Alert.alert(
      'Create Reminder',
      'Reminder creation UI would open here. For demo, reminders are pre-populated.',
      [{ text: 'OK' }]
    );
  };

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    // Navigate to edit screen
    Alert.alert(
      'Edit Reminder',
      `Editing: ${reminder.title}`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteReminder = async (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteReminder(reminderId);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <TouchableOpacity
          onPress={handleCreateReminder}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={colors.neutral.white} />
        </TouchableOpacity>
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
            isParent={false}
            onPress={() => handleEditReminder(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="alarm-outline" size={64} color={colors.neutral[300]} />
            <Text style={styles.emptyText}>No reminders yet</Text>
            <Text style={styles.emptySubtext}>
              Create a reminder for {partner?.name || 'your parent'}
            </Text>
            <TouchableOpacity
              onPress={handleCreateReminder}
              style={styles.createButton}
            >
              <Ionicons name="add" size={20} color={colors.neutral.white} />
              <Text style={styles.createButtonText}>Create Reminder</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 32,
    color: colors.text.primary,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginTop: spacing[4],
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    marginTop: spacing[2],
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius.full,
    gap: spacing[2],
  },
  createButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral.white,
    fontWeight: '600',
  },
});

