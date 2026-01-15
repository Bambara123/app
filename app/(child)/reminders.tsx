// app/(child)/reminders.tsx
// Child Reminders Screen (can create/edit/delete)

import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReminderCard, ReminderFilters } from '../../src/components/reminders';
import { useReminderStore, useUserStore, useAuthStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';
import { Reminder } from '../../src/types';

export default function ChildRemindersScreen() {
  const { profile, partner } = useUserStore();
  const { user } = useAuthStore();
  const {
    filteredReminders,
    filters,
    setFilters,
    initialize,
    deleteReminder,
    setSelectedReminder,
  } = useReminderStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const isConnected = !!user?.connectedTo;
  const partnerDisplayName = user?.partnerCallName || partner?.name || 'Parent';

  useEffect(() => {
    if (profile?.id && isConnected) {
      const unsubscribe = initialize(profile.id, false);
      return unsubscribe;
    }
  }, [profile?.id, isConnected]);

  const handleNavigateToConnect = () => {
    router.push('/(auth)/partner-connection');
  };

  const handleCreateReminder = () => {
    if (!isConnected) {
      handleNavigateToConnect();
      return;
    }
    setSelectedReminder(null);
    router.push('/modals/create-reminder');
  };

  const handleEditReminder = (reminder: Reminder) => {
    if (!isConnected) {
      handleNavigateToConnect();
      return;
    }
    setSelectedReminder(reminder);
    router.push('/modals/create-reminder');
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!isConnected) {
      handleNavigateToConnect();
      return;
    }
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
          style={[styles.addButton, !isConnected && styles.addButtonDisabled]}
        >
          <Ionicons name="add" size={24} color={colors.neutral.white} />
        </TouchableOpacity>
      </View>

      {/* Not Connected Banner */}
      {!isConnected && (
        <TouchableOpacity style={styles.notConnectedBanner} onPress={handleNavigateToConnect}>
          <Ionicons name="link-outline" size={20} color={colors.warning.dark} />
          <Text style={styles.notConnectedText}>
            Connect with your parent to create reminders
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.warning.dark} />
        </TouchableOpacity>
      )}

      {/* Filters - Disabled style when not connected */}
      <View style={!isConnected && styles.disabledOverlay}>
        <ReminderFilters
          searchQuery={filters.searchQuery}
          selectedLabel={filters.label}
          selectedStatus={filters.status}
          onSearchChange={(query) => isConnected && setFilters({ searchQuery: query })}
          onLabelChange={(label) => isConnected && setFilters({ label })}
          onStatusChange={(status) => isConnected && setFilters({ status })}
        />
      </View>

      {/* Reminders List */}
      <FlatList
        data={isConnected ? filteredReminders : []}
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
            <Ionicons 
              name={isConnected ? "alarm-outline" : "link-outline"} 
              size={64} 
              color={colors.neutral[300]} 
            />
            <Text style={styles.emptyText}>
              {isConnected ? 'No reminders yet' : 'Not connected'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isConnected 
                ? `Create a reminder for ${partnerDisplayName}`
                : 'Connect with your parent to start creating reminders'
              }
            </Text>
            <TouchableOpacity
              onPress={isConnected ? handleCreateReminder : handleNavigateToConnect}
              style={styles.createButton}
            >
              <Ionicons name={isConnected ? "add" : "link"} size={20} color={colors.neutral.white} />
              <Text style={styles.createButtonText}>
                {isConnected ? 'Create Reminder' : 'Connect Now'}
              </Text>
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
  addButtonDisabled: {
    opacity: 0.5,
  },
  notConnectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning.light,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  notConnectedText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning.dark,
    fontWeight: '500',
  },
  disabledOverlay: {
    opacity: 0.5,
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
    paddingHorizontal: spacing[6],
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

