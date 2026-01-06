# ElderCare - Parent Care Mobile Application

A React Native (Expo) mobile application that helps adult children take care of their aging parents through reminders, real-time chat, location tracking, and emergency alerts.

<!-- DESIGN_INSPIRATION_SCREENSHOTS -->

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Documentation](#documentation)
6. [User Roles](#user-roles)
7. [Core Features](#core-features)
8. [Screens Overview](#screens-overview)

---

## Overview

ElderCare bridges the gap between aging parents ("Mom") and their adult children ("Son") by enabling:

- **Simple Communication** - Real-time chat with text, images, voice notes, and stickers
- **Smart Reminders** - Medicine, meal, and doctor appointment reminders with alarms
- **Safety Monitoring** - Location tracking and battery status visibility
- **Emergency Alerts** - One-tap emergency button for instant notifications
- **Shared Memories** - Photo album wall for family moments

The app features an award-winning, accessible UI designed for both elderly users and their tech-savvy children.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React Native with Expo (managed workflow) |
| **Language** | TypeScript |
| **Navigation** | Expo Router (file-based routing) |
| **State Management** | Zustand |
| **Backend** | Firebase |
| **Database** | Cloud Firestore |
| **Authentication** | Firebase Auth (Google + Apple Sign-In) |
| **Storage** | Firebase Storage |
| **Functions** | Firebase Cloud Functions |
| **Notifications** | Expo Notifications (local + push) |
| **Maps** | React Native Maps |
| **Target Platform** | iOS (App Store) |

---

## Project Structure

```
eldercare/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── role-selection.tsx
│   ├── (parent)/                 # Parent role screens (4 tabs)
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Home (Emergency + Status)
│   │   ├── reminders.tsx         # View-only reminders with filters
│   │   ├── chat.tsx              # Chat with call buttons
│   │   └── album.tsx             # Photo album
│   ├── (child)/                  # Adult child role screens (4 tabs)
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Home (Parent status + Map)
│   │   ├── reminders/
│   │   │   ├── index.tsx         # Reminders list with filters
│   │   │   └── [id].tsx          # Create/Edit reminder
│   │   ├── chat.tsx              # Chat with call buttons
│   │   └── album.tsx             # Photo album
│   ├── modals/
│   │   ├── reminder-alarm.tsx    # Parent: Alarm popup
│   │   ├── emergency-alert.tsx   # Child: Emergency notification
│   │   └── settings.tsx          # Settings (accessed via Home header)
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Entry point
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── common/               # Buttons, inputs, cards, modals
│   │   ├── chat/                 # ChatBubble, MessageInput, StickerPicker
│   │   ├── reminders/            # ReminderCard, ReminderForm
│   │   └── album/                # PhotoCard, PhotoWall
│   ├── stores/                   # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   ├── reminderStore.ts
│   │   ├── chatStore.ts
│   │   ├── locationStore.ts
│   │   ├── albumStore.ts
│   │   └── notificationStore.ts
│   ├── services/                 # Firebase & external services
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   ├── firestore.ts
│   │   │   └── storage.ts
│   │   ├── notifications.ts
│   │   └── location.ts
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useReminders.ts
│   │   ├── useChat.ts
│   │   ├── useLocation.ts
│   │   └── useNotifications.ts
│   ├── utils/                    # Helper functions
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   └── permissions.ts
│   ├── constants/                # App constants
│   │   ├── theme.ts              # Design system tokens
│   │   ├── colors.ts
│   │   └── config.ts
│   └── types/                    # TypeScript interfaces
│       └── index.ts
├── assets/                       # Static assets
│   ├── images/
│   ├── fonts/
│   ├── sounds/                   # Alarm sounds
│   └── stickers/                 # Chat stickers
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── emergency.ts
│   │   ├── reminders.ts
│   │   └── cleanup.ts
│   └── package.json
├── docs/                         # Detailed documentation
│   ├── database-schema.md
│   ├── navigation.md
│   ├── features.md
│   ├── components.md
│   ├── design-system.md
│   ├── cloud-functions.md
│   └── types.md
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
├── tsconfig.json
├── package.json
├── firestore.rules
├── storage.rules
└── .env.example
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase project
- Apple Developer account (for iOS deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd eldercare

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Firebase configuration

# Start development server
npx expo start
```

### Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Google and Apple providers)
3. Create a Firestore database
4. Enable Storage
5. Deploy Cloud Functions
6. Copy configuration to `.env`

See [docs/firebase-setup.md](docs/firebase-setup.md) for detailed instructions.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Database Schema](docs/database-schema.md) | Firestore collections, fields, and relationships |
| [Navigation](docs/navigation.md) | App navigation flow and screen hierarchy |
| [Features](docs/features.md) | Detailed feature implementation guides |
| [Components](docs/components.md) | UI component library specifications |
| [Design System](docs/design-system.md) | Colors, typography, spacing, and theming |
| [Cloud Functions](docs/cloud-functions.md) | Firebase functions and triggers |
| [TypeScript Types](docs/types.md) | All TypeScript interfaces and types |

---

## User Roles

### Parent (Mom)

An elderly user who may forget daily activities. Features:

- View reminders (read-only)
- Receive alarm notifications
- Mark tasks as "Done" or "Snooze"
- **Emergency button** for instant alerts
- Chat with adult child
- View/add photos to album
- Share location and battery status

### Adult Child (Son)

A 30-50 year old caring for their parent remotely. Features:

- Create/edit/delete reminders
- View parent's location on map
- View parent's battery percentage
- Receive emergency alerts
- Chat with parent
- View/add photos to album

---

## Core Features

### 1. Authentication
- Google Sign-In
- Apple Sign-In (required for iOS)
- Role selection after registration
- Partner connection via unique ID

### 2. Reminder System
- Adult child creates reminders
- Stored in Firestore, synced to parent's device
- Local notifications scheduled via Expo
- Alarm with "Done" and "Snooze (10 min)" options
- Notifications to child on completion or missed

### 3. Emergency Alerts
- Large, prominent emergency button for parent
- Triggers instant push notification to child
- Opens emergency screen on child's device
- Includes parent's current location

### 4. Real-time Chat
- Text messages with emoji support
- Image sharing (camera + gallery)
- Voice notes
- Sticker packs
- Real-time updates via Firestore

### 5. Location Tracking
- Background location updates from parent
- Map view for child to monitor
- Privacy-conscious (only shared with connected child)

### 6. Photo Album
- Shared photo wall
- Photos with notes/captions
- Chronological timeline view
- Infinite scroll from recent to oldest

---

## Screens Overview

<!-- SCREEN_WIREFRAMES -->

### Authentication Flow
1. **Login Screen** - Google/Apple sign-in options
2. **Role Selection** - Choose Parent or Adult Child mode
3. **Partner Connection** - Enter partner's ID to connect

### Tab Navigation (4 Tabs)
Both Parent and Child have the same 4 tabs: **Home | Reminders | Chat | Photo album**

Settings is accessed via a menu/profile icon on the Home screen header (not a tab).

### Parent Screens (4 tabs)
1. **Home** - Greeting (customizable by child) + Note from child, Status row (My Battery + Emergency Button), Recent Reminder section
2. **Reminders** - Filters and search bar, Upcoming reminders list (view-only)
3. **Chat** - WhatsApp call + Normal call buttons in header, Chat conversation
4. **Photo album** - Shared photo wall

### Adult Child Screens (4 tabs)
1. **Home** - Greeting + Note from parent, Parent status card (Mom's Battery + Mood), Google Maps showing parent location
2. **Reminders** - Filters and search bar, Reminders list with create/edit/delete
3. **Chat** - WhatsApp call + Normal call buttons in header, Chat conversation
4. **Photo album** - Shared photo wall

### Modal Screens
1. **Reminder Alarm** (Parent) - Alarm popup with Done/Snooze
2. **Emergency Alert** (Child) - Urgent notification with parent's location
3. **Settings** - Profile, notifications, permissions, partner connection

---

## Environment Variables

Create a `.env` file with:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Expo
EXPO_PUBLIC_EXPO_PROJECT_ID=
```

---

## App Store Compliance

This app is designed for iOS App Store submission:

- **Privacy Policy** - Required for location and health-adjacent features
- **Background Location** - Justified usage description for parent safety
- **Push Notifications** - Clear permission rationale
- **Apple Sign-In** - Implemented as required by Apple
- **Accessibility** - Large touch targets, readable fonts for elderly users

---

## License

MIT License - See LICENSE file for details.

