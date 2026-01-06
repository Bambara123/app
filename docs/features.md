# Features Implementation Guide

Detailed implementation guide for all ElderCare features.

---

## 1. Authentication

### Overview

Users authenticate using Google Sign-In or Apple Sign-In (required for iOS). After authentication, users select their role (Parent or Child) and connect with their partner.

### Implementation

```typescript
// src/services/firebase/auth.ts

import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  deleteUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { User } from '@/types';

const auth = getAuth();

// Google Sign-In
export const signInWithGoogle = async (): Promise<User> => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  const result = await promptAsync();
  
  if (result?.type === 'success') {
    const credential = GoogleAuthProvider.credential(result.authentication?.idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return await createOrUpdateUser(userCredential.user);
  }
  
  throw new Error('Google sign-in was cancelled');
};

// Apple Sign-In
export const signInWithApple = async (): Promise<User> => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const oAuthCredential = new OAuthProvider('apple.com').credential({
    idToken: credential.identityToken!,
  });

  const userCredential = await signInWithCredential(auth, oAuthCredential);
  
  // Apple only provides name on first sign-in
  const fullName = credential.fullName
    ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
    : null;

  return await createOrUpdateUser(userCredential.user, fullName);
};

// Create or update user document in Firestore
const createOrUpdateUser = async (
  firebaseUser: FirebaseUser,
  displayName?: string | null
): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Update last interaction
    await setDoc(userRef, { lastInteraction: serverTimestamp() }, { merge: true });
    return userSnap.data() as User;
  }

  // Create new user
  const newUser: Omit<User, 'id'> = {
    name: displayName || firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    phone: firebaseUser.phoneNumber || null,
    profileImageUrl: firebaseUser.photoURL || null,
    role: null,
    connectedTo: null,
    batteryPercentage: null,
    mood: null,
    lastLocation: null,
    expoPushToken: null,
    lastInteraction: serverTimestamp() as any,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(userRef, newUser);
  
  return { id: firebaseUser.uid, ...newUser } as User;
};

// Sign out
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// Delete account
export const deleteAccount = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  // Delete user document
  await deleteDoc(doc(db, 'users', user.uid));
  
  // Delete Firebase Auth user
  await deleteUser(user);
};
```

### Auth Store (Zustand)

```typescript
// src/stores/authStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithGoogle, signInWithApple, signOut, deleteAccount } from '@/services/firebase/auth';
import { AuthState, User } from '@/types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await signInWithGoogle();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      signInWithApple: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await signInWithApple();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await signOut();
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      deleteAccount: async () => {
        set({ isLoading: true });
        try {
          await deleteAccount();
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

---

## 2. Partner Connection

### Overview

After selecting a role, users connect by sharing their unique ID. Either party can initiate the connection.

### Implementation

```typescript
// src/services/firebase/connection.ts

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';
import { Connection, User, UserRole } from '@/types';

