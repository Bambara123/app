// src/components/reminders/ReminderCard.tsx
// Reminder card with actions

import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Card, Badge } from '../common';
import { colors, spacing, typography, radius, reminderIcons } from '../../constants';
import { Reminder, ReminderLabel } from '../../types';

interface ReminderCardProps {
  reminder: Reminder;
  isParent?: boolean;
  onPress?: () => void;
  onDone?: () => void;
  onDelete?: () => void;
}

const labelColors: Record<ReminderLabel, { bg: string; accent: string }> = {
  medicine: { bg: colors.primary[50], accent: colors.primary[500] },
  meal: { bg: '#FFF9E6', accent: '#F5A623' },
  doctor: { bg: colors.accent.light, accent: colors.accent.main },
  exercise: { bg: colors.success.light, accent: colors.success.main },
  other: { bg: colors.secondary[100], accent: colors.secondary[600] },
};

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  isParent = false,
  onPress,
  onDone,
  onDelete,
}) => {
  const confettiRef = useRef<any>(null);
  const labelStyle = labelColors[reminder.label] || labelColors.other;

  const handleDone = () => {
    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Trigger confetti
    confettiRef.current?.start();
    // Call the actual done handler
    if (onDone) {
      setTimeout(() => onDone(), 300);
    }
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getStatusBadge = () => {
    switch (reminder.status) {
      case 'done':
        return <Badge text="Done" variant="success" />;
      case 'missed':
        return <Badge text="Missed" variant="danger" />;
      case 'snoozed':
        return <Badge text="Snoozed" variant="warning" />;
      default:
        // Show badge based on counts even if status is pending (waiting for next ring)
        if (reminder.snoozeCount > 0) {
          return <Badge text={`Snoozed ${reminder.snoozeCount}x`} variant="warning" />;
        }
        if (reminder.missCount > 0) {
          return <Badge text={`Missed ${reminder.missCount}x`} variant="danger" />;
        }
        return null;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
    >
      <Card style={{ ...styles.container, backgroundColor: labelStyle.bg }}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${labelStyle.accent}20` }]}>
            <Ionicons
              name={reminderIcons[reminder.label] as any}
              size={24}
              color={labelStyle.accent}
            />
          </View>

          {/* Info */}
          <View style={styles.info}>
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                {reminder.title}
              </Text>
              {getStatusBadge()}
            </View>

            {reminder.description && (
              <Text style={styles.description} numberOfLines={1}>
                {reminder.description}
              </Text>
            )}

            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.time}>
                {formatDate(reminder.dateTime)} • {format(reminder.dateTime, 'h:mm a')}
              </Text>
              {reminder.repeat !== 'none' && (
                <>
                  <Ionicons
                    name="repeat"
                    size={14}
                    color={colors.text.secondary}
                    style={styles.repeatIcon}
                  />
                  <Text style={styles.repeatText}>{reminder.repeat}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Actions */}
        {((isParent && (reminder.status === 'pending' || reminder.status === 'missed') && onDone) ||
          (!isParent && onDelete && reminder.status !== 'done')) && (
          <View style={styles.actions}>
            {/* Mark as Done button for parent (pending or missed) */}
            {isParent && (reminder.status === 'pending' || reminder.status === 'missed') && onDone && (
              <TouchableOpacity
                onPress={handleDone}
                style={[styles.actionButton, styles.doneButton]}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.neutral.white} />
                <Text style={styles.actionText}>Mark as Done</Text>
              </TouchableOpacity>
            )}

            {/* Delete button for child (not done reminders) */}
            {!isParent && onDelete && reminder.status !== 'done' && (
              <TouchableOpacity
                onPress={onDelete}
                style={[styles.actionButton, styles.deleteButton]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.neutral.white} />
                <Text style={styles.actionText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Confetti animation */}
        <ConfettiCannon
          ref={confettiRef}
          count={50}
          origin={{ x: -10, y: 0 }}
          autoStart={false}
          fadeOut
          fallSpeed={2000}
          colors={[
            colors.success.main,
            colors.primary[500],
            colors.accent.main,
            '#FFD700',
            '#FF69B4',
          ]}
        />
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
  },
  content: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing[2],
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  time: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing[1],
  },
  repeatIcon: {
    marginLeft: spacing[3],
  },
  repeatText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing[1],
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radius.full,
    gap: spacing[1],
  },
  doneButton: {
    backgroundColor: colors.success.main,
  },
  deleteButton: {
    backgroundColor: colors.danger.main,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral.white,
    fontWeight: '600',
  },
});

