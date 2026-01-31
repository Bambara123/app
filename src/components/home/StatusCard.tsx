// src/components/home/StatusCard.tsx
// Parent status card showing battery, mood, and emergency button

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common';
import { BatteryCard } from './BatteryCard';
import { EmergencyButton } from './EmergencyButton';
import { colors, spacing, typography, radius } from '../../constants';
import { GeoLocation } from '../../types';

interface StatusCardProps {
  partnerName: string;
  batteryLevel: number | null;
  isParent: boolean;
  onEmergency?: () => void;
  isEmergencyLoading?: boolean;
  // For child view - parent's location
  partnerLocation?: GeoLocation | null;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  partnerName,
  batteryLevel,
  isParent,
  onEmergency,
  isEmergencyLoading,
  partnerLocation,
}) => {
  const handleOpenMaps = () => {
    if (!partnerLocation) {
      Alert.alert('Location Not Available', `${partnerName}'s location is not available yet.`);
      return;
    }

    const { latitude, longitude } = partnerLocation;
    const label = encodeURIComponent(`${partnerName}'s Location`);

    // Try to open in Apple Maps first on iOS, otherwise use Google Maps
    if (Platform.OS === 'ios') {
      const appleMapsUrl = `maps:0,0?q=${label}@${latitude},${longitude}`;
      Linking.canOpenURL(appleMapsUrl).then((supported) => {
        if (supported) {
          Linking.openURL(appleMapsUrl);
        } else {
          // Fallback to Google Maps
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
        }
      });
    } else {
      // Android - use Google Maps
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    }
  };

  // Check if we have any content to show
  const hasBattery = batteryLevel !== null;
  const hasEmergency = isParent && onEmergency;
  const hasLocation = !isParent && partnerLocation !== undefined;
  const hasContent = hasBattery || hasEmergency || hasLocation;

  // Don't render if no content
  if (!hasContent) {
    return null;
  }

  return (
    <Card variant="elevated" style={styles.container}>
      <Text style={styles.label}>
        {isParent ? 'My Status' : `${partnerName}'s Status`}
      </Text>

      <View style={styles.statusRow}>
        {/* Battery - only show if level is provided */}
        {hasBattery && (
          <BatteryCard
            level={batteryLevel}
            label={isParent ? 'My Battery' : `${partnerName}'s Battery`}
          />
        )}

        {/* Emergency button for parent view */}
        {hasEmergency && (
          <EmergencyButton
            onPress={onEmergency!}
            isLoading={isEmergencyLoading}
            compact
          />
        )}

        {/* Map button - for child view, only show if location feature enabled */}
        {hasLocation && (
          <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
            <Ionicons
              name="location"
              size={28}
              color={partnerLocation ? colors.primary[500] : colors.neutral[400]}
            />
            <Text style={[styles.mapButtonText, !partnerLocation && styles.mapButtonTextDisabled]}>
              View {partnerName}'s location
            </Text>
          </TouchableOpacity>
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
  mapButton: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    padding: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  mapButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: '600',
    flexShrink: 1,
  },
  mapButtonTextDisabled: {
    color: colors.neutral[400],
  },
});