// Connect to partner using their ID
export const connectToPartner = async (
  currentUserId: string,
  currentUserRole: UserRole,
  partnerId: string
): Promise<Connection> => {
  // Verify partner exists
  const partnerRef = doc(db, 'users', partnerId);
  const partnerSnap = await getDoc(partnerRef);
  
  if (!partnerSnap.exists()) {
    throw new Error('User not found. Please check the ID and try again.');
  }

  const partner = partnerSnap.data() as User;

  // Verify roles are complementary
  if (currentUserRole === 'parent' && partner.role !== 'child') {
    throw new Error('This user is not registered as an Adult Child.');
  }
  if (currentUserRole === 'child' && partner.role !== 'parent') {
    throw new Error('This user is not registered as a Parent.');
  }

  // Check if partner is already connected
  if (partner.connectedTo && partner.connectedTo !== currentUserId) {
    throw new Error('This user is already connected to another person.');
  }

  // Determine parent and child IDs
  const parentId = currentUserRole === 'parent' ? currentUserId : partnerId;
  const childId = currentUserRole === 'child' ? currentUserId : partnerId;

  // Create connection document
  const connectionRef = doc(collection(db, 'connections'));
  const connection: Connection = {
    id: connectionRef.id,
    parentId,
    childId,
    initiatedBy: currentUserId,
    status: 'active',
    connectedAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(connectionRef, connection);

  // Update both users' connectedTo field
  await Promise.all([
    updateDoc(doc(db, 'users', currentUserId), { 
      connectedTo: partnerId,
      updatedAt: serverTimestamp(),
    }),
    updateDoc(doc(db, 'users', partnerId), { 
      connectedTo: currentUserId,
      updatedAt: serverTimestamp(),
    }),
  ]);

  // Create chat room
  await createChatRoom(parentId, childId);

  return connection;
};

// Create chat room for connected pair
const createChatRoom = async (parentId: string, childId: string): Promise<void> => {
  const chatRoomId = `${parentId}_${childId}`;
  const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
  
  await setDoc(chatRoomRef, {
    id: chatRoomId,
    participants: [parentId, childId],
    lastMessage: null,
    unreadCount: { [parentId]: 0, [childId]: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// Disconnect from partner
export const disconnectFromPartner = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) throw new Error('User not found');
  
  const user = userSnap.data() as User;
  if (!user.connectedTo) return;

  // Update both users
  await Promise.all([
    updateDoc(userRef, { connectedTo: null, updatedAt: serverTimestamp() }),
    updateDoc(doc(db, 'users', user.connectedTo), { 
      connectedTo: null, 
      updatedAt: serverTimestamp() 
    }),
  ]);

  // Update connection status
  const connectionsQuery = query(
    collection(db, 'connections'),
    where('status', '==', 'active'),
  );
  const connections = await getDocs(connectionsQuery);
  
  connections.forEach(async (doc) => {
    const conn = doc.data() as Connection;
    if (conn.parentId === userId || conn.childId === userId) {
      await updateDoc(doc.ref, { status: 'disconnected', updatedAt: serverTimestamp() });
    }
  });
};
```

---

## 3. Reminder System

### Overview

Adult children create reminders for parents. Reminders are stored in Firestore and trigger local notifications on the parent's device.

### Reminder Service

```typescript
// src/services/reminders.ts

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { db } from './firebase/config';
import { Reminder, ReminderFormData } from '@/types';

// Create a new reminder
export const createReminder = async (
  createdBy: string,
  forUser: string,
  data: ReminderFormData
): Promise<string> => {
  const reminderRef = await addDoc(collection(db, 'reminders'), {
    createdBy,
    forUser,
    title: data.title,
    description: data.description || null,
    dateTime: data.dateTime,
    repeat: data.repeat,
    customRepeat: data.customRepeat || null,
    label: data.label,
    icon: getReminderIcon(data.label),
    status: 'pending',
    completedAt: null,
    snoozedUntil: null,
    snoozeCount: 0,
    customAlarmAudioUrl: null,
    followUpMinutes: data.followUpMinutes || 10,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return reminderRef.id;
};

// Mark reminder as done
export const markReminderDone = async (reminderId: string): Promise<void> => {
  await updateDoc(doc(db, 'reminders', reminderId), {
    status: 'done',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// Snooze reminder
export const snoozeReminder = async (
  reminderId: string, 
  minutes: number = 10
): Promise<void> => {
  const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
  
  await updateDoc(doc(db, 'reminders', reminderId), {
    status: 'snoozed',
    snoozedUntil,
    snoozeCount: increment(1),
    updatedAt: serverTimestamp(),
  });
};

// Subscribe to reminders (real-time updates)
export const subscribeToReminders = (
  userId: string,
  role: 'parent' | 'child',
  callback: (reminders: Reminder[]) => void
): (() => void) => {
  const field = role === 'parent' ? 'forUser' : 'createdBy';
  
  const q = query(
    collection(db, 'reminders'),
    where(field, '==', userId),
    orderBy('dateTime', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const reminders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dateTime: doc.data().dateTime?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Reminder[];
    
    callback(reminders);
  });
};

const getReminderIcon = (label: string): string => {
  const icons: Record<string, string> = {
    medicine: 'medical',
    meal: 'restaurant',
    doctor: 'medkit',
    exercise: 'fitness',
    other: 'notifications',
  };
  return icons[label] || 'notifications';
};
```

### Local Notifications for Reminders

```typescript
// src/services/notifications.ts

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder } from '@/types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Schedule a reminder notification
export const scheduleReminderNotification = async (
  reminder: Reminder
): Promise<string> => {
  // Cancel existing notification for this reminder
  await Notifications.cancelScheduledNotificationAsync(reminder.id);

  const trigger = new Date(reminder.dateTime);
  
  // Don't schedule if in the past
  if (trigger <= new Date()) return '';

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.description || `Time for: ${reminder.title}`,
      data: { 
        type: 'reminder', 
        reminderId: reminder.id,
        label: reminder.label,
      },
      sound: reminder.customAlarmAudioUrl || 'default',
      categoryIdentifier: 'reminder',
    },
    trigger,
    identifier: reminder.id,
  });

  return notificationId;
};

// Schedule snooze notification
export const scheduleSnoozeNotification = async (
  reminder: Reminder,
  minutes: number
): Promise<string> => {
  const trigger = new Date(Date.now() + minutes * 60 * 1000);

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: `Reminder: ${reminder.title}`,
      body: `Snoozed ${minutes} minutes ago. Time to complete this task!`,
      data: { 
        type: 'reminder', 
        reminderId: reminder.id,
        isSnooze: true,
      },
      sound: 'default',
      categoryIdentifier: 'reminder',
    },
    trigger,
    identifier: `${reminder.id}_snooze`,
  });
};

// Set up notification categories with actions
export const setupNotificationCategories = async (): Promise<void> => {
  await Notifications.setNotificationCategoryAsync('reminder', [
    {
      identifier: 'done',
      buttonTitle: 'Done ✓',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'snooze',
      buttonTitle: 'Snooze 10min',
      options: { opensAppToForeground: false },
    },
  ]);
};

// Handle notification response (when user taps notification or action button)
export const handleNotificationResponse = async (
  response: Notifications.NotificationResponse
): Promise<void> => {
  const { notification, actionIdentifier } = response;
  const data = notification.request.content.data;

  if (data.type === 'reminder') {
    const reminderId = data.reminderId as string;

    switch (actionIdentifier) {
      case 'done':
        await markReminderDone(reminderId);
        break;
      case 'snooze':
        await snoozeReminder(reminderId, 10);
        break;
      default:
        // User tapped notification - navigate to reminder screen
        // Navigation handled by app
        break;
    }
  }
};
```

---

## 4. Emergency Alert System

### Overview

Parent presses emergency button → Creates alert in Firestore → Cloud Function sends push notification → Child receives instant alert with location.

### Emergency Service

```typescript
// src/services/emergency.ts

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import * as Location from 'expo-location';
import { db } from './firebase/config';
import { EmergencyAlert } from '@/types';

// Trigger emergency alert
export const triggerEmergencyAlert = async (
  parentId: string,
  childId: string
): Promise<string> => {
  // Get current location
  let location = null;
  try {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    
    // Reverse geocode for address
    const [address] = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    location = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: address 
        ? `${address.street}, ${address.city}, ${address.region}`
        : null,
    };
  } catch (error) {
    console.error('Failed to get location for emergency:', error);
  }

  // Create alert document (triggers Cloud Function)
  const alertRef = await addDoc(collection(db, 'emergencyAlerts'), {
    triggeredBy: parentId,
    notifyUser: childId,
    location,
    status: 'triggered',
    acknowledgedAt: null,
    resolvedAt: null,
    createdAt: serverTimestamp(),
  });

  return alertRef.id;
};

