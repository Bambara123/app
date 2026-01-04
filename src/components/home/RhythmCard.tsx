// src/components/home/RhythmCard.tsx
// Activity rhythm card (Dad's Rhythm / Son's Rhythm)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common';
import { colors, spacing, typography } from '../../constants';

interface RhythmCardProps {
  label: string;
  activity: string;
  emoji?: string;
  iconName?: string;
  iconColor?: string;
}

export const RhythmCard: React.FC<RhythmCardProps> = ({
  label,
  activity,
  emoji,
  iconName,
  iconColor = colors.primary[500],
}) => {
  return (
    <Card variant="rhythm" style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.activity}>
            {activity} {emoji}
          </Text>
        </View>
        {iconName && (
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={iconName as any} size={24} color={iconColor} />
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[1],
  },
  activity: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '500',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

