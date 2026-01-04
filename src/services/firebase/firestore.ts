// src/services/firebase/firestore.ts
// Firestore database service

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryConstraint,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';
import {
  User,
  Connection,
  Reminder,
  ChatRoom,
  Message,
  Location,
  AlbumImage,
  EmergencyAlert,
  timestampToDate,
  CreateReminderInput,
  SendMessageInput,
  ReminderStatus,
  ConnectionStatus,
  UserRole,
} from '../../types';

// ============================================
// USER SERVICE
// ============================================

export const userService = {
  async getOrCreateUser(data: {
    id: string;
    email: string;
    name: string;
    profileImageUrl: string | null;
  }): Promise<User> {
    const userRef = doc(db, 'users', data.id);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return this.convertUser(userSnap.data(), data.id);
    }

    // Create new user
    const newUser: Omit<User, 'id'> = {
      name: data.name,
      email: data.email,
      phone: null,
      profileImageUrl: data.profileImageUrl,
      role: null,
      connectedTo: null,
      noteForPartner: null,
      customGreeting: null,
      batteryPercentage: null,
      mood: null,
      lastLocation: null,
      expoPushToken: null,
      lastInteraction: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(userRef, {
      ...newUser,
      lastInteraction: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: data.id, ...newUser };
  },

  async getUser(userId: string): Promise<User | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;
    return this.convertUser(userSnap.data(), userId);
  },

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async setRole(userId: string, role: UserRole): Promise<void> {
    await this.updateUser(userId, { role });
  },

  async updatePushToken(userId: string, token: string): Promise<void> {
    await this.updateUser(userId, { expoPushToken: token });
  },

  async updateStatus(
    userId: string,
    data: {
      batteryPercentage?: number;
      mood?: string;
      lastLocation?: Location;
    }
  ): Promise<void> {
    await this.updateUser(userId, {
      ...data,
      lastInteraction: new Date(),
    } as Partial<User>);
  },

  subscribeToUser(
    userId: string,
    callback: (user: User | null) => void
  ): () => void {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        callback(this.convertUser(snap.data(), userId));
      } else {
        callback(null);
      }
    });
  },

  convertUser(data: DocumentData, id: string): User {
    return {
      id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || null,
      profileImageUrl: data.profileImageUrl || null,
      role: data.role || null,
      connectedTo: data.connectedTo || null,
      noteForPartner: data.noteForPartner || null,
      customGreeting: data.customGreeting || null,
      batteryPercentage: data.batteryPercentage ?? null,
      mood: data.mood || null,
      lastLocation: data.lastLocation
        ? {
            ...data.lastLocation,
            timestamp: timestampToDate(data.lastLocation.timestamp),
          }
        : null,
      expoPushToken: data.expoPushToken || null,
      lastInteraction: timestampToDate(data.lastInteraction),
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    };
  },
};

// ============================================
// CONNECTION SERVICE
// ============================================