// Acknowledge emergency (child received the alert)
export const acknowledgeEmergency = async (alertId: string): Promise<void> => {
  await updateDoc(doc(db, 'emergencyAlerts', alertId), {
    status: 'acknowledged',
    acknowledgedAt: serverTimestamp(),
  });
};

// Resolve emergency
export const resolveEmergency = async (alertId: string): Promise<void> => {
  await updateDoc(doc(db, 'emergencyAlerts', alertId), {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
  });
};

// Subscribe to emergency alerts (for child)
export const subscribeToEmergencyAlerts = (
  childId: string,
  callback: (alert: EmergencyAlert | null) => void
): (() => void) => {
  const q = query(
    collection(db, 'emergencyAlerts'),
    where('notifyUser', '==', childId),
    where('status', '==', 'triggered')
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }

    // Get most recent alert
    const doc = snapshot.docs[0];
    callback({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    } as EmergencyAlert);
  });
};
```

---

## 5. Real-time Chat

### Chat Service

```typescript
// src/services/chat.ts

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  startAfter,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase/config';
import { Message, SendMessageData, ChatRoom } from '@/types';

const MESSAGES_PER_PAGE = 50;

// Get or create chat room
export const getChatRoom = async (
  userId: string,
  partnerId: string
): Promise<ChatRoom> => {
  // Chat room ID is deterministic based on user IDs
  const [first, second] = [userId, partnerId].sort();
  const chatRoomId = `${first}_${second}`;
  
  const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
  const snapshot = await getDoc(chatRoomRef);
  
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as ChatRoom;
  }
  
  // Create if doesn't exist
  const newChatRoom: Omit<ChatRoom, 'id'> = {
    participants: [userId, partnerId],
    lastMessage: null,
    unreadCount: { [userId]: 0, [partnerId]: 0 },
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };
  
  await setDoc(chatRoomRef, newChatRoom);
  return { id: chatRoomId, ...newChatRoom };
};

