// app/modals/emergency-alert.tsx
// Emergency alert modal for child

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking, Vibration, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '../../src/components/common';
import { useEmergencyStore, useUserStore, useAuthStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';

// Conditionally import MapView only on native platforms
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

export default function EmergencyAlertScreen() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const { activeAlerts, acknowledgeAlert, resolveAlert } = useEmergencyStore();
  const { partner } = useUserStore();
  const { user } = useAuthStore();
  const [acknowledged, setAcknowledged] = useState(false);

  // Get display name for partner (use partnerCallName if set)
  const partnerDisplayName = user?.partnerCallName || partner?.name || 'Your parent';

  const alert = activeAlerts.find((a) => a.id === alertId);

  useEffect(() => {
    // Vibrate on mount (not on web)
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true);

      return () => {
        Vibration.cancel();
      };
    }
  }, []);

  const handleAcknowledge = async () => {
    if (alertId) {
      await acknowledgeAlert(alertId);
      setAcknowledged(true);
      if (Platform.OS !== 'web') {
        Vibration.cancel();
      }
    }
  };

  const handleCall = () => {
    if (partner?.phone) {
      Linking.openURL(`tel:${partner.phone}`);
    }
  };

  const handleResolve = async () => {
    if (alertId) {
      await resolveAlert(alertId);
      router.back();
    }
  };

  const handleOpenMaps = () => {
    if (alert?.location) {
      const { latitude, longitude } = alert.location;
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  };

  if (!alert) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noAlertContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success.main} />
          <Text style={styles.noAlertText}>No active alerts</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  // Render map component (native) or static map link (web)
  const renderMap = () => {
    if (!alert.location) return null;

    // On web, show a static map image or link
    if (Platform.OS === 'web') {
      return (
        <View style={styles.mapContainer}>
          <View style={styles.webMapPlaceholder}>
            <Ionicons name="location" size={48} color={colors.danger.main} />
            <Text style={styles.webMapText}>Location Available</Text>
            {alert.location.address && (
              <Text style={styles.webMapAddress}>{alert.location.address}</Text>
            )}
            <Button
              title="Open in Google Maps"
              onPress={handleOpenMaps}
              variant="outline"
              size="md"
              icon={<Ionicons name="open-outline" size={20} color={colors.primary[500]} />}
            />
          </View>
        </View>
      );
    }

    // On native, render actual MapView
    return (
      <View style={styles.mapContainer}>
        {MapView && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: alert.location.latitude,
              longitude: alert.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {Marker && (
              <Marker
                coordinate={{
                  latitude: alert.location.latitude,
                  longitude: alert.location.longitude,
                }}
                title={partnerDisplayName}
              />
            )}
          </MapView>
        )}
        
        {alert.location.address && (
          <View style={styles.addressBanner}>
            <Ionicons name="location" size={18} color={colors.danger.main} />
            <Text style={styles.addressText}>{alert.location.address}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.alertBadge}>
          <Ionicons name="warning" size={24} color={colors.neutral.white} />
        </View>
        <Text style={styles.title}>EMERGENCY ALERT</Text>
        <Text style={styles.subtitle}>
          {partnerDisplayName} needs your help!
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Location Map */}
        {renderMap()}

        {/* Time */}
        <Text style={styles.timeText}>
          Alert received at{' '}
          {new Date(alert.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          {!acknowledged ? (
            <>
              <Button
                title="I'm on it!"
                onPress={handleAcknowledge}
                variant="danger"
                size="lg"
                fullWidth
                icon={<Ionicons name="hand-right" size={24} color={colors.neutral.white} />}
              />
              
              {/* Show View on Map even before acknowledging */}
              {alert.location && (
                <Button
                  title="View on Map"
                  onPress={handleOpenMaps}
                  variant="outline"
                  size="lg"
                  fullWidth
                  icon={<Ionicons name="map-outline" size={24} color={colors.danger.main} />}
                />
              )}
            </>
          ) : (
            <>
              <Button
                title="Call Now"
                onPress={handleCall}
                variant="primary"
                size="lg"
                fullWidth
                icon={<Ionicons name="call" size={24} color={colors.neutral.white} />}
              />

              {alert.location && (
                <Button
                  title="Open in Maps"
                  onPress={handleOpenMaps}
                  variant="secondary"
                  size="lg"
                  fullWidth
                  icon={<Ionicons name="navigate" size={24} color={colors.primary[500]} />}
                />
              )}

              <Button
                title="Mark as Resolved"
                onPress={handleResolve}
                variant="tertiary"
                size="md"
              />
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.danger.light,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    backgroundColor: colors.danger.main,
  },
  alertBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.neutral.white,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing[2],
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  mapContainer: {
    height: 250,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing[4],
    backgroundColor: colors.neutral[100],
  },
  map: {
    flex: 1,
  },
  webMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    gap: spacing[2],
  },
  webMapText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  webMapAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  addressBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.neutral.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[2],
  },
  addressText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  timeText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  actions: {
    gap: spacing[3],
  },
  noAlertContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[4],
  },
  noAlertText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
  },
});
