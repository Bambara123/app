// src/components/home/BatteryCard.tsx
// Compact battery display card

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../constants';

interface BatteryCardProps {
  level: number | null;
  label: string;
}

export const BatteryCard: React.FC<BatteryCardProps> = ({ level, label }) => {
  const getBatteryIcon = (): string => {
    if (level === null) return 'battery-dead';
    if (level > 80) return 'battery-full';
    if (level > 50) return 'battery-half';
    if (level > 20) return 'battery-half';
    return 'battery-dead';
  };

  const getBatteryColor = (): string => {
    if (level === null) return colors.neutral[400];
    if (level > 50) return colors.success.main;
    if (level > 20) return colors.warning.main;
    return colors.danger.main;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.batteryRow}>
        <Ionicons name={getBatteryIcon() as any} size={32} color={getBatteryColor()} />
        <Text style={[styles.percentage, { color: getBatteryColor() }]}>
          {level !== null ? `${level}%` : '--'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    padding: spacing[3],
    alignItems: 'center',
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  percentage: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
});

