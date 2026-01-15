// src/components/home/StatusCard.tsx
// Parent status card showing battery, mood, and emergency button

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common';
import { BatteryCard } from './BatteryCard';
import { EmergencyButton } from './EmergencyButton';
import { colors, spacing, typography, moodIcons } from '../../constants';
import { Mood } from '../../types';

interface StatusCardProps {
  partnerName: string;
  batteryLevel: number | null;
  mood: Mood | null;
  isParent: boolean;
  onEmergency?: () => void;
  isEmergencyLoading?: boolean;
}

const getMoodColor = (mood: Mood | null): string => {
  const moodColors: Record<Mood, string> = {
    happy: colors.success.main,
    neutral: colors.warning.main,
    sad: colors.primary[500],
    tired: colors.accent.main,
  };
  return mood ? moodColors[mood] : colors.neutral[400];
};

export const StatusCard: React.FC<StatusCardProps> = ({
  partnerName,
  batteryLevel,
  mood,
  isParent,
  onEmergency,
  isEmergencyLoading,
}) => {
  return (
    <Card variant="elevated" style={styles.container}>
      <Text style={styles.label}>
        {isParent ? 'My Status' : `${partnerName}'s Status`}
      </Text>

      <View style={styles.statusRow}>
        {/* Battery */}
        <BatteryCard
          level={batteryLevel}
          label={isParent ? 'My Battery' : `${partnerName}'s Battery`}
        />

        {/* Mood or Emergency */}
        {isParent ? (
          onEmergency && (
            <EmergencyButton
              onPress={onEmergency}
              isLoading={isEmergencyLoading}
              compact
            />
          )
        ) : (
          <View style={styles.moodCard}>
            <Ionicons
              name={(moodIcons[mood || 'neutral'] || 'help-circle') as any}
              size={32}
              color={getMoodColor(mood)}
            />
            <Text style={styles.moodText}>{mood || 'Unknown'}</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  moodCard: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing[1],
    textTransform: 'capitalize',
  },
});

