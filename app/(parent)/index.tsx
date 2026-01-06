// app/(parent)/index.tsx
// Parent Home Screen

import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
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
import { Card, Avatar } from '../../src/components/common';
import { useUserStore, useReminderStore, useEmergencyStore, useAuthStore } from '../../src/stores';
import { colors, spacing, layout } from '../../src/constants';

export default function ParentHomeScreen() {
  const { profile, partner, partnerNote, setDemoData, initialize: initUser } = useUserStore();
  const { user } = useAuthStore();
  const { reminders, initialize: initReminders } = useReminderStore();
  const { triggerEmergency, isTriggering } = useEmergencyStore();

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
          customGreeting={partner?.customGreeting}
          note={partnerNote}
          partnerName={partner?.name}
        />

        {/* Status Card (Battery + Emergency) */}
        <StatusCard
          partnerName={partner?.name || 'Family'}
          batteryLevel={profile?.batteryPercentage || null}
          mood={profile?.mood || null}
          isParent={true}
          onEmergency={handleEmergency}
          isEmergencyLoading={isTriggering}
        />

        {/* Rhythm Cards */}
        <RhythmCard
          label={`${profile?.name?.toUpperCase() || 'MY'}'S RHYTHM`}
          activity="Relaxing at home"
          emoji="🏠"
          iconName="book"
          iconColor={colors.primary[500]}
        />

        {partner && (
          <RhythmCard
            label={`${partner.name?.toUpperCase() || 'FAMILY'}'S RHYTHM`}
            activity="Working on a project"
            emoji="💻"
            iconName="laptop"
            iconColor={colors.accent.main}
          />
        )}

        {/* Note from Child - Parent reads the note from child */}
        <NoteCard
          note={partnerNote}
          partnerName={partner?.name || 'Family'}
          isEditable={false}
        />

        {/* Note for Child - Parent writes note for child */}
        <View style={{ marginTop: spacing[4] }}>
          <NoteCard
            note={profile?.noteForPartner || null}
            partnerName={partner?.name || 'Family'}
            isEditable={true}
            onSaveNote={handleSaveNoteForChild}
          />
        </View>

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
  reminderSection: {
    marginTop: spacing[4],
  },
});