export const connectionService = {
  async createConnection(
    parentId: string,
    childId: string,
    initiatedBy: string
  ): Promise<Connection> {
    const connectionRef = collection(db, 'connections');
    const newConnection = {
      parentId,
      childId,
      initiatedBy,
      status: 'active' as ConnectionStatus,
      connectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(connectionRef, newConnection);

    // Update both users
    await userService.updateUser(parentId, { connectedTo: childId });
    await userService.updateUser(childId, { connectedTo: parentId });

    return {
      id: docRef.id,
      ...newConnection,
      connectedAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findConnectionByUser(userId: string): Promise<Connection | null> {
    const parentQuery = query(
      collection(db, 'connections'),
      where('parentId', '==', userId),
      where('status', '==', 'active'),
      limit(1)
    );
    
    const childQuery = query(
      collection(db, 'connections'),
      where('childId', '==', userId),
      where('status', '==', 'active'),
      limit(1)
    );

    const [parentSnap, childSnap] = await Promise.all([
      getDocs(parentQuery),
      getDocs(childQuery),
    ]);

    if (!parentSnap.empty) {
      const doc = parentSnap.docs[0];
      return this.convertConnection(doc.data(), doc.id);
    }

    if (!childSnap.empty) {
      const doc = childSnap.docs[0];
      return this.convertConnection(doc.data(), doc.id);
    }

    return null;
  },

  convertConnection(data: DocumentData, id: string): Connection {
    return {
      id,
      parentId: data.parentId,
      childId: data.childId,
      initiatedBy: data.initiatedBy,
      status: data.status,
      connectedAt: timestampToDate(data.connectedAt),
      updatedAt: timestampToDate(data.updatedAt),
    };
  },
};

// ============================================
// REMINDER SERVICE
// ============================================

export const reminderService = {
  async createReminder(
    createdBy: string,
    forUser: string,
    input: CreateReminderInput
  ): Promise<Reminder> {
    const reminderRef = collection(db, 'reminders');
    const newReminder = {
      createdBy,
      forUser,
      title: input.title,
      description: input.description || null,
      dateTime: Timestamp.fromDate(input.dateTime),
      repeat: input.repeat,
      customRepeat: input.customRepeat || null,
      label: input.label,
      icon: this.getLabelIcon(input.label),
      status: 'pending' as ReminderStatus,
      completedAt: null,
      snoozedUntil: null,
      snoozeCount: 0,
      customAlarmAudioUrl: null,
      followUpMinutes: input.followUpMinutes || 10,
      notificationId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(reminderRef, newReminder);
    return {
      id: docRef.id,
      ...newReminder,
      dateTime: input.dateTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateReminder(
    reminderId: string,
    data: Partial<Reminder>
  ): Promise<void> {
    const reminderRef = doc(db, 'reminders', reminderId);
    await updateDoc(reminderRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteReminder(reminderId: string): Promise<void> {
    const reminderRef = doc(db, 'reminders', reminderId);
    await deleteDoc(reminderRef);
  },

  async markAsDone(reminderId: string): Promise<void> {
    await this.updateReminder(reminderId, {
      status: 'done',
      completedAt: new Date(),
    });
  },

  async snooze(reminderId: string, minutes: number = 10): Promise<void> {
    const reminderRef = doc(db, 'reminders', reminderId);
    const snap = await getDoc(reminderRef);
    if (!snap.exists()) return;

    const currentSnoozeCount = snap.data().snoozeCount || 0;
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);

    await this.updateReminder(reminderId, {
      status: 'snoozed',
      snoozedUntil,
      snoozeCount: currentSnoozeCount + 1,
    });
  },

  subscribeToReminders(
    userId: string,
    isParent: boolean,
    callback: (reminders: Reminder[]) => void
  ): () => void {
    const field = isParent ? 'forUser' : 'createdBy';
    const remindersQuery = query(
      collection(db, 'reminders'),
      where(field, '==', userId),
      orderBy('dateTime', 'asc')
    );

    return onSnapshot(remindersQuery, (snapshot) => {
      const reminders = snapshot.docs.map((doc) =>
        this.convertReminder(doc.data(), doc.id)
      );
      callback(reminders);
    });
  },

  getLabelIcon(label: string): string {
    const icons: Record<string, string> = {
      medicine: 'medical',
      meal: 'restaurant',
      doctor: 'medkit',
      exercise: 'fitness',
      other: 'notifications',
    };
    return icons[label] || 'notifications';
  },

  convertReminder(data: DocumentData, id: string): Reminder {
    return {
      id,
      createdBy: data.createdBy,
      forUser: data.forUser,
      title: data.title,
      description: data.description || null,
      dateTime: timestampToDate(data.dateTime),
      repeat: data.repeat,
      customRepeat: data.customRepeat || null,
      label: data.label,
      icon: data.icon,
      status: data.status,
      completedAt: data.completedAt
        ? timestampToDate(data.completedAt)
        : null,
      snoozedUntil: data.snoozedUntil
        ? timestampToDate(data.snoozedUntil)
        : null,
      snoozeCount: data.snoozeCount || 0,
      customAlarmAudioUrl: data.customAlarmAudioUrl || null,
      followUpMinutes: data.followUpMinutes || 10,
      notificationId: data.notificationId || null,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    };
  },
};

// ============================================
// CHAT SERVICE
// ============================================

export const chatService = {
  async getOrCreateChatRoom(participants: string[]): Promise<ChatRoom> {
    // Sort participants to ensure consistent room ID
    const sortedParticipants = [...participants].sort();
    
    // Check if room exists
    const roomsQuery = query(
      collection(db, 'chatRooms'),
      where('participants', '==', sortedParticipants),
      limit(1)
    );
    
    const snapshot = await getDocs(roomsQuery);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return this.convertChatRoom(doc.data(), doc.id);
    }

    // Create new room
    const newRoom = {
      participants: sortedParticipants,
      lastMessage: null,
      unreadCount: sortedParticipants.reduce(
        (acc, p) => ({ ...acc, [p]: 0 }),
        {}
      ),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'chatRooms'), newRoom);
    return {
      id: docRef.id,
      ...newRoom,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async sendMessage(
    chatRoomId: string,
    senderId: string,
    input: SendMessageInput
  ): Promise<Message> {
    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const newMessage = {
      chatRoomId,
      senderId,
      type: input.type,
      content: input.content,
      mediaUrl: input.mediaUrl || null,
      duration: input.duration || null,
      readBy: [senderId],
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(messagesRef, newMessage);

    // Update chat room
    const roomRef = doc(db, 'chatRooms', chatRoomId);
    await updateDoc(roomRef, {
      lastMessage: {
        text: input.type === 'text' ? input.content : `[${input.type}]`,
        senderId,
        timestamp: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...newMessage,
      createdAt: new Date(),
    };
  },

  subscribeToMessages(
    chatRoomId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const messagesQuery = query(
      collection(db, 'chatRooms', chatRoomId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map((doc) =>
        this.convertMessage(doc.data(), doc.id)
      );
      callback(messages.reverse());
    });
  },

  convertChatRoom(data: DocumentData, id: string): ChatRoom {
    return {
      id,
      participants: data.participants,
      lastMessage: data.lastMessage
        ? {
            ...data.lastMessage,
            timestamp: timestampToDate(data.lastMessage.timestamp),
          }
        : null,
      unreadCount: data.unreadCount || {},
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    };
  },

  convertMessage(data: DocumentData, id: string): Message {
    return {
      id,
      chatRoomId: data.chatRoomId,
      senderId: data.senderId,
      type: data.type,
      content: data.content,
      mediaUrl: data.mediaUrl || null,
      duration: data.duration || null,
      readBy: data.readBy || [],
      createdAt: timestampToDate(data.createdAt),
    };
  },
};

// ============================================
// EMERGENCY SERVICE
// ============================================

export const emergencyService = {
  async triggerEmergency(
    triggeredBy: string,
    notifyUser: string,
    location: Location | null
  ): Promise<EmergencyAlert> {
    const alertRef = collection(db, 'emergencyAlerts');
    const newAlert = {
      triggeredBy,
      notifyUser,
      status: 'active',
      location: location
        ? {
            ...location,
            timestamp: Timestamp.fromDate(location.timestamp),
          }
        : null,
      acknowledgedAt: null,
      resolvedAt: null,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(alertRef, newAlert);
    return {
      id: docRef.id,
      ...newAlert,
      location: location || null,
      createdAt: new Date(),
    } as EmergencyAlert;
  },

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alertRef = doc(db, 'emergencyAlerts', alertId);
    await updateDoc(alertRef, {
      status: 'acknowledged',
      acknowledgedAt: serverTimestamp(),
    });
  },

  async resolveAlert(alertId: string): Promise<void> {
    const alertRef = doc(db, 'emergencyAlerts', alertId);
    await updateDoc(alertRef, {
      status: 'resolved',
      resolvedAt: serverTimestamp(),
    });
  },

  subscribeToAlerts(
    userId: string,
    callback: (alerts: EmergencyAlert[]) => void
  ): () => void {
    const alertsQuery = query(
      collection(db, 'emergencyAlerts'),
      where('notifyUser', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        location: doc.data().location
          ? {
              ...doc.data().location,
              timestamp: timestampToDate(doc.data().location.timestamp),
            }
          : null,
        acknowledgedAt: doc.data().acknowledgedAt
          ? timestampToDate(doc.data().acknowledgedAt)
          : null,
        resolvedAt: doc.data().resolvedAt
          ? timestampToDate(doc.data().resolvedAt)
          : null,
        createdAt: timestampToDate(doc.data().createdAt),
      })) as EmergencyAlert[];
      callback(alerts);
    });
  },
};

// ============================================
// ALBUM SERVICE
// ============================================

export const albumService = {
  async addImage(
    connectionId: string,
    uploadedBy: string,
    imageData: {
      imageUrl: string;
      thumbnailUrl: string;
      width: number;
      height: number;
      note?: string;
    }
  ): Promise<AlbumImage> {
    const albumRef = collection(db, 'albumImages');
    const newImage = {
      connectionId,
      uploadedBy,
      imageUrl: imageData.imageUrl,
      thumbnailUrl: imageData.thumbnailUrl,
      note: imageData.note || null,
      width: imageData.width,
      height: imageData.height,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(albumRef, newImage);
    return {
      id: docRef.id,
      ...newImage,
      createdAt: new Date(),
    };
  },

  subscribeToAlbum(
    connectionId: string,
    callback: (images: AlbumImage[]) => void
  ): () => void {
    const albumQuery = query(
      collection(db, 'albumImages'),
      where('connectionId', '==', connectionId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(albumQuery, (snapshot) => {
      const images = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: timestampToDate(doc.data().createdAt),
      })) as AlbumImage[];
      callback(images);
    });
  },
};

