// app/modals/reminder-alarm.tsx
// Reminder alarm modal for parent

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Vibration, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Audio } from 'expo-av';
import { Button } from '../../src/components/common';
import { useReminderStore } from '../../src/stores';
import { colors, spacing, typography, radius, reminderIcons } from '../../src/constants';

const MAX_WAIT_FOR_REMINDER_MS = 5000; // Wait max 5 seconds for reminder to load

export default function ReminderAlarmScreen() {
  const { reminderId } = useLocalSearchParams<{ reminderId: string }>();
  const { reminders, markAsDone, snooze, markAsInProgress, dismiss, isReminderActive } = useReminderStore();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isWaitingForReminder, setIsWaitingForReminder] = useState(false);
  const waitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reminder = reminders.find((r) => r.id === reminderId);

  // Wait for reminder to load from Firestore if not immediately available
  useEffect(() => {
    if (!reminder && reminderId && !isWaitingForReminder) {
      setIsWaitingForReminder(true);
      
      // Wait max 5 seconds for reminder to sync
      waitTimeoutRef.current = setTimeout(() => {
        setIsWaitingForReminder(false);
      }, MAX_WAIT_FOR_REMINDER_MS);
    } else if (reminder && isWaitingForReminder) {
      // Reminder loaded!
      setIsWaitingForReminder(false);
      if (waitTimeoutRef.current) {
        clearTimeout(waitTimeoutRef.current);
      }
    }

    return () => {
      if (waitTimeoutRef.current) {
        clearTimeout(waitTimeoutRef.current);
      }
    };
  }, [reminder, reminderId, isWaitingForReminder]);

  useEffect(() => {
    // Check if reminder is still active (within 2-min window)
    if (reminderId) {
      const isActive = isReminderActive(reminderId);
      const alreadyActioned = reminder && reminder.status !== 'pending';
      
      if (!isActive || alreadyActioned) {
        // Reminder is outside 2-min window or already handled, go back
        console.log('Reminder not active or already handled, navigating back');
        router.back();
        return;
      }
    }

    // Set up audio mode
    const setupAudio = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });
    };
    setupAudio();

    // Vibrate on mount
    Vibration.vibrate([0, 500, 200, 500], true);

    // Play ringtone
    const playRingtone = async () => {
      try {
        // Use custom ringtone if available
        if (reminder?.customAlarmAudioUrl) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: reminder.customAlarmAudioUrl },
            { shouldPlay: true, isLooping: true, volume: 1.0 }
          );
          soundRef.current = sound;
        }
        // Note: For default ringtone, add an alarm.mp3 file to assets/sounds/
        // The app will use vibration as fallback if no sound file exists
      } catch (error) {
        console.log('Could not play ringtone, using vibration only:', error);
        // Continue with vibration only if sound fails
      }
    };
    playRingtone();

    // Note: Auto-timeout is now handled by cloud function (2-min window)
    // No need for local timeout - cloud will mark as missed if user doesn't act

    return () => {
      Vibration.cancel();
      // Stop and unload sound
      if (soundRef.current) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
      }
    };
  }, [reminder?.customAlarmAudioUrl, reminderId, isReminderActive]);

  const stopAlarm = async () => {
    Vibration.cancel();
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const handleDone = async () => {
    if (reminderId && reminder) {
      await stopAlarm();
      // Navigate back first to prevent re-render flash
      router.back();
      // Cloud Function handles task cancellation and child notification
      markAsDone(reminderId);
    }
  };

  const handleSnooze = async () => {
    if (reminderId && reminder) {
      await stopAlarm();
      // Navigate back first to prevent re-render flash when snooze count updates
      router.back();
      // Cloud Function handles task rescheduling
      snooze(reminderId, reminder.followUpMinutes || 10);
    }
  };

  const handleImOnIt = async () => {
    if (reminderId && reminder) {
      await stopAlarm();
      // Navigate back first to prevent re-render flash
      router.back();
      // Cloud Function handles task rescheduling
      markAsInProgress(reminderId, reminder.followUpMinutes || 10);
    }
  };

  // Dismiss on 2nd ring - marks as missed and notifies child
  const handleDismiss = async () => {
    if (reminderId && reminder) {
      await stopAlarm();
      // Navigate back first
      router.back();
      // Cloud Function handles status update and child notification
      dismiss(reminderId);
    }
  };

  // Show loading state while waiting for reminder to sync
  if (isWaitingForReminder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noReminderContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading reminder...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!reminder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noReminderContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.warning.main} />
          <Text style={styles.noReminderText}>Reminder not found</Text>
          <Text style={styles.noReminderSubtext}>
            This reminder may have been completed or deleted.
          </Text>
          <Button title="Go Back" onPress={() => router.back()} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  const labelColors: Record<string, string> = {
    medicine: colors.primary[500],
    meal: '#F5A623',
    doctor: colors.accent.main,
    exercise: colors.success.main,
    other: colors.neutral[600],
  };

  const accentColor = labelColors[reminder.label] || colors.primary[500];
  
  // Determine if this is the 1st or 2nd ring using ringCount
  const ringCount = reminder.ringCount || 1;
  const isFirstRing = ringCount === 1;
  const isSecondRing = ringCount >= 2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: `${accentColor}15` }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: accentColor }]}>
          <Ionicons
            name={reminderIcons[reminder.label] as any}
            size={48}
            color={colors.neutral.white}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.timeText}>
          {format(reminder.dateTime, 'h:mm a')}
        </Text>
        <Text style={styles.title}>{reminder.title}</Text>
        {reminder.description && (
          <Text style={styles.description}>{reminder.description}</Text>
        )}

        {/* Snooze count */}
        {reminder.snoozeCount > 0 && (
          <View style={styles.snoozeBadge}>
            <Ionicons name="alarm" size={16} color={colors.warning.main} />
            <Text style={styles.snoozeText}>
              Snoozed {reminder.snoozeCount} time{reminder.snoozeCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Show warning message on 2nd ring (final reminder) */}
        {isSecondRing && (
          <View style={styles.finalRingBadge}>
            <Ionicons name="warning" size={18} color={colors.warning.dark} />
            <Text style={styles.finalRingText}>
              This is your final reminder. Please do it now!
            </Text>
          </View>
        )}

        {/* Always show Done button */}
        <Button
          title="Done ✓"
          onPress={handleDone}
          variant="primary"
          size="lg"
          fullWidth
          style={{ backgroundColor: accentColor }}
        />

        {/* First ring: Show "I'm On It" and "Snooze" buttons */}
        {isFirstRing && (
          <>
            <Button
              title="I'm On It 👍"
              onPress={handleImOnIt}
              variant="secondary"
              size="lg"
              fullWidth
            />

            <Button
              title={`Snooze (${reminder.followUpMinutes || 10} min)`}
              onPress={handleSnooze}
              variant="outline"
              size="lg"
              fullWidth
              icon={<Ionicons name="alarm-outline" size={20} color={colors.text.secondary} />}
            />
          </>
        )}

        {/* Second ring: Show "Dismiss" button - marks as missed */}
        {isSecondRing && (
          <Button
            title="Dismiss"
            onPress={handleDismiss}
            variant="outline"
            size="lg"
            fullWidth
            style={styles.dismissButton}
            textStyle={styles.dismissButtonText}
            icon={<Ionicons name="close-circle-outline" size={20} color={colors.danger.main} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  timeText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 36,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  description: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  snoozeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.light,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    marginTop: spacing[4],
    gap: spacing[2],
  },
  snoozeText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning.dark,
    fontWeight: '500',
  },
  actions: {
    padding: spacing[6],
    gap: spacing[3],
  },
  noReminderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[4],
  },
  noReminderText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  noReminderSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginTop: spacing[4],
  },
  finalRingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.light,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  finalRingText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning.dark,
    fontWeight: '500',
  },
  dismissButton: {
    borderColor: colors.danger.main,
  },
  dismissButtonText: {
    color: colors.danger.main,
  },
});

