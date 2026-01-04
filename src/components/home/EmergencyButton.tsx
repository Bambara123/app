// src/components/home/EmergencyButton.tsx
// Large emergency button for parent home screen

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography, layout } from '../../constants';

interface EmergencyButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  compact?: boolean;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  onPress,
  isLoading = false,
  compact = false,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Alert.alert(
      'Emergency Alert',
      'Send emergency alert to your family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onPress();
          },
        },
      ]
    );
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isLoading}
        style={styles.compactContainer}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Emergency button"
      >
        {isLoading ? (
          <ActivityIndicator color={colors.neutral.white} />
        ) : (
          <>
            <Ionicons name="alert-circle" size={32} color={colors.neutral.white} />
            <Text style={styles.compactLabel}>Emergency</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      style={styles.container}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Emergency button - press to alert your family"
    >
      <View style={styles.innerCircle}>
        {isLoading ? (
          <ActivityIndicator color={colors.neutral.white} size="large" />
        ) : (
          <>
            <Ionicons
              name="alert-circle"
              size={48}
              color={colors.neutral.white}
            />
            <Text style={styles.label}>EMERGENCY</Text>
            <Text style={styles.subLabel}>Tap to alert family</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: layout.emergencyButtonSize,
    height: layout.emergencyButtonSize,
    borderRadius: layout.emergencyButtonSize / 2,
    backgroundColor: colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: spacing[6],
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  innerCircle: {
    width: layout.emergencyButtonSize - 16,
    height: layout.emergencyButtonSize - 16,
    borderRadius: (layout.emergencyButtonSize - 16) / 2,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.neutral.white,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: spacing[1],
  },
  subLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.fontSize.xs,
    marginTop: spacing[1],
  },

  // Compact styles
  compactContainer: {
    flex: 1,
    backgroundColor: colors.emergency,
    borderRadius: radius.lg,
    padding: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  compactLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.neutral.white,
    marginTop: spacing[1],
  },
});

