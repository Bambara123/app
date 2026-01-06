# TypeScript Types & Interfaces

Complete type definitions for the ElderCare application.

---

## Core Types

### User Types

```typescript
// src/types/user.ts

export type UserRole = 'parent' | 'child';

export type Mood = 'happy' | 'neutral' | 'sad' | 'tired';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
  address?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImageUrl: string | null;
  role: UserRole | null;
  connectedTo: string | null;
  
  // Partner Communication (displayed on partner's Home screen)
  noteForPartner: string | null;     // Note shown on partner's home
  customGreeting: string | null;     // Child can customize parent's greeting
  
  batteryPercentage: number | null;
  mood: Mood | null;
  lastLocation: GeoLocation | null;
  expoPushToken: string | null;
  lastInteraction: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImageUrl: string | null;
  role: UserRole | null;
}

export interface PartnerStatus {
  id: string;
  name: string;
  phone: string | null;
  profileImageUrl: string | null;
  batteryPercentage: number | null;
  mood: Mood | null;
  lastLocation: GeoLocation | null;
  lastInteraction: Date;
  isOnline: boolean;
  
  // Partner Communication
  noteForPartner: string | null;   // Note from partner (displayed on our home)
  customGreeting: string | null;   // Custom greeting set by child for parent
}

// Filter types for Reminders screen
export type ReminderFilterLabel = 'all' | ReminderLabel;
export type ReminderFilterStatus = 'all' | ReminderStatus;

export interface ReminderFilters {
  searchQuery: string;
  label: ReminderFilterLabel;
  status: ReminderFilterStatus;
}
```

---

### Connection Types

```typescript
// src/types/connection.ts

export type ConnectionStatus = 'pending' | 'active' | 'disconnected';

export interface Connection {
  id: string;
  parentId: string;
  childId: string;
  initiatedBy: string;
  status: ConnectionStatus;
  connectedAt: Date;
  updatedAt: Date;
}

export interface ConnectionRequest {
  partnerId: string;
  role: UserRole;
}
```

---

### Reminder Types

```typescript
// src/types/reminder.ts

export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'custom';

export type ReminderLabel = 'medicine' | 'meal' | 'doctor' | 'exercise' | 'other';

export type ReminderStatus = 'pending' | 'done' | 'missed' | 'snoozed';

export interface CustomRepeat {
  daysOfWeek?: number[];  // 0-6, Sunday=0
  intervalDays?: number;
  endDate?: Date;
  occurrences?: number;
}

export interface Reminder {
  id: string;
  createdBy: string;
  forUser: string;
  title: string;
  description: string | null;
  dateTime: Date;
  repeat: ReminderRepeat;
  customRepeat: CustomRepeat | null;
  label: ReminderLabel;
  icon: string;
  status: ReminderStatus;
  completedAt: Date | null;
  snoozedUntil: Date | null;
  snoozeCount: number;
  customAlarmAudioUrl: string | null;
  followUpMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderFormData {
  title: string;
  description?: string;
  dateTime: Date;
  repeat: ReminderRepeat;
  customRepeat?: CustomRepeat;
  label: ReminderLabel;
  followUpMinutes?: number;
}

export interface ReminderAction {
  type: 'done' | 'snooze' | 'dismiss';
  reminderId: string;
}

// Reminder label configuration
export const REMINDER_LABELS: Record<ReminderLabel, { icon: string; color: string; label: string }> = {
  medicine: { icon: 'pill', color: '#E74C3C', label: 'Medicine' },
  meal: { icon: 'utensils', color: '#F5A623', label: 'Meal' },
  doctor: { icon: 'stethoscope', color: '#4A90A4', label: 'Doctor' },
  exercise: { icon: 'running', color: '#27AE60', label: 'Exercise' },
  other: { icon: 'bell', color: '#636E72', label: 'Other' },
};
```

---

### Chat Types

```typescript
// src/types/chat.ts

export type MessageType = 'text' | 'image' | 'voice' | 'sticker' | 'mood' | 'contact';

export interface Message {
  id: string;
  senderId: string;
  type: MessageType;
  content: string;
  voiceDuration?: number;
  imageWidth?: number;
  imageHeight?: number;
  thumbnailUrl?: string;
  read: boolean;
  readAt: Date | null;
  timestamp: Date;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: LastMessage | null;
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LastMessage {
  content: string;
  senderId: string;
  type: MessageType;
  timestamp: Date;
}

export interface SendMessageData {
  type: MessageType;
  content: string;
  voiceDuration?: number;
  imageWidth?: number;
  imageHeight?: number;
}

export interface ContactShare {
  name: string;
  phone: string;
}

export interface Sticker {
  packId: string;
  stickerId: string;
  url: string;
}

export interface StickerPack {
  id: string;
  name: string;
  stickers: Sticker[];
}
```

---

### Album Types

```typescript
// src/types/album.ts

export interface AlbumImage {
  id: string;
  uploadedBy: string;
  imageUrl: string;
  thumbnailUrl: string;
  note: string | null;
  width: number;
  height: number;
  connectionId: string;
  createdAt: Date;
}

export interface UploadImageData {
  uri: string;
  note?: string;
}

export interface AlbumSection {
  title: string;  // e.g., "January 2024"
  data: AlbumImage[];
}
```

---

### Location Types

```typescript
// src/types/location.ts

export interface Location {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string | null;
  timestamp: Date;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
```

---

### Emergency Types

```typescript
// src/types/emergency.ts

export type EmergencyStatus = 'triggered' | 'acknowledged' | 'resolved';

export interface EmergencyAlert {
  id: string;
  triggeredBy: string;
  notifyUser: string;
  location: {
    latitude: number;
    longitude: number;
    address: string | null;
  } | null;
  status: EmergencyStatus;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
}
```

