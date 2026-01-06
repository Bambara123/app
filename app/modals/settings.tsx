// app/modals/settings.tsx
// Settings modal screen

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Avatar, Card } from '../../src/components/common';
import { useAuthStore, useUserStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  danger,
}) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={[styles.settingsIcon, danger && styles.dangerIcon]}>
      <Ionicons
        name={icon as any}
        size={20}
        color={danger ? colors.danger.main : colors.primary[500]}
      />
    </View>
    <View style={styles.settingsContent}>
      <Text style={[styles.settingsTitle, danger && styles.dangerText]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { user } = useAuthStore();
  const { profile, partner } = useUserStore();

  const handleClose = () => {
    router.back();
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            // Sign out from Firebase
            const { auth } = await import('../src/services/firebase/config');
            const { signOut } = await import('firebase/auth');
            await signOut(auth);
          } catch (error) {
            console.log('Firebase sign out failed');
          }
          // Clear local state
          useAuthStore.setState({
            user: null,
            firebaseUser: null,
            isLoading: false,
            isInitialized: true,
          });
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleConnectPartner = () => {
    router.push('/(auth)/partner-connection');
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing coming soon!');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Notification settings coming soon!');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy', 'Privacy settings coming soon!');
  };

  const handleHelp = () => {
    Alert.alert('Help', 'Help & Support coming soon!');
  };

  const isConnected = !!user?.connectedTo || !!partner;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <Avatar
            source={profile?.profileImageUrl}
            name={profile?.name}
            size="xl"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{profile?.email}</Text>
            <Text style={styles.profileRole}>
              {profile?.role === 'parent' ? '👴 Parent' : '👨 Caregiver'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
            <Ionicons name="pencil" size={18} color={colors.primary[500]} />
          </TouchableOpacity>
        </Card>

        {/* Connection Info */}
        {isConnected && partner ? (
          <Card style={styles.connectionCard}>
            <Text style={styles.connectionLabel}>Connected to</Text>
            <View style={styles.connectionRow}>
              <Avatar
                source={partner.profileImageUrl}
                name={partner.name}
                size="md"
                isOnline={partner.isOnline}
              />
              <View style={styles.connectionInfo}>
                <Text style={styles.connectionName}>{partner.name}</Text>
                <Text style={styles.connectionStatus}>
                  {partner.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.connectionCard}>
            <View style={styles.notConnectedContainer}>
              <Ionicons name="people-outline" size={32} color={colors.text.tertiary} />
              <Text style={styles.notConnectedTitle}>Not connected yet</Text>
              <Text style={styles.notConnectedText}>
                Connect with your {profile?.role === 'parent' ? 'caregiver' : 'parent'} to start sharing reminders and staying in touch.
              </Text>
              <TouchableOpacity style={styles.connectButton} onPress={handleConnectPartner}>
                <Ionicons name="link" size={18} color={colors.neutral.white} />
                <Text style={styles.connectButtonText}>Connect Now</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Settings Groups */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>PREFERENCES</Text>
          <SettingsItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Manage alerts and reminders"
            onPress={handleNotifications}
          />
          <SettingsItem
            icon="lock-closed-outline"
            title="Privacy"
            subtitle="Location sharing, data"
            onPress={handlePrivacy}
          />
        </View>

        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>SUPPORT</Text>
          <SettingsItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={handleHelp}
          />
        </View>

        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleSignOut}
            danger
          />
        </View>

        {/* App Version */}
        <Text style={styles.version}>ElderCare v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 28,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing[2],
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  profileName: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
  },
  profileEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  profileRole: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    marginTop: spacing[1],
  },
  editButton: {
    padding: spacing[2],
  },
  connectionCard: {
    marginBottom: spacing[6],
  },
  connectionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[3],
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionInfo: {
    marginLeft: spacing[3],
  },
  connectionName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  connectionStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  notConnectedContainer: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  notConnectedTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  notConnectedText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  connectButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  settingsGroup: {
    marginBottom: spacing[6],
  },
  groupTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[2],
    marginLeft: spacing[2],
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    padding: spacing[4],
    borderRadius: radius.lg,
    marginBottom: spacing[2],
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIcon: {
    backgroundColor: colors.danger.light,
  },
  settingsContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  settingsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.text.primary,
  },
  dangerText: {
    color: colors.danger.main,
  },
  settingsSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  version: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[4],
  },
});

