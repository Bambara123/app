// src/components/common/Badge.tsx
// Tag/Badge component

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, typography } from '../../constants';

type BadgeVariant = 'parent' | 'child' | 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  style,
}) => {
  return (
    <View style={[styles.container, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Variants
  default: {
    backgroundColor: colors.neutral[100],
  },
  parent: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.tag.parent,
  },
  child: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.tag.child,
  },
  success: {
    backgroundColor: colors.success.light,
  },
  warning: {
    backgroundColor: colors.warning.light,
  },
  danger: {
    backgroundColor: colors.danger.light,
  },

  // Text colors
  text_default: {
    color: colors.text.secondary,
  },
  text_parent: {
    color: colors.tag.parent,
  },
  text_child: {
    color: colors.tag.child,
  },
  text_success: {
    color: colors.success.dark,
  },
  text_warning: {
    color: colors.warning.dark,
  },
  text_danger: {
    color: colors.danger.dark,
  },
});

