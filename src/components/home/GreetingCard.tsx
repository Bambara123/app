// src/components/home/GreetingCard.tsx
// Greeting card with date and personalized message

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors, spacing, typography } from '../../constants';

interface GreetingCardProps {
  name: string;
  customGreeting?: string | null;
  note?: string | null;
  partnerName?: string;
}

const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

export const GreetingCard: React.FC<GreetingCardProps> = ({
  name,
  customGreeting,
  note,
  partnerName,
}) => {
  const today = new Date();
  const dayName = format(today, 'EEEE');
  const monthDay = format(today, 'MMMM d');

  return (
    <View style={styles.container}>
      {/* Date row */}
      <View style={styles.dateRow}>
        <Ionicons name="sunny-outline" size={16} color={colors.primary[500]} />
        <Text style={styles.dateText}>
          {dayName.toUpperCase()}, {monthDay.toUpperCase()}
        </Text>
      </View>

      {/* Greeting */}
      <Text style={styles.greeting}>
        {customGreeting || `Good ${getTimeOfDay()},`}
      </Text>
      <Text style={styles.name}>{name}.</Text>

      {/* Note from partner */}
      {note && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            <Text style={styles.noteLabel}>From {partnerName}: </Text>
            {note}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary[500],
    letterSpacing: 1,
    marginLeft: spacing[2],
  },
  greeting: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 32,
    color: colors.text.primary,
    lineHeight: 40,
  },
  name: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 32,
    color: colors.primary[500],
    fontStyle: 'italic',
    lineHeight: 40,
  },
  noteContainer: {
    marginTop: spacing[3],
    backgroundColor: colors.primary[50],
    padding: spacing[3],
    borderRadius: 12,
  },
  noteLabel: {
    fontWeight: '600',
    color: colors.text.secondary,
  },
  noteText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontStyle: 'italic',
  },
});

