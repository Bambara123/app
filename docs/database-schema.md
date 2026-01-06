# Database Schema - Firestore

This document defines the complete Firestore database structure for ElderCare.

---

## Collections Overview

```
firestore/
├── users/                    # User profiles
├── connections/              # Parent-Child relationships
├── reminders/                # Scheduled reminders
├── chatRooms/                # Chat room metadata
│   └── {chatRoomId}/messages/  # Chat messages (subcollection)
├── locations/                # Parent location history
└── albumImages/              # Shared photo album
```

---

## Collection: `users`

Stores user profile information for both parents and adult children.

```typescript
interface User {
  // Document ID = Firebase Auth UID
  id: string;
  
  // Profile
  name: string;
  email: string;
  phone: string | null;
  profileImageUrl: string | null;
  
  // Role & Connection
  role: 'parent' | 'child' | null;  // null until selected
  connectedTo: string | null;        // Partner's user ID
  
  // Partner Communication (visible on partner's Home screen)
  noteForPartner: string | null;     // Note displayed on partner's home
  customGreeting: string | null;     // Child can set parent's greeting text
  
  // Status (Parent only, updated by parent's device)
  batteryPercentage: number | null;  // 0-100
  mood: 'happy' | 'neutral' | 'sad' | 'tired' | null;
  lastLocation: {
    latitude: number;
    longitude: number;
    timestamp: Timestamp;
  } | null;
  
  // Push Notifications
  expoPushToken: string | null;
  
  // Metadata
  lastInteraction: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Indexes Required
- `role` (for querying by role)
- `connectedTo` (for finding partner)

### Example Document (Parent)
```json
{
  "id": "abc123",
  "name": "Mom",
  "email": "mom@example.com",
  "phone": "+1234567890",
  "profileImageUrl": "https://storage.googleapis.com/...",
  "role": "parent",
  "connectedTo": "xyz789",
  "noteForPartner": "Feeling good today! Had breakfast.",
  "customGreeting": null,
  "batteryPercentage": 75,
  "mood": "happy",
  "lastLocation": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "expoPushToken": "ExponentPushToken[xxxxxx]",
  "lastInteraction": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Example Document (Adult Child)
```json
{
  "id": "xyz789",
  "name": "John",
  "email": "john@example.com",
  "phone": "+1987654321",
  "profileImageUrl": "https://storage.googleapis.com/...",
  "role": "child",
  "connectedTo": "abc123",
  "noteForPartner": "Remember to take your vitamins!",
  "customGreeting": "Good morning, Mom! Have a wonderful day!",
  "batteryPercentage": null,
  "mood": null,
  "lastLocation": null,
  "expoPushToken": "ExponentPushToken[yyyyyy]",
  "lastInteraction": "2024-01-15T11:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

---

## Collection: `connections`

Tracks the relationship between parent and child users.

```typescript
interface Connection {
  id: string;  // Auto-generated
  
  parentId: string;   // User ID of parent
  childId: string;    // User ID of adult child
  
  // Connection metadata
  initiatedBy: string;  // User ID who initiated connection
  status: 'pending' | 'active' | 'disconnected';
  
  connectedAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Indexes Required
- Composite: `parentId` + `status`
- Composite: `childId` + `status`

---

## Collection: `reminders`

Stores all reminders created by adult children for parents.

```typescript
interface Reminder {
  id: string;  // Auto-generated
  
  // Ownership
  createdBy: string;   // Adult child's user ID
  forUser: string;     // Parent's user ID
  
  // Content
  title: string;
  description: string | null;
  
  // Scheduling
  dateTime: Timestamp;           // First occurrence
  repeat: 'none' | 'daily' | 'weekly' | 'custom';
  customRepeat: CustomRepeat | null;
  
  // Categorization
  label: 'medicine' | 'meal' | 'doctor' | 'exercise' | 'other';
  icon: string;  // Icon name for display
  
  // Status tracking
  status: 'pending' | 'done' | 'missed' | 'snoozed';
  completedAt: Timestamp | null;
  snoozedUntil: Timestamp | null;
  snoozeCount: number;  // Track how many times snoozed
  
  // Alarm settings
  customAlarmAudioUrl: string | null;  // Firebase Storage URL
  followUpMinutes: number;  // Default: 10 minutes
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface CustomRepeat {
  // For weekly repeats
  daysOfWeek?: number[];  // 0=Sunday, 1=Monday, etc.
  
  // For custom intervals
  intervalDays?: number;  // Every N days
  
  // End conditions
  endDate?: Timestamp;
  occurrences?: number;  // Stop after N occurrences
}
```

### Indexes Required
- Composite: `forUser` + `dateTime` (for querying upcoming reminders)
- Composite: `forUser` + `status` + `dateTime`
- Composite: `createdBy` + `createdAt`

### Example Document
```json
{
  "id": "rem123",
  "createdBy": "xyz789",
  "forUser": "abc123",
  "title": "Take morning medicine",
  "description": "Blood pressure pills - 2 tablets",
  "dateTime": "2024-01-15T08:00:00Z",
  "repeat": "daily",
  "customRepeat": null,
  "label": "medicine",
  "icon": "pill",
  "status": "pending",
  "completedAt": null,
  "snoozedUntil": null,
  "snoozeCount": 0,
  "customAlarmAudioUrl": null,
  "followUpMinutes": 10,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## Collection: `chatRooms`

Stores chat room metadata. Each connected pair has one chat room.

```typescript
interface ChatRoom {
  id: string;  // Auto-generated or `${parentId}_${childId}`
  
  participants: string[];  // [parentId, childId]
  
  // Last message preview
  lastMessage: {
    content: string;
    senderId: string;
    type: MessageType;
    timestamp: Timestamp;
  } | null;
  
  // Unread counts per user
  unreadCount: {
    [userId: string]: number;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Subcollection: `chatRooms/{chatRoomId}/messages`

```typescript
type MessageType = 'text' | 'image' | 'voice' | 'sticker' | 'mood' | 'contact';

interface Message {
  id: string;  // Auto-generated
  
  senderId: string;
  
  type: MessageType;
  
  // Content varies by type
  content: string;  // Text, URL, or JSON depending on type
  
  // For voice messages
  voiceDuration?: number;  // Duration in seconds
  
  // For images
  imageWidth?: number;
  imageHeight?: number;
  thumbnailUrl?: string;
  
  // Status
  read: boolean;
  readAt: Timestamp | null;
  
  timestamp: Timestamp;
}
```

### Message Content by Type

| Type | Content Field |
|------|---------------|
| `text` | Plain text string |
| `image` | Firebase Storage URL |
| `voice` | Firebase Storage URL |
| `sticker` | Sticker pack ID + sticker ID (e.g., "pack1:sticker3") |
| `mood` | Mood emoji identifier |
| `contact` | JSON: `{ name, phone }` |

### Indexes Required
- `chatRooms`: `participants` (array-contains)
- `messages`: `timestamp` (descending, for pagination)

---

## Collection: `locations`

Stores location history for parents (for child to view).

```typescript
interface Location {
  id: string;  // Auto-generated
  
  userId: string;  // Parent's user ID
  
  latitude: number;
  longitude: number;
  accuracy: number;  // Meters
  
  // Optional address (reverse geocoded)
  address: string | null;
  
  timestamp: Timestamp;
}
```

### Indexes Required
- Composite: `userId` + `timestamp` (descending)

### Data Retention
- Cloud Function runs daily to delete locations older than 7 days
- Only latest location is shown to child; history for debugging

---

## Collection: `albumImages`

Shared photo album between parent and child.

```typescript
interface AlbumImage {
  id: string;  // Auto-generated
  
  uploadedBy: string;  // User ID
  
  // Image data
  imageUrl: string;       // Firebase Storage URL (full size)
  thumbnailUrl: string;   // Firebase Storage URL (compressed)
  
  // Optional caption
  note: string | null;
  
  // For display
  width: number;
  height: number;
  
  // Connection context
  connectionId: string;  // Which parent-child pair
  
  createdAt: Timestamp;
}
```

### Indexes Required
- Composite: `connectionId` + `createdAt` (descending)

---

## Collection: `emergencyAlerts`

Tracks emergency button presses.

```typescript
interface EmergencyAlert {
  id: string;  // Auto-generated
  
  triggeredBy: string;  // Parent's user ID
  notifyUser: string;   // Child's user ID
  
  // Location at time of emergency
  location: {
    latitude: number;
    longitude: number;
    address: string | null;
  } | null;
  
  // Status
  status: 'triggered' | 'acknowledged' | 'resolved';
  acknowledgedAt: Timestamp | null;
  resolvedAt: Timestamp | null;
  
  createdAt: Timestamp;
}
```

### Indexes Required
- Composite: `notifyUser` + `status` + `createdAt`

---

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isConnectedTo(userId) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.connectedTo == userId;
    }
    
    function isParticipant(participants) {
      return request.auth.uid in participants;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isConnectedTo(userId));
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if isAuthenticated() && isOwner(userId);
    }
    
    // Connections collection
    match /connections/{connectionId} {
      allow read: if isAuthenticated() && 
        (resource.data.parentId == request.auth.uid || resource.data.childId == request.auth.uid);
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
        (resource.data.parentId == request.auth.uid || resource.data.childId == request.auth.uid);
      allow delete: if isAuthenticated() && 
        (resource.data.parentId == request.auth.uid || resource.data.childId == request.auth.uid);
    }
    
    // Reminders collection
    match /reminders/{reminderId} {
      allow read: if isAuthenticated() && 
        (resource.data.createdBy == request.auth.uid || resource.data.forUser == request.auth.uid);
      // Only child can create/update/delete
      allow create: if isAuthenticated() && 
        request.resource.data.createdBy == request.auth.uid;
      allow update: if isAuthenticated() && 
        (resource.data.createdBy == request.auth.uid || 
         (resource.data.forUser == request.auth.uid && 
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'completedAt', 'snoozedUntil', 'snoozeCount', 'updatedAt'])));
      allow delete: if isAuthenticated() && resource.data.createdBy == request.auth.uid;
    }
    
    // Chat rooms
    match /chatRooms/{chatRoomId} {
      allow read: if isAuthenticated() && isParticipant(resource.data.participants);
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && isParticipant(resource.data.participants);
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if isAuthenticated() && 
          isParticipant(get(/databases/$(database)/documents/chatRooms/$(chatRoomId)).data.participants);
        allow create: if isAuthenticated() && 
          isParticipant(get(/databases/$(database)/documents/chatRooms/$(chatRoomId)).data.participants) &&
          request.resource.data.senderId == request.auth.uid;
        allow update: if isAuthenticated() && 
          isParticipant(get(/databases/$(database)/documents/chatRooms/$(chatRoomId)).data.participants);
      }
    }
    
    // Locations (parent shares with child)
    match /locations/{locationId} {
      allow read: if isAuthenticated() && 
        (resource.data.userId == request.auth.uid || isConnectedTo(resource.data.userId));
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Album images
    match /albumImages/{imageId} {
      allow read: if isAuthenticated() && 
        (resource.data.uploadedBy == request.auth.uid || isConnectedTo(resource.data.uploadedBy));
      allow create: if isAuthenticated() && request.resource.data.uploadedBy == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.uploadedBy == request.auth.uid;
    }
    
    // Emergency alerts
    match /emergencyAlerts/{alertId} {
      allow read: if isAuthenticated() && 
        (resource.data.triggeredBy == request.auth.uid || resource.data.notifyUser == request.auth.uid);
      allow create: if isAuthenticated() && request.resource.data.triggeredBy == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.notifyUser == request.auth.uid;
    }
  }
}
```

---

## Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Profile images
    match /profiles/{userId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Chat images
    match /chat/{chatRoomId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // Voice notes
    match /voice/{chatRoomId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // Album images
    match /album/{userId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Custom alarm sounds
    match /alarms/{userId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
  }
}
```

