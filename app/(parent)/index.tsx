// app/(parent)/index.tsx
// Parent Home Screen

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import {
  GreetingCard,
  RhythmCard,
  NoteCard,
  StatusCard,
} from '../../src/components/home';
import { ReminderCard } from '../../src/components/reminders';
import { Card, Avatar, Button } from '../../src/components/common';
import { useUserStore, useReminderStore, useEmergencyStore, useAuthStore } from '../../src/stores';
import { colors, spacing, layout, typography } from '../../src/constants';
import { startBatteryMonitoring } from '../../src/services/battery';
import { startLocationMonitoring } from '../../src/services/location';

export default function ParentHomeScreen() {
  const { profile, partner, partnerNote, initialize: initUser } = useUserStore();
  const { user } = useAuthStore();
  const { reminders, initialize: initReminders } = useReminderStore();
  const { triggerEmergency, isTriggering, error: emergencyError } = useEmergencyStore();
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Get the name to display for partner (use partnerCallName if set, otherwise partner's nickname or name)
  const partnerDisplayName = user?.partnerCallName || partner?.name || 'Family';
  const isConnected = !!user?.connectedTo;

  // Track if monitoring is active to prevent duplicates
  const monitoringActive = useRef(false);

  // Initialize user data once (not on every focus)
  useEffect(() => {
    if (user?.id && !profile) {
      initUser(user.id);
    }
  }, [user?.id]);

  // Use focus effect to start/stop monitoring ONLY when screen is visible
  // This prevents memory leaks and duplicate monitoring when switching between profiles
  useFocusEffect(
    useCallback(() => {
      // Prevent duplicate monitoring if already active
      if (monitoringActive.current) {
        console.log('Monitoring already active, skipping...');
        return;
      }

      console.log('Parent screen focused - starting monitoring');
      monitoringActive.current = true;
      
      const cleanupFunctions: Array<() => void> = [];

      // Only start monitoring if we have the required data
      if (!profile?.id || !user?.id || user?.role !== 'parent') {
        return;
      }

      // Initialize reminders
      try {
        const reminderUnsubscribe = initReminders(profile.id, true);
        cleanupFunctions.push(reminderUnsubscribe);
      } catch (error) {
        console.error('Failed to initialize reminders:', error);
      }

      // Start battery monitoring (delayed by 2 seconds to avoid blocking UI)
      try {
        const batteryCleanup = startBatteryMonitoring(user.id, (level) => {
          setBatteryLevel(level);
        });
        cleanupFunctions.push(batteryCleanup);
      } catch (error) {
        console.error('Failed to start battery monitoring:', error);
      }

      // Start location monitoring (delayed by 1 second to avoid blocking UI)
      try {
        const locationCleanup = startLocationMonitoring(user.id);
        cleanupFunctions.push(locationCleanup);
      } catch (error) {
        console.error('Failed to start location monitoring:', error);
      }

      // Cleanup when screen loses focus or unmounts
      return () => {
        console.log('Parent screen unfocused - stopping ALL monitoring');
        monitoringActive.current = false;
        
        // Execute all cleanup functions
        cleanupFunctions.forEach((cleanup) => {
          try {
            cleanup();
          } catch (error) {
            console.error('Cleanup error:', error);
          }
        });
      };
    }, [profile?.id, user?.id, user?.role, initReminders])
  );

  // Get recent reminder (memoized to avoid recalculation on every render)
  const recentReminder = useMemo(() => {
    return reminders.find((r) => r.status === 'pending');
  }, [reminders]);

  const handleEmergency = async () => {
    if (profile?.id && partner?.id) {
      try {
        await triggerEmergency(profile.id, partner.id);
        Alert.alert('Emergency Sent', 'Your emergency alert has been sent to your caregiver.');
      } catch (error: any) {
        Alert.alert('Cannot Send Emergency', error.message || 'Failed to send emergency alert. Please try again.');
      }
    }
  };

  const openSettings = () => {
    router.push('/modals/settings');
  };

  const handleSaveNoteForChild = async (note: string) => {
    if (profile?.id) {
      try {
        const { userService } = await import('../../src/services/firebase/firestore');
        await userService.updateUser(profile.id, { noteForPartner: note });
      } catch (error) {
        console.log('Failed to save note:', error);
      }
    }
  };

  const handleReminderDone = async (reminderId: string) => {
    const { markAsDone } = useReminderStore.getState();
    await markAsDone(reminderId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Avatar and Settings */}
        <View style={styles.header}>
          <Avatar
            source={profile?.profileImageUrl}
            name={profile?.name}
            size="lg"
          />
          <TouchableOpacity onPress={openSettings} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Greeting Card */}
        <GreetingCard
          name={profile?.name || 'Friend'}
          customGreeting={isConnected ? partner?.customGreeting : undefined}
          note={isConnected ? partnerNote : null}
          partnerName={partnerDisplayName}
        />

        {/* Status Card (Battery + Emergency) */}
        <StatusCard
          partnerName={partnerDisplayName}
          batteryLevel={batteryLevel ?? profile?.batteryPercentage ?? null}
          isParent={true}
          onEmergency={isConnected ? handleEmergency : undefined}
          isEmergencyLoading={isTriggering}
        />

        {/* Connect Card if not connected */}
        {!isConnected && (
          <Card style={styles.connectCard}>
            <Ionicons name="link-outline" size={32} color={colors.text.tertiary} />
            <Text style={styles.connectText}>Connect with your caregiver to enable all features</Text>
            <Button
              title="Connect Now"
              onPress={() => router.push('/(auth)/partner-connection')}
              variant="outline"
              size="sm"
            />
          </Card>
        )}

        {/* Rhythm Cards - Shows what each person is currently doing */}
        <RhythmCard
          label="My Rhythm"
          activity={profile?.rhythm || "What are you up to?"}
          isOwnRhythm={true}
          userRole="parent"
          isEditable={true}
          onActivityChange={async (newActivity) => {
            if (profile?.id) {
              try {
                const { userService } = await import('../../src/services/firebase/firestore');
                await userService.updateUser(profile.id, { rhythm: newActivity });
              } catch (error) {
                console.log('Failed to save rhythm:', error);
              }
            }
          }}
        />

        {isConnected && partner && (
          <RhythmCard
            label={`${partnerDisplayName}'s Rhythm`}
            activity={partner?.rhythm || "Busy with work"}
            isOwnRhythm={false}
            userRole="parent"
          />
        )}

        {/* Note for Child - Parent writes a message for child to see */}
        {isConnected ? (
          <NoteCard
            note={profile?.noteForPartner || null}
            partnerName={partnerDisplayName}
            isEditable={true}
            onSaveNote={handleSaveNoteForChild}
          />
        ) : null}

        {/* Recent Reminder */}
        {recentReminder && (
          <View style={styles.reminderSection}>
            <ReminderCard
              reminder={recentReminder}
              isParent
              onDone={() => handleReminderDone(recentReminder.id)}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: layout.screenPadding,
    paddingBottom: spacing[10],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  settingsButton: {
    padding: spacing[2],
  },
  connectCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[3],
    marginTop: spacing[4],
  },
  connectText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  reminderSection: {
    marginTop: spacing[4],
  },
});

