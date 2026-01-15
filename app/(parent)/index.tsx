// app/(parent)/index.tsx
// Parent Home Screen

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

export default function ParentHomeScreen() {
  const { profile, partner, partnerNote, setDemoData, initialize: initUser } = useUserStore();
  const { user } = useAuthStore();
  const { reminders, initialize: initReminders } = useReminderStore();
  const { triggerEmergency, isTriggering } = useEmergencyStore();
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Get the name to display for partner (use partnerCallName if set, otherwise partner's nickname or name)
  const partnerDisplayName = user?.partnerCallName || partner?.name || 'Family';
  const isConnected = !!user?.connectedTo;

  // Initialize user data from auth store
  useEffect(() => {
    if (user) {
      setDemoData(user);
      initUser(user.id);
    }
  }, [user]);

  // Initialize reminders
  useEffect(() => {
    if (profile?.id) {
      const unsubscribe = initReminders(profile.id, true);
      return unsubscribe;
    }
  }, [profile?.id]);

  // Start battery monitoring for parent device
  useEffect(() => {
    if (user?.id && user?.role === 'parent') {
      const unsubscribe = startBatteryMonitoring(user.id, (level) => {
        setBatteryLevel(level);
      });
      return unsubscribe;
    }
  }, [user?.id, user?.role]);

  // Get recent reminder
  const recentReminder = reminders.find((r) => r.status === 'pending');

  const handleEmergency = async () => {
    if (profile?.id && partner?.id) {
      await triggerEmergency(profile.id, partner.id);
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

  const handleReminderSnooze = async (reminderId: string) => {
    const { snooze } = useReminderStore.getState();
    await snooze(reminderId);
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
          mood={profile?.mood || null}
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
              onSnooze={() => handleReminderSnooze(recentReminder.id)}
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

