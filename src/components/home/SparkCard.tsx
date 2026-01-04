// src/components/home/SparkCard.tsx
// "Spark a Thought" conversation starter card

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common';
import { colors, spacing, typography } from '../../constants';

interface SparkCardProps {
  onPress: () => void;
}

export const SparkCard: React.FC<SparkCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card variant="spark" style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={20} color={colors.primary[500]} />
          <Text style={styles.label}>SPARK A THOUGHT</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          
          <View style={styles.sparkIcon}>
            <Ionicons
              name="sparkles-outline"
              size={80}
              color={colors.primary[100]}
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 120,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: spacing[2],
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[300],
  },
  sparkIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.5,
  },
});

