// src/services/permissions.ts
// Centralized permissions management

import { Alert, Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';

export interface PermissionsStatus {
  notifications: boolean;
  mediaLibrary: boolean;
  microphone: boolean;
}

// Request all necessary permissions
export const requestAllPermissions = async (): Promise<PermissionsStatus> => {
  const status: PermissionsStatus = {
    notifications: false,
    mediaLibrary: false,
    microphone: false,
  };

  try {
    // Notifications
    const { status: notifStatus } = await Notifications.requestPermissionsAsync();
    status.notifications = notifStatus === 'granted';

    // Media Library
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    status.mediaLibrary = mediaStatus === 'granted';

    // Microphone (for voice messages)
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    status.microphone = audioStatus === 'granted';

    return status;
  } catch (error) {
    console.log('Error requesting permissions:', error);
    return status;
  }
};

// Request permissions with explanation dialog
export const requestPermissionsWithExplanation = async (): Promise<void> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Permissions Required',
      'This app needs the following permissions to work properly:\n\n' +
      '• Notifications - To alert you about reminders and emergencies\n' +
      '• Photos - To share photos with your family\n' +
      '• Microphone - To send voice messages\n\n' +
      'Please allow these permissions on the next screens.',
      [
        {
          text: 'Continue',
          onPress: async () => {
            await requestAllPermissions();
            resolve();
          },
        },
      ],
      { cancelable: false }
    );
  });
};

// Check if all permissions are granted
export const checkAllPermissions = async (): Promise<PermissionsStatus> => {
  const status: PermissionsStatus = {
    notifications: false,
    mediaLibrary: false,
    microphone: false,
  };

  try {
    // Notifications
    const { status: notifStatus } = await Notifications.getPermissionsAsync();
    status.notifications = notifStatus === 'granted';

    // Media Library
    const { status: mediaStatus } = await MediaLibrary.getPermissionsAsync();
    status.mediaLibrary = mediaStatus === 'granted';

    // Microphone
    const { status: audioStatus } = await Audio.getPermissionsAsync();
    status.microphone = audioStatus === 'granted';

    return status;
  } catch (error) {
    console.log('Error checking permissions:', error);
    return status;
  }
};

// Open app settings for manual permission granting
export const openAppSettings = (): void => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    // Android-specific (not used - iOS-only app)
    Linking.openSettings();
  }
};

// Show dialog to guide user to settings
export const showPermissionSettingsDialog = (permissionName: string): void => {
  Alert.alert(
    'Permission Required',
    `${permissionName} permission is required for this feature. Would you like to enable it in Settings?`,
    [
      { text: 'Not Now', style: 'cancel' },
      { text: 'Open Settings', onPress: openAppSettings },
    ]
  );
};

