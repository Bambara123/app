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
  startAfter,
  QueryDocumentSnapshot,
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

// Generate a unique 6-character connection code
const generateConnectionCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars: 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

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

    // Generate a unique connection code
    let connectionCode = generateConnectionCode();
    let isUnique = false;
    let attempts = 0;
    
    // Ensure the code is unique (retry up to 10 times)
    while (!isUnique && attempts < 10) {
      const existingUser = await this.findUserByConnectionCode(connectionCode);
      if (!existingUser) {
        isUnique = true;
      } else {
        connectionCode = generateConnectionCode();
        attempts++;
      }
    }

    // Create new user
    const newUser: Omit<User, 'id'> = {
      name: data.name,
      email: data.email,
      phone: null,
      profileImageUrl: data.profileImageUrl,
      role: null,
      connectedTo: null,
      connectionCode,
      nickname: null,
      partnerCallName: null,
      profileSetupComplete: false,
      noteForPartner: null,
      customGreeting: null,
      rhythm: null,
      batteryPercentage: null,
      mood: null,
      lastLocation: null,
      expoPushToken: null,
      missedReminders: 0,
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

  // Find a user by their unique connection code
  async findUserByConnectionCode(code: string): Promise<User | null> {
    const usersQuery = query(
      collection(db, 'users'),
      where('connectionCode', '==', code.toUpperCase()),
      limit(1)
    );

    const snapshot = await getDocs(usersQuery);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return this.convertUser(doc.data(), doc.id);
  },

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    
    // Filter out undefined values - Firestore doesn't accept undefined
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    
    await updateDoc(userRef, {
      ...cleanData,
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
      connectionCode: data.connectionCode || '',
      nickname: data.nickname || null,
      profileSetupComplete: data.profileSetupComplete ?? false,
      noteForPartner: data.noteForPartner || null,
      customGreeting: data.customGreeting || null,
      rhythm: data.rhythm || null,
      batteryPercentage: data.batteryPercentage ?? null,
      mood: data.mood || null,
      lastLocation: data.lastLocation
        ? {
            ...data.lastLocation,
            timestamp: timestampToDate(data.lastLocation.timestamp),
          }
        : null,
      expoPushToken: data.expoPushToken || null,
      missedReminders: data.missedReminders || 0,
      lastInteraction: timestampToDate(data.lastInteraction),
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
      partnerCallName: data.partnerCallName || null,
    };
  },

  // Reset missed reminders counter to 0
  async resetMissedReminders(userId: string): Promise<void> {
    await this.updateUser(userId, { missedReminders: 0 } as Partial<User>);
  },

  // Increment missed reminders counter by 1
  async incrementMissedReminders(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await this.updateUser(userId, { 
        missedReminders: (user.missedReminders || 0) + 1 
      } as Partial<User>);
    }
  },

  async deleteUser(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      // If connected to someone, clear their connectedTo field
      if (userData.connectedTo) {
        const partnerRef = doc(db, 'users', userData.connectedTo);
        await updateDoc(partnerRef, { connectedTo: null });
      }
      
      // Delete the user document
      await deleteDoc(userRef);
    }
  },

  async updateUserLocation(
    userId: string,
    location: { latitude: number; longitude: number; accuracy?: number; address?: string | null; timestamp: Date }
  ): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || null,
        address: location.address || null,
        timestamp: Timestamp.fromDate(location.timestamp),
      },
      lastInteraction: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
};

// ============================================
// CONNECTION SERVICE
// ============================================

