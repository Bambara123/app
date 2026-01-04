// src/services/notifications.ts
// Expo Notifications service

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { NotificationData } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions and get push token
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return null;
    }

    // Get Expo push token - requires EAS project ID
    // Skip in development if not configured
    const projectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;
    if (!projectId) {
      console.log('Skipping push token registration - no Expo project ID configured');
      console.log('Push notifications will work with local notifications only');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E85A6B',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 500, 500, 500],
      });

      await Notifications.setNotificationChannelAsync('emergency', {
        name: 'Emergency',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 1000, 500, 1000],
        lightColor: '#EF5350',
      });
    }

    return tokenData.data;
  } catch (error) {
    console.log('Push notification registration failed:', error);
    console.log('App will continue without push notifications');
    return null;
  }
};

// Schedule local notification for reminder
export const scheduleReminderNotification = async (
  reminderId: string,
  title: string,
  body: string,
  triggerDate: Date
): Promise<string> => {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'reminder', reminderId } as NotificationData,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      date: triggerDate,
    },
  });

  return identifier;
};

// Cancel scheduled notification
export const cancelNotification = async (
  notificationId: string
): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Setup notification response listener
export const setupNotificationListeners = (): () => void => {
  // Handle notification received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
    }
  );

  // Handle notification tap
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content
        .data as NotificationData;

      handleNotificationTap(data);
    });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

// Handle notification tap navigation
const handleNotificationTap = (data: NotificationData): void => {
  switch (data.type) {
    case 'reminder':
      if (data.reminderId) {
        router.push({
          pathname: '/modals/reminder-alarm',
          params: { reminderId: data.reminderId },
        });
      }
      break;

    case 'emergency':
      if (data.alertId) {
        router.push({
          pathname: '/modals/emergency-alert',
          params: { alertId: data.alertId },
        });
      }
      break;

    case 'chat_message':
      // Navigate to chat screen - handled by tab navigation
      break;

    default:
      break;
  }
};

// Send local notification immediately (for testing)
export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: NotificationData
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Send immediately
  });
};

// Get badge count
export const getBadgeCount = async (): Promise<number> => {
  return await Notifications.getBadgeCountAsync();
};

// Set badge count
export const setBadgeCount = async (count: number): Promise<void> => {
  await Notifications.setBadgeCountAsync(count);
};