---

### Notification Types

```typescript
// src/types/notification.ts

export type NotificationType = 
  | 'reminder'
  | 'reminder_done'
  | 'reminder_missed'
  | 'emergency'
  | 'chat_message'
  | 'connection_request';

export interface PushNotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface LocalNotificationData {
  id: string;
  title: string;
  body: string;
  trigger: Date | NotificationTrigger;
  data?: Record<string, string>;
  sound?: string;
  categoryId?: string;
}

export interface NotificationTrigger {
  type: 'date' | 'interval';
  date?: Date;
  seconds?: number;
  repeats?: boolean;
}

export interface NotificationAction {
  id: string;
  title: string;
  options?: {
    isDestructive?: boolean;
    isAuthenticationRequired?: boolean;
    opensAppToForeground?: boolean;
  };
}

export interface NotificationCategory {
  id: string;
  actions: NotificationAction[];
}
```

---

### Navigation Types

```typescript
// src/types/navigation.ts

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  RoleSelection: undefined;
  PartnerConnection: undefined;
};

export type ParentTabParamList = {
  Home: undefined;
  Reminders: undefined;
  Chat: undefined;
  Album: undefined;
  Settings: undefined;
};

export type ChildTabParamList = {
  Home: undefined;
  Reminders: undefined;
  Chat: undefined;
  Album: undefined;
  Settings: undefined;
};

export type ReminderStackParamList = {
  ReminderList: undefined;
  ReminderDetail: { id: string };
  ReminderCreate: undefined;
  ReminderEdit: { id: string };
};

export type ModalParamList = {
  ReminderAlarm: { reminderId: string };
  EmergencyAlert: { alertId: string };
  ImagePreview: { imageUrl: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Parent: undefined;
  Child: undefined;
  Modal: undefined;
};
```

---

### Store Types (Zustand)

```typescript
// src/types/stores.ts

import { User, UserProfile, PartnerStatus, UserRole } from './user';
import { Reminder, ReminderFormData } from './reminder';
import { ChatRoom, Message, SendMessageData } from './chat';
import { AlbumImage, UploadImageData } from './album';
import { Location } from './location';
import { EmergencyAlert } from './emergency';

// Auth Store
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

// User Store
export interface UserState {
  profile: UserProfile | null;
  partner: PartnerStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  connectToPartner: (partnerId: string) => Promise<void>;
  disconnectFromPartner: () => Promise<void>;
  fetchPartnerStatus: () => Promise<void>;
  updateBatteryStatus: (percentage: number) => Promise<void>;
  updateMood: (mood: string) => Promise<void>;
  subscribeToPartner: () => () => void;
}

// Reminder Store
export interface ReminderState {
  reminders: Reminder[];
  activeReminder: Reminder | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchReminders: () => Promise<void>;
  createReminder: (data: ReminderFormData) => Promise<string>;
  updateReminder: (id: string, data: Partial<ReminderFormData>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markAsDone: (id: string) => Promise<void>;
  snoozeReminder: (id: string, minutes?: number) => Promise<void>;
  setActiveReminder: (reminder: Reminder | null) => void;
  subscribeToReminders: () => () => void;
}

// Chat Store
export interface ChatState {
  chatRoom: ChatRoom | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  
  // Actions
  initializeChatRoom: () => Promise<void>;
  sendMessage: (data: SendMessageData) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  subscribeToMessages: () => () => void;
}

// Location Store
export interface LocationState {
  currentLocation: Location | null;
  partnerLocation: Location | null;
  isTracking: boolean;
  error: string | null;
  
  // Actions
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  updateLocation: (location: Location) => Promise<void>;
  subscribeToPartnerLocation: () => () => void;
}

// Album Store
export interface AlbumState {
  images: AlbumImage[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  
  // Actions
  fetchImages: () => Promise<void>;
  uploadImage: (data: UploadImageData) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  loadMoreImages: () => Promise<void>;
}

// Notification Store
export interface NotificationState {
  expoPushToken: string | null;
  permissions: {
    granted: boolean;
    canAskAgain: boolean;
  };
  
  // Actions
  registerForPushNotifications: () => Promise<string | null>;
  scheduleLocalNotification: (reminder: Reminder) => Promise<string>;
  cancelNotification: (notificationId: string) => Promise<void>;
  handleNotificationResponse: (response: any) => void;
}

// Emergency Store
export interface EmergencyState {
  activeAlert: EmergencyAlert | null;
  isTriggering: boolean;
  error: string | null;
  
  // Actions
  triggerEmergency: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  subscribeToAlerts: () => () => void;
}
```

---

### API Response Types

```typescript
// src/types/api.ts

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  lastDoc?: any;  // Firestore DocumentSnapshot for pagination
}

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}
```

---

### Utility Types

```typescript
// src/types/utils.ts

// Make specific properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Extract array element type
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Firestore document with ID
export type WithId<T> = T & { id: string };

// Timestamp conversion
export type WithDates<T> = {
  [K in keyof T]: T[K] extends FirestoreTimestamp ? Date : T[K];
};
```

---

## Type Index File

```typescript
// src/types/index.ts

// User types
export * from './user';

// Connection types
export * from './connection';

// Reminder types
export * from './reminder';

// Chat types
export * from './chat';

// Album types
export * from './album';

// Location types
export * from './location';

// Emergency types
export * from './emergency';

// Notification types
export * from './notification';

// Navigation types
export * from './navigation';

// Store types
export * from './stores';

// API types
export * from './api';

// Utility types
export * from './utils';
```