export const connectionService = {
  // Connect to a partner using their connection code
  async connectByCode(
    myUserId: string,
    myRole: UserRole,
    partnerCode: string
  ): Promise<{ connection: Connection; partner: User }> {
    // Find the partner by their connection code
    const partner = await userService.findUserByConnectionCode(partnerCode);
    
    if (!partner) {
      throw new Error('Invalid code. No user found with this connection code.');
    }

    // Can't connect to yourself
    if (partner.id === myUserId) {
      throw new Error('You cannot connect to yourself.');
    }

    // Check if partner has a role set
    if (!partner.role) {
      throw new Error('This user has not selected their role yet. Ask them to complete their profile first.');
    }

    // Validate role compatibility - parent must connect with child and vice versa
    if (myRole === partner.role) {
      const roleName = myRole === 'parent' ? 'Parent' : 'Adult Child';
      throw new Error(`Both users are ${roleName}s. You need to connect with a ${myRole === 'parent' ? 'Child' : 'Parent'}.`);
    }

    // Check if either user is already connected
    const myUser = await userService.getUser(myUserId);
    if (myUser?.connectedTo) {
      throw new Error('You are already connected to someone. Please disconnect first in Settings.');
    }

    if (partner.connectedTo) {
      throw new Error(`${partner.name} is already connected to someone else.`);
    }

    // Determine parent and child IDs based on roles
    const parentId = myRole === 'parent' ? myUserId : partner.id;
    const childId = myRole === 'child' ? myUserId : partner.id;

    // Create the connection
    const connection = await this.createConnection(parentId, childId, myUserId);

    return { connection, partner };
  },

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

  // Disconnect from partner
  async disconnect(userId: string): Promise<void> {
    const connection = await this.findConnectionByUser(userId);
    
    if (!connection) {
      throw new Error('No active connection found.');
    }

    // Update connection status
    const connectionRef = doc(db, 'connections', connection.id);
    await updateDoc(connectionRef, {
      status: 'disconnected',
      updatedAt: serverTimestamp(),
    });

    // Clear connectedTo for both users
    await userService.updateUser(connection.parentId, { connectedTo: null });
    await userService.updateUser(connection.childId, { connectedTo: null });
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
      const docSnap = parentSnap.docs[0];
      return this.convertConnection(docSnap.data(), docSnap.id);
    }

    if (!childSnap.empty) {
      const docSnap = childSnap.docs[0];
      return this.convertConnection(docSnap.data(), docSnap.id);
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
      missCount: 0,
      customAlarmAudioUrl: null,
      followUpMinutes: input.followUpMinutes || 10,
      notificationId: null,
      ringCount: 1, // Start at first ring
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
    
    // Filter out undefined values - Firestore doesn't accept undefined
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    
    await updateDoc(reminderRef, {
      ...cleanData,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteReminder(reminderId: string): Promise<void> {
    const reminderRef = doc(db, 'reminders', reminderId);
    await deleteDoc(reminderRef);
  },

  async getReminder(reminderId: string): Promise<Reminder | null> {
    const reminderRef = doc(db, 'reminders', reminderId);
    const snap = await getDoc(reminderRef);
    
    if (!snap.exists()) return null;
    
    return this.convertReminder(snap.data(), snap.id);
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
      missCount: data.missCount || 0,
      customAlarmAudioUrl: data.customAlarmAudioUrl || null,
      followUpMinutes: data.followUpMinutes || 10,
      notificationId: data.notificationId || null,
      ringCount: data.ringCount || 1,
      serverNotificationSent: data.serverNotificationSent || false,
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

  // Load initial messages (most recent N messages)
  async loadInitialMessages(
    chatRoomId: string,
    pageSize: number = 20
  ): Promise<{ messages: Message[]; lastDoc: QueryDocumentSnapshot | null }> {
    const messagesQuery = query(
      collection(db, 'chatRooms', chatRoomId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    const snapshot = await getDocs(messagesQuery);
    const messages = snapshot.docs.map((doc) =>
      this.convertMessage(doc.data(), doc.id)
    );
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    
    return { messages: messages.reverse(), lastDoc };
  },

  // Load more (older) messages for pagination
  async loadMoreMessages(
    chatRoomId: string,
    lastDoc: QueryDocumentSnapshot,
    pageSize: number = 20
  ): Promise<{ messages: Message[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
    const messagesQuery = query(
      collection(db, 'chatRooms', chatRoomId, 'messages'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );

    const snapshot = await getDocs(messagesQuery);
    const messages = snapshot.docs.map((doc) =>
      this.convertMessage(doc.data(), doc.id)
    );
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    const hasMore = snapshot.docs.length === pageSize;
    
    return { messages: messages.reverse(), lastDoc: newLastDoc, hasMore };
  },

  // Subscribe to NEW messages only (for real-time updates)
  subscribeToNewMessages(
    chatRoomId: string,
    afterTimestamp: Date,
    callback: (newMessages: Message[]) => void
  ): () => void {
    const messagesQuery = query(
      collection(db, 'chatRooms', chatRoomId, 'messages'),
      where('createdAt', '>', Timestamp.fromDate(afterTimestamp)),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) =>
        this.convertMessage(doc.data(), doc.id)
      );
      if (newMessages.length > 0) {
        callback(newMessages);
      }
    });
  },

  // Keep the old method for backward compatibility (deprecated)
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
  // Check if there's an active (unacknowledged) alert from this user
  async hasActiveAlert(triggeredBy: string): Promise<boolean> {
    const alertsQuery = query(
      collection(db, 'emergencyAlerts'),
      where('triggeredBy', '==', triggeredBy),
      where('status', '==', 'active'),
      limit(1)
    );
    const snapshot = await getDocs(alertsQuery);
    return !snapshot.empty;
  },

  async triggerEmergency(
    triggeredBy: string,
    notifyUser: string,
    location: Location | null
  ): Promise<EmergencyAlert> {
    // Check for existing active alert first
    const hasActive = await this.hasActiveAlert(triggeredBy);
    if (hasActive) {
      throw new Error('You already have an active emergency alert. Please wait for it to be acknowledged.');
    }

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

