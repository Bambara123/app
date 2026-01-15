// app/(parent)/reminders.tsx
// Parent Reminders Screen (view-only with filters)

import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReminderCard, ReminderFilters } from '../../src/components/reminders';
import { useReminderStore, useUserStore, useAuthStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';

export default function ParentRemindersScreen() {
  const { profile, partner } = useUserStore();
  const { user } = useAuthStore();
  const {
    filteredReminders,
    filters,
    setFilters,
    initialize,
    markAsDone,
    snooze,
  } = useReminderStore();

  const isConnected = !!user?.connectedTo;
  const partnerDisplayName = user?.partnerCallName || partner?.name || 'Caregiver';

  useEffect(() => {
    if (profile?.id && isConnected) {
      const unsubscribe = initialize(profile.id, true);
      return unsubscribe;
    }
  }, [profile?.id, isConnected]);

  const handleNavigateToConnect = () => {
    router.push('/(auth)/partner-connection');
  };

  const handleDone = async (reminderId: string) => {
    if (!isConnected) {
      handleNavigateToConnect();
      return;
    }
    await markAsDone(reminderId);
  };

  const handleSnooze = async (reminderId: string) => {
    if (!isConnected) {
      handleNavigateToConnect();
      return;
    }
    await snooze(reminderId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
      </View>

      {/* Not Connected Banner */}
      {!isConnected && (
        <TouchableOpacity style={styles.notConnectedBanner} onPress={handleNavigateToConnect}>
          <Ionicons name="link-outline" size={20} color={colors.warning.dark} />
          <Text style={styles.notConnectedText}>
            Connect with your caregiver to receive reminders
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.warning.dark} />
        </TouchableOpacity>
      )}

      {/* Filters - Disabled when not connected */}
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
            isParent
            onDone={() => handleDone(item.id)}
            onSnooze={() => handleSnooze(item.id)}
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
              {isConnected ? 'No reminders found' : 'Not connected'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isConnected 
                ? `Your ${partnerDisplayName} will create reminders for you`
                : 'Connect with your caregiver to receive reminders'
              }
            </Text>
            {!isConnected && (
              <TouchableOpacity
                onPress={handleNavigateToConnect}
                style={styles.connectButton}
              >
                <Ionicons name="link" size={20} color={colors.neutral.white} />
                <Text style={styles.connectButtonText}>Connect Now</Text>
              </TouchableOpacity>
            )}
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
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius.full,
    gap: spacing[2],
  },
  connectButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral.white,
    fontWeight: '600',
  },
});