// Send a message
export const sendMessage = async (
  chatRoomId: string,
  senderId: string,
  data: SendMessageData
): Promise<string> => {
  const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
  
  const message: Omit<Message, 'id'> = {
    senderId,
    type: data.type,
    content: data.content,
    voiceDuration: data.voiceDuration,
    imageWidth: data.imageWidth,
    imageHeight: data.imageHeight,
    read: false,
    readAt: null,
    timestamp: serverTimestamp() as any,
  };

  const docRef = await addDoc(messagesRef, message);

  // Update chat room with last message
  await updateDoc(doc(db, 'chatRooms', chatRoomId), {
    lastMessage: {
      content: getMessagePreview(data),
      senderId,
      type: data.type,
      timestamp: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
    // Increment unread count for other participant
    [`unreadCount.${getOtherParticipant(chatRoomId, senderId)}`]: increment(1),
  });

  return docRef.id;
};

// Upload and send image
export const sendImageMessage = async (
  chatRoomId: string,
  senderId: string,
  imageUri: string
): Promise<string> => {
  // Upload to Firebase Storage
  const filename = `${Date.now()}_${senderId}.jpg`;
  const storageRef = ref(storage, `chat/${chatRoomId}/${filename}`);
  
  const response = await fetch(imageUri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
  
  const downloadUrl = await getDownloadURL(storageRef);
  
  // Get image dimensions
  const { width, height } = await getImageDimensions(imageUri);

  return sendMessage(chatRoomId, senderId, {
    type: 'image',
    content: downloadUrl,
    imageWidth: width,
    imageHeight: height,
  });
};

// Upload and send voice note
export const sendVoiceMessage = async (
  chatRoomId: string,
  senderId: string,
  audioUri: string,
  duration: number
): Promise<string> => {
  const filename = `${Date.now()}_${senderId}.m4a`;
  const storageRef = ref(storage, `voice/${chatRoomId}/${filename}`);
  
  const response = await fetch(audioUri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
  
  const downloadUrl = await getDownloadURL(storageRef);

  return sendMessage(chatRoomId, senderId, {
    type: 'voice',
    content: downloadUrl,
    voiceDuration: duration,
  });
};

// Subscribe to messages (real-time)
export const subscribeToMessages = (
  chatRoomId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'chatRooms', chatRoomId, 'messages'),
    orderBy('timestamp', 'desc'),
    limit(MESSAGES_PER_PAGE)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    })) as Message[];
    
    callback(messages.reverse()); // Reverse to show oldest first
  });
};

// Mark messages as read
export const markMessagesAsRead = async (
  chatRoomId: string,
  userId: string
): Promise<void> => {
  await updateDoc(doc(db, 'chatRooms', chatRoomId), {
    [`unreadCount.${userId}`]: 0,
  });
};

const getMessagePreview = (data: SendMessageData): string => {
  switch (data.type) {
    case 'image': return '📷 Photo';
    case 'voice': return '🎤 Voice message';
    case 'sticker': return '😊 Sticker';
    default: return data.content.slice(0, 50);
  }
};
```

---

## 6. Location Tracking

### Location Service

```typescript
// src/services/location.ts

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/config';
import { Location as LocationType } from '@/types';

const LOCATION_TASK_NAME = 'background-location-task';

// Request location permissions
export const requestLocationPermissions = async (): Promise<boolean> => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  
  if (foregroundStatus !== 'granted') {
    return false;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  
  return backgroundStatus === 'granted';
};

// Start background location tracking (Parent only)
export const startLocationTracking = async (userId: string): Promise<void> => {
  const hasPermission = await requestLocationPermissions();
  
  if (!hasPermission) {
    throw new Error('Location permission not granted');
  }

  // Define background task
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error('Location task error:', error);
      return;
    }

    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      const location = locations[0];
      
      if (location) {
        await updateUserLocation(userId, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
        });
      }
    }
  });

  // Start tracking
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5 * 60 * 1000, // 5 minutes
    distanceInterval: 100, // 100 meters
    foregroundService: {
      notificationTitle: 'ElderCare',
      notificationBody: 'Sharing location with your family',
      notificationColor: '#4A90A4',
    },
    pausesUpdatesAutomatically: true,
    showsBackgroundLocationIndicator: true,
  });
};

