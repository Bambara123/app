// app/modals/reminder-alarm.tsx
// Reminder alarm modal for parent

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Button } from '../../src/components/common';
import { useReminderStore } from '../../src/stores';
import { colors, spacing, typography, radius, reminderIcons } from '../../src/constants';

export default function ReminderAlarmScreen() {
  const { reminderId } = useLocalSearchParams<{ reminderId: string }>();
  const { reminders, markAsDone, snooze } = useReminderStore();

  const reminder = reminders.find((r) => r.id === reminderId);

  useEffect(() => {
    // Vibrate on mount
    Vibration.vibrate([0, 500, 200, 500], true);

    return () => {
      Vibration.cancel();
    };
  }, []);

  const handleDone = async () => {
    if (reminderId) {
      await markAsDone(reminderId);
      Vibration.cancel();
      router.back();
    }
  };

  const handleSnooze = async () => {
    if (reminderId) {
      await snooze(reminderId, 10);
      Vibration.cancel();
      router.back();
    }
  };

  if (!reminder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noReminderContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success.main} />
          <Text style={styles.noReminderText}>Reminder not found</Text>
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
        <Button
          title="Done ✓"
          onPress={handleDone}
          variant="primary"
          size="lg"
          fullWidth
          style={{ backgroundColor: accentColor }}
        />

        <Button
          title="Snooze (10 min)"
          onPress={handleSnooze}
          variant="outline"
          size="lg"
          fullWidth
          icon={<Ionicons name="alarm-outline" size={20} color={colors.text.secondary} />}
        />
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
    color: colors.text.secondary,
  },
});

