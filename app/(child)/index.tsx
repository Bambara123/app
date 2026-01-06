// app/(child)/index.tsx
// Child Home Screen

import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Dimensions, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  GreetingCard,
  RhythmCard,
  NoteCard,
  StatusCard,
} from '../../src/components/home';
import { Card, Avatar, Button } from '../../src/components/common';
import { useUserStore, useEmergencyStore, useAuthStore } from '../../src/stores';
import { colors, spacing, layout, typography, moodIcons } from '../../src/constants';

// Conditionally import MapView only on native platforms
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChildHomeScreen() {
  const { profile, partner, partnerNote, setDemoData, initialize: initUser } = useUserStore();
  const { user } = useAuthStore();
  const { activeAlerts, initialize: initEmergency } = useEmergencyStore();

  // Initialize user data from auth store
  useEffect(() => {
    if (user) {
      setDemoData(user);
      initUser(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (profile?.id) {
      const unsubscribe = initEmergency(profile.id);
      return unsubscribe;
    }
  }, [profile?.id]);

  // Navigate to emergency alert if there's an active one
  useEffect(() => {
    if (activeAlerts.length > 0) {
      router.push({
        pathname: '/modals/emergency-alert',
        params: { alertId: activeAlerts[0].id },
      });
    }
  }, [activeAlerts]);

  const openSettings = () => {
    router.push('/modals/settings');
  };

  const handleSaveNoteForParent = async (note: string) => {
    if (profile?.id) {
      try {
        const { userService } = await import('../../src/services/firebase/firestore');
        await userService.updateUser(profile.id, { noteForPartner: note });
      } catch (error) {
        console.log('Failed to save note:', error);
      }
    }
  };

  const handleOpenMaps = () => {
    if (partner?.lastLocation) {
      const { latitude, longitude } = partner.lastLocation;
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  };

  const getMoodColor = (mood: string | null) => {
    const moodColors: Record<string, string> = {
      happy: colors.success.main,
      neutral: colors.warning.main,
      sad: colors.primary[500],
      tired: colors.accent.main,
    };
    return mood ? moodColors[mood] : colors.neutral[400];
  };

  // Render map component (native) or fallback (web)
  const renderLocationCard = () => {
    if (!partner?.lastLocation) return null;

    // On web, show a placeholder with link to Google Maps
    if (Platform.OS === 'web') {
      return (
        <Card style={styles.mapCard}>
          <Text style={styles.mapLabel}>
            {partner.name}'s Location
          </Text>
          <View style={styles.webMapPlaceholder}>
            <Ionicons name="location" size={48} color={colors.primary[500]} />
            {partner.lastLocation.address && (
              <Text style={styles.webMapAddress}>{partner.lastLocation.address}</Text>
            )}
            <Button
              title="View in Google Maps"
              onPress={handleOpenMaps}
              variant="outline"
              size="md"
              icon={<Ionicons name="open-outline" size={20} color={colors.primary[500]} />}
            />
          </View>
        </Card>
      );
    }

    // On native, render actual MapView
    return (
      <Card style={styles.mapCard} noPadding>
        <Text style={styles.mapLabel}>
          {partner.name}'s Location
        </Text>
        <View style={styles.mapContainer}>
          {MapView && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: partner.lastLocation.latitude,
                longitude: partner.lastLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {Marker && (
                <Marker
                  coordinate={{
                    latitude: partner.lastLocation.latitude,
                    longitude: partner.lastLocation.longitude,
                  }}
                  title={partner.name}
                />
              )}
            </MapView>
          )}
        </View>
        {partner.lastLocation.address && (
          <View style={styles.addressContainer}>
            <Ionicons name="location" size={16} color={colors.primary[500]} />
            <Text style={styles.addressText} numberOfLines={1}>
              {partner.lastLocation.address}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Avatar and Settings */}
        <View style={styles.header}>
          <Avatar
            source={profile?.profileImageUrl}
            name={profile?.name}
            size="lg"
          />
          <TouchableOpacity onPress={openSettings} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Greeting Card */}
        <GreetingCard
          name={profile?.name || 'Friend'}
          note={partnerNote}
          partnerName={partner?.name}
        />

        {/* Parent Status Card */}
        <StatusCard
          partnerName={partner?.name || 'Parent'}
          batteryLevel={partner?.batteryPercentage || null}
          mood={partner?.mood || null}
          isParent={false}
        />

        {/* Rhythm Cards */}
        {partner && (
          <RhythmCard
            label={`${partner.name?.toUpperCase() || 'PARENT'}'S RHYTHM`}
            activity="Gardening in the backyard"
            emoji="🌱"
            iconName="book"
            iconColor={colors.primary[500]}
          />
        )}

        <RhythmCard
          label={`${profile?.name?.toUpperCase() || 'MY'}'S RHYTHM`}
          activity="Working on a new project"
          emoji="💻"
          iconName="laptop"
          iconColor={colors.accent.main}
        />

        {/* Note from Parent - Child reads the note from parent */}
        <NoteCard
          note={partnerNote}
          partnerName={partner?.name || 'Parent'}
          isEditable={false}
        />

        {/* Note for Parent - Child writes note for parent */}
        <View style={{ marginTop: spacing[4] }}>
          <NoteCard
            note={profile?.noteForPartner || null}
            partnerName={partner?.name || 'Parent'}
            isEditable={true}
            onSaveNote={handleSaveNoteForParent}
          />
        </View>

        {/* Location Map */}
        {renderLocationCard()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: layout.screenPadding,
    paddingBottom: spacing[10],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  settingsButton: {
    padding: spacing[2],
  },
  mapCard: {
    marginTop: spacing[4],
    overflow: 'hidden',
  },
  mapLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  mapContainer: {
    height: 200,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  webMapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[3],
  },
  webMapAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    paddingTop: spacing[3],
    gap: spacing[2],
  },
  addressText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
});