// Stop location tracking
export const stopLocationTracking = async (): Promise<void> => {
  const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  
  if (isTracking) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
};

// Update user's location in Firestore
const updateUserLocation = async (
  userId: string,
  location: { latitude: number; longitude: number; accuracy: number }
): Promise<void> => {
  // Reverse geocode
  let address = null;
  try {
    const [result] = await Location.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    });
    if (result) {
      address = `${result.street || ''}, ${result.city || ''}, ${result.region || ''}`.trim();
    }
  } catch (e) {
    console.warn('Reverse geocode failed:', e);
  }

  // Update user document
  await setDoc(
    doc(db, 'users', userId),
    {
      lastLocation: {
        ...location,
        address,
        timestamp: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Also add to locations collection for history
  await setDoc(doc(db, 'locations', `${userId}_${Date.now()}`), {
    userId,
    ...location,
    address,
    timestamp: serverTimestamp(),
  });
};

// Subscribe to partner's location (Child only)
export const subscribeToPartnerLocation = (
  partnerId: string,
  callback: (location: LocationType | null) => void
): (() => void) => {
  return onSnapshot(doc(db, 'users', partnerId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const data = snapshot.data();
    const lastLocation = data.lastLocation;
    
    if (lastLocation) {
      callback({
        ...lastLocation,
        timestamp: lastLocation.timestamp?.toDate(),
      });
    } else {
      callback(null);
    }
  });
};
```

---

## 7. Photo Album

### Album Service

```typescript
// src/services/album.ts

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { db, storage } from './firebase/config';
import { AlbumImage, UploadImageData } from '@/types';

const IMAGES_PER_PAGE = 20;

// Upload image to album
export const uploadAlbumImage = async (
  userId: string,
  connectionId: string,
  data: UploadImageData
): Promise<AlbumImage> => {
  const timestamp = Date.now();
  const filename = `${timestamp}_${userId}`;
  
  // Create thumbnail
  const thumbnail = await ImageManipulator.manipulateAsync(
    data.uri,
    [{ resize: { width: 400 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Get original image dimensions
  const { width, height } = await getImageDimensions(data.uri);

  // Upload original
  const originalRef = ref(storage, `album/${userId}/${filename}.jpg`);
  const originalBlob = await fetch(data.uri).then(r => r.blob());
  await uploadBytes(originalRef, originalBlob);
  const imageUrl = await getDownloadURL(originalRef);

  // Upload thumbnail
  const thumbRef = ref(storage, `album/${userId}/${filename}_thumb.jpg`);
  const thumbBlob = await fetch(thumbnail.uri).then(r => r.blob());
  await uploadBytes(thumbRef, thumbBlob);
  const thumbnailUrl = await getDownloadURL(thumbRef);

  // Save to Firestore
  const albumImageData = {
    uploadedBy: userId,
    imageUrl,
    thumbnailUrl,
    note: data.note || null,
    width,
    height,
    connectionId,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'albumImages'), albumImageData);

  return {
    id: docRef.id,
    ...albumImageData,
    createdAt: new Date(),
  } as AlbumImage;
};

// Fetch album images with pagination
export const fetchAlbumImages = async (
  connectionId: string,
  lastDoc?: any
): Promise<{ images: AlbumImage[]; lastDoc: any; hasMore: boolean }> => {
  let q = query(
    collection(db, 'albumImages'),
    where('connectionId', '==', connectionId),
    orderBy('createdAt', 'desc'),
    limit(IMAGES_PER_PAGE + 1)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const hasMore = snapshot.docs.length > IMAGES_PER_PAGE;
  const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

  const images = docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as AlbumImage[];

  return {
    images,
    lastDoc: docs[docs.length - 1] || null,
    hasMore,
  };
};

// Delete album image
export const deleteAlbumImage = async (image: AlbumImage): Promise<void> => {
  // Delete from storage
  const originalRef = ref(storage, image.imageUrl);
  const thumbRef = ref(storage, image.thumbnailUrl);
  
  await Promise.all([
    deleteObject(originalRef).catch(() => {}),
    deleteObject(thumbRef).catch(() => {}),
  ]);

  // Delete from Firestore
  await deleteDoc(doc(db, 'albumImages', image.id));
};
```

