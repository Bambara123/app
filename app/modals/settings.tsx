// app/modals/settings.tsx
// Settings modal screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, Card, Button, Input } from '../../src/components/common';
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

  // Edit profile modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPartnerCallName, setEditPartnerCallName] = useState(user?.partnerCallName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const isConnected = !!user?.connectedTo;
  const partnerDisplayName = user?.partnerCallName || partner?.name || (profile?.role === 'parent' ? 'Caregiver' : 'Parent');

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
            const { signOut } = await import('../../src/services/firebase/auth');
            await signOut();
          } catch (error) {
            console.log('Firebase sign out error:', error);
          }
          // Clear local state
          useAuthStore.setState({
            user: null,
            firebaseUser: null,
            isLoading: false,
            isInitialized: true,
          });
          // Clear user store
          useUserStore.getState().reset();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleConnectPartner = () => {
    router.push('/(auth)/partner-connection');
  };

  const handleEditProfile = () => {
    setEditPartnerCallName(user?.partnerCallName || '');
    setEditPhone(user?.phone || '');
    setShowEditModal(true);
  };

  const handleChangeProfilePicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUpdating(true);
        try {
          const { storageService } = await import('../../src/services/firebase/storage');
          const { userService } = await import('../../src/services/firebase/firestore');
          
          const uploadResult = await storageService.uploadProfileImage(user!.id, result.assets[0].uri);
          await userService.updateUser(user!.id, { profileImageUrl: uploadResult.url });
          
          // Update local state
          useAuthStore.setState({
            user: user ? { ...user, profileImageUrl: uploadResult.url } : null,
          });
          
          // Also update user store profile
          useUserStore.setState((state) => ({
            profile: state.profile ? { ...state.profile, profileImageUrl: uploadResult.url } : null,
          }));
          
          Alert.alert('Success', 'Profile picture updated!');
        } catch (error) {
          console.log('Failed to upload image:', error);
          Alert.alert('Error', 'Failed to update profile picture. Please try again.');
        }
        setIsUpdating(false);
      }
    } catch (error) {
      console.log('Image picker error:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    // Validate phone number with country code
    if (editPhone.trim()) {
      const cleanPhone = editPhone.trim();
      if (!cleanPhone.startsWith('+')) {
        Alert.alert('Country Code Required', 'Please include the country code starting with + (e.g., +1 for US)');
        return;
      }
      if (cleanPhone.length < 10) {
        Alert.alert('Invalid Phone', 'Please enter a valid phone number with country code');
        return;
      }
    }

    setIsUpdating(true);
    try {
      const { userService } = await import('../../src/services/firebase/firestore');
      const updateData = { 
        partnerCallName: editPartnerCallName.trim() || null,
        phone: editPhone.trim() || null,
      };
      await userService.updateUser(user.id, updateData);
      
      // Update local state
      useAuthStore.setState({
        user: { ...user, ...updateData },
      });
      
      // Also update user store profile
      useUserStore.setState((state) => ({
        profile: state.profile ? { ...state.profile, phone: editPhone.trim() || null } : null,
      }));
      
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      console.log('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
    setIsUpdating(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              const { userService } = await import('../../src/services/firebase/firestore');
              const { signOut } = await import('../../src/services/firebase/auth');
              
              // Delete user data from Firestore
              if (user?.id) {
                await userService.deleteUser(user.id);
              }
              
              // Sign out
              await signOut();
              
              // Clear local state
              useAuthStore.setState({
                user: null,
                firebaseUser: null,
                isLoading: false,
                isInitialized: true,
              });
              useUserStore.getState().reset();
              
              setShowEditModal(false);
              router.replace('/(auth)/login');
            } catch (error) {
              console.log('Failed to delete account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
            setIsUpdating(false);
          },
        },
      ]
    );
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
                name={partnerDisplayName}
                size="md"
                isOnline={partner.isOnline}
              />
              <View style={styles.connectionInfo}>
                <Text style={styles.connectionName}>{partnerDisplayName}</Text>
                <Text style={styles.connectionStatus}>
                  {partner.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.connectionCard}>
            <Text style={styles.connectionLabel}>Connected to</Text>
            <View style={styles.notConnectedContainer}>
              <View style={styles.placeholderAvatar}>
                <Ionicons name="person-outline" size={24} color={colors.text.tertiary} />
              </View>
              <View style={styles.connectionInfo}>
                <Text style={styles.placeholderName}>Not connected</Text>
                <Text style={styles.connectionStatus}>
                  Connect with your {profile?.role === 'parent' ? 'caregiver' : 'parent'}
                </Text>
              </View>
              <TouchableOpacity style={styles.connectSmallButton} onPress={handleConnectPartner}>
                <Text style={styles.connectSmallButtonText}>Connect</Text>
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

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Profile Picture Section */}
            <View style={styles.profilePictureSection}>
              <Avatar
                source={user?.profileImageUrl}
                name={user?.name}
                size="xl"
              />
              <TouchableOpacity 
                style={styles.changePhotoButton} 
                onPress={handleChangeProfilePicture}
                disabled={isUpdating}
              >
                <Ionicons name="camera" size={18} color={colors.primary[500]} />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Personal Information Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              {/* Mobile Number with Country Code */}
              <View style={styles.editField}>
                <View style={styles.editFieldIcon}>
                  <Ionicons name="call-outline" size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.editFieldContent}>
                  <Text style={styles.editFieldLabel}>Mobile Number with Country Code</Text>
                  <TextInput
                    style={styles.editFieldInput}
                    value={editPhone}
                    onChangeText={(text) => {
                      // Ensure phone starts with + for country code
                      if (text.length > 0 && !text.startsWith('+')) {
                        setEditPhone('+' + text);
                      } else {
                        setEditPhone(text);
                      }
                    }}
                    placeholder="+1 234 567 8900"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.editFieldHint}>
                    Include country code (e.g., +1 for US, +44 for UK)
                  </Text>
                </View>
              </View>

              {/* Partner Call Name */}
              <View style={styles.editField}>
                <View style={styles.editFieldIcon}>
                  <Ionicons name="heart-outline" size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.editFieldContent}>
                  <Text style={styles.editFieldLabel}>
                    What do you call your {profile?.role === 'parent' ? 'caregiver' : 'parent'}?
                  </Text>
                  <TextInput
                    style={styles.editFieldInput}
                    value={editPartnerCallName}
                    onChangeText={setEditPartnerCallName}
                    placeholder={profile?.role === 'parent' ? 'e.g., Son, Daughter' : 'e.g., Mom, Dad'}
                    placeholderTextColor={colors.text.tertiary}
                  />
                  <Text style={styles.editFieldHint}>
                    Used throughout the app (e.g., "{editPartnerCallName || 'Mom'}'s battery")
                  </Text>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity 
              style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]} 
              onPress={handleSaveProfile}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Text style={styles.saveButtonText}>Saving...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={colors.neutral.white} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Danger Zone */}
            <View style={styles.dangerSection}>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <TouchableOpacity 
                style={styles.deleteAccountButton} 
                onPress={handleDeleteAccount}
                disabled={isUpdating}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger.main} />
                <Text style={styles.deleteAccountText}>Delete Account</Text>
              </TouchableOpacity>
              <Text style={styles.deleteAccountHint}>
                This will permanently delete your account and all data.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
  },
  placeholderName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  connectSmallButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radius.lg,
  },
  connectSmallButtonText: {
    fontSize: typography.fontSize.sm,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    gap: spacing[2],
  },
  changePhotoText: {
    fontSize: typography.fontSize.base,
    color: colors.primary[500],
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[4],
    paddingLeft: spacing[1],
  },
  editField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  editFieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  editFieldContent: {
    flex: 1,
  },
  editFieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  editFieldInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  editFieldHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing[2],
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
    gap: spacing[2],
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  dangerSection: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: spacing[6],
  },
  dangerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.danger.main,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[3],
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger.light,
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  deleteAccountText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.danger.main,
  },
  deleteAccountHint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});

