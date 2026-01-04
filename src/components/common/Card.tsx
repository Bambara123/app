// src/components/common/Card.tsx
// Card component with multiple variants

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, shadows } from '../../constants';

type CardVariant = 'default' | 'elevated' | 'rhythm' | 'spark' | 'greeting';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  noPadding = false,
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: spacing[4],
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },

  // Variants
  default: {
    backgroundColor: colors.neutral.white,
    ...shadows.sm,
  },
  elevated: {
    backgroundColor: colors.neutral.white,
    ...shadows.md,
  },
  rhythm: {
    backgroundColor: colors.neutral.white,
    ...shadows.sm,
    borderRadius: radius['2xl'],
  },
  spark: {
    backgroundColor: colors.background.highlight,
    borderRadius: radius['2xl'],
  },
  greeting: {
    backgroundColor: colors.primary[50],
    borderRadius: radius['2xl'],
    padding: spacing[5],
  },
});

