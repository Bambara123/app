// src/types/index.ts
// Core TypeScript types for ElderCare

import { Timestamp } from 'firebase/firestore';

// ============================================
// USER TYPES
// ============================================

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
  
  // Connection Code (unique 6-character code for pairing)
  connectionCode: string;
  
  // Nickname - how the user wants to be called by partner (e.g., "Mom", "Dad", "Son")
  nickname: string | null;
  
  // What the user calls their partner (e.g., "Mom", "Dad", "Son")
  partnerCallName: string | null;
  
  // Profile setup completed flag
  profileSetupComplete: boolean;
  
  // Partner Communication
  noteForPartner: string | null;
  customGreeting: string | null;
  
  // Current activity/status (Rhythm)
  rhythm: string | null;
  
  // Status (Parent only)
  batteryPercentage: number | null;
  mood: Mood | null;
  lastLocation: GeoLocation | null;
  
  // Push Notifications
  expoPushToken: string | null;
  
  // Metadata
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
  noteForPartner: string | null;
  customGreeting: string | null;
  rhythm: string | null;
}

// ============================================
// CONNECTION TYPES
// ============================================

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

// ============================================
// REMINDER TYPES
// ============================================

export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'custom';

export type ReminderLabel = 'medicine' | 'meal' | 'doctor' | 'exercise' | 'other';

export type ReminderStatus = 'pending' | 'done' | 'missed' | 'snoozed';

export interface CustomRepeat {
  days: number[];  // 0-6 (Sunday-Saturday)
  times: string[]; // HH:mm format
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
  missCount: number;
  customAlarmAudioUrl: string | null;
  followUpMinutes: number;
  notificationId: string | null;
  // Track when alarm was triggered for timeout handling
  alarmTriggeredAt: Date | null;
  // Scheduled notification ID for auto-miss
  missNotificationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReminderInput {
  title: string;
  description?: string;
  dateTime: Date;
  repeat: ReminderRepeat;
  customRepeat?: CustomRepeat;
  label: ReminderLabel;
  followUpMinutes?: number;
}

// Filter types
export type ReminderFilterLabel = 'all' | ReminderLabel;
export type ReminderFilterStatus = 'all' | ReminderStatus;

export interface ReminderFilters {
  searchQuery: string;
  label: ReminderFilterLabel;
  status: ReminderFilterStatus;
}

// ============================================
// CHAT TYPES
// ============================================

export type MessageType = 'text' | 'image' | 'voice' | 'sticker';

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Date;
  } | null;
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  type: MessageType;
  content: string;
  mediaUrl: string | null;
  duration: number | null;  // For voice messages
  readBy: string[];
  createdAt: Date;
}

export interface SendMessageInput {
  type: MessageType;
  content: string;
  mediaUrl?: string;
  duration?: number;
}

// ============================================
// LOCATION TYPES
// ============================================

export interface Location {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address: string | null;
  timestamp: Date;
}

// ============================================
// ALBUM TYPES
// ============================================

export interface AlbumImage {
  id: string;
  connectionId: string;
  uploadedBy: string;
  imageUrl: string;
  thumbnailUrl: string;
  note: string | null;
  width: number;
  height: number;
  createdAt: Date;
}

export interface AlbumSection {
  title: string;
  data: AlbumImage[];
}

// ============================================
// EMERGENCY TYPES
// ============================================

export type EmergencyStatus = 'active' | 'acknowledged' | 'resolved';

export interface EmergencyAlert {
  id: string;
  triggeredBy: string;
  notifyUser: string;
  status: EmergencyStatus;
  location: GeoLocation | null;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 
  | 'reminder'
  | 'emergency'
  | 'chat_message'
  | 'reminder_done'
  | 'reminder_snoozed'
  | 'reminder_missed'
  | 'reminder_missed_urgent'
  | 'reminder_escalation'
  | 'reminder_auto_miss';

export interface NotificationData {
  type: NotificationType;
  reminderId?: string;
  alertId?: string;
  chatRoomId?: string;
  senderId?: string;
}

// ============================================
// NAVIGATION TYPES
// ============================================

export type RootStackParamList = {
  '(auth)': undefined;
  '(parent)': undefined;
  '(child)': undefined;
  'modals/reminder-alarm': { reminderId: string };
  'modals/emergency-alert': { alertId: string };
  'modals/image-preview': { imageUrl: string };
  'modals/settings': undefined;
};

// ============================================
// FIRESTORE CONVERTERS
// ============================================

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export const timestampToDate = (timestamp: FirestoreTimestamp | Timestamp | Date | null): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if ('toDate' in timestamp) return timestamp.toDate();
  return new Date(timestamp.seconds * 1000);
};

