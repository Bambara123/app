# Navigation Architecture

File-based routing using Expo Router for ElderCare application.

---

## Navigation Flow Diagram

```
App Entry
    │
    ▼
┌─────────────────┐
│  Auth Check     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌─────────────────┐
│ Login  │  │ Role Selected?  │
└────────┘  └────────┬────────┘
                     │
              ┌──────┴──────┐
              │             │
              ▼             ▼
        ┌──────────┐  ┌───────────────┐
        │ Select   │  │ Has Partner?  │
        │ Role     │  └───────┬───────┘
        └──────────┘          │
                        ┌─────┴─────┐
                        │           │
                        ▼           ▼
                  ┌──────────┐  ┌───────────────┐
                  │ Connect  │  │ Main App      │
                  │ Partner  │  │ (Role-based)  │
                  └──────────┘  └───────────────┘
                                       │
                              ┌────────┴────────┐
                              │                 │
                              ▼                 ▼
                        ┌──────────┐     ┌──────────┐
                        │ Parent   │     │ Child    │
                        │ Tabs     │     │ Tabs     │
                        └──────────┘     └──────────┘
```

---

## Directory Structure

```
app/
├── _layout.tsx              # Root layout with auth provider
├── index.tsx                # Entry redirect
├── (auth)/                  # Auth group (unauthenticated)
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── role-selection.tsx
│   └── partner-connection.tsx
├── (parent)/                # Parent tab group (4 tabs)
│   ├── _layout.tsx          # Tab navigator
│   ├── index.tsx            # Home (Emergency + Status)
│   ├── reminders.tsx        # View-only with filters
│   ├── chat.tsx             # Chat with call buttons
│   └── album.tsx            # Photo album
├── (child)/                 # Child tab group (4 tabs)
│   ├── _layout.tsx          # Tab navigator
│   ├── index.tsx            # Home (Parent Status + Map)
│   ├── reminders/
│   │   ├── _layout.tsx      # Stack navigator
│   │   ├── index.tsx        # List with filters/search
│   │   ├── create.tsx
│   │   └── [id].tsx         # Edit
│   ├── chat.tsx             # Chat with call buttons
│   └── album.tsx            # Photo album
└── modals/                  # Modal screens
    ├── reminder-alarm.tsx
    ├── emergency-alert.tsx
    ├── image-preview.tsx
    └── settings.tsx         # Settings accessed via modal
```

**Note:** Settings is NOT a tab. It's accessed via a profile/menu icon on the Home screen header.

---

## Root Layout

```typescript
// app/_layout.tsx

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/stores/authStore';
import { setupNotificationCategories } from '@/services/notifications';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, user } = useAuthStore();
  
  const [fontsLoaded] = useFonts({
    // Add custom fonts if needed
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Setup notification categories
    setupNotificationCategories();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" />
        ) : !user?.role ? (
          <Stack.Screen name="(auth)/role-selection" />
        ) : !user?.connectedTo ? (
          <Stack.Screen name="(auth)/partner-connection" />
        ) : user.role === 'parent' ? (
          <Stack.Screen name="(parent)" />
        ) : (
          <Stack.Screen name="(child)" />
        )}
        
        {/* Modal screens */}
        <Stack.Screen
          name="modals/reminder-alarm"
          options={{
            presentation: 'fullScreenModal',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="modals/emergency-alert"
          options={{
            presentation: 'fullScreenModal',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="modals/image-preview"
          options={{
            presentation: 'transparentModal',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

---

## Auth Layout

```typescript
// app/(auth)/_layout.tsx

import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="partner-connection" />
    </Stack>
  );
}
```

---

## Parent Tab Layout

**4 Tabs:** Home | Reminders | Chat | Photo album

```typescript
// app/(parent)/_layout.tsx

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout } from '@/constants/theme';
import { tabIcons } from '@/constants/icons';
import { useChatStore } from '@/stores/chatStore';

export default function ParentTabLayout() {
  const { chatRoom } = useChatStore();
  const unreadCount = chatRoom?.unreadCount?.[/* userId */] || 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          height: layout.tabBarHeight,
          paddingBottom: 20,
          paddingTop: 10,
          backgroundColor: colors.neutral.white,
          borderTopWidth: 1,
          borderTopColor: colors.neutral[200],
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.home.active : tabIcons.home.inactive}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.reminders.active : tabIcons.reminders.inactive}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.chat.active : tabIcons.chat.inactive}
              size={size}
              color={color}
            />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="album"
        options={{
          title: 'Photo album',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.album.active : tabIcons.album.inactive}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## Child Tab Layout

**4 Tabs:** Home | Reminders | Chat | Photo album

```typescript
// app/(child)/_layout.tsx

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout } from '@/constants/theme';
import { tabIcons } from '@/constants/icons';
import { useChatStore } from '@/stores/chatStore';

export default function ChildTabLayout() {
  const { chatRoom } = useChatStore();
  const unreadCount = chatRoom?.unreadCount?.[/* userId */] || 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          height: layout.tabBarHeight,
          paddingBottom: 20,
          paddingTop: 10,
          backgroundColor: colors.neutral.white,
          borderTopWidth: 1,
          borderTopColor: colors.neutral[200],
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.home.active : tabIcons.home.inactive}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.reminders.active : tabIcons.reminders.inactive}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.chat.active : tabIcons.chat.inactive}
              size={size}
              color={color}
            />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="album"
        options={{
          title: 'Photo album',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.album.active : tabIcons.album.inactive}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## Reminder Stack (Child Only)

```typescript
// app/(child)/reminders/_layout.tsx

import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function RemindersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Reminders',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'New Reminder',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Edit Reminder',
        }}
      />
    </Stack>
  );
}
```

---

## Screen Examples

### Login Screen

```typescript
// app/(auth)/login.tsx

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, textStyles, layout } from '@/constants/theme';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple, isLoading, error } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>ElderCare</Text>
          <Text style={styles.subtitle}>
            Stay connected with your loved ones
          </Text>
        </View>

        {/* Auth buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            title="Continue with Apple"
            onPress={signInWithApple}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            icon={<Ionicons name="logo-apple" size={24} color="white" />}
          />
          
          <Button
            title="Continue with Google"
            onPress={signInWithGoogle}
            variant="secondary"
            size="lg"
            fullWidth
            loading={isLoading}
            icon={<Ionicons name="logo-google" size={24} color={colors.primary[500]} />}
          />
        </View>

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: layout.screenPadding,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing[4],
  },
  title: {
    ...textStyles.h1,
    color: colors.primary[500],
    marginBottom: spacing[2],
  },
  subtitle: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  error: {
    ...textStyles.body,
    color: colors.danger.main,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  terms: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  link: {
    color: colors.primary[500],
  },
});
```

### Parent Home Screen

Based on wireframe: Greeting + Note from child → Status (Battery + Emergency) → Recent Reminder

```typescript
// app/(parent)/index.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { useEmergencyStore } from '@/stores/emergencyStore';
import { useReminderStore } from '@/stores/reminderStore';
import { useBatteryStore } from '@/stores/batteryStore';
import { Card, Avatar } from '@/components/common';
import { PartnerNoteCard, BatteryCard, EmergencyButtonCompact } from '@/components/home';
import { ReminderCard } from '@/components/reminders';
import { colors, spacing, textStyles, layout } from '@/constants/theme';

export default function ParentHomeScreen() {
  const { profile, partner, partnerNote } = useUserStore();
  const { triggerEmergency, isTriggering } = useEmergencyStore();
  const { reminders } = useReminderStore();
  const { batteryLevel } = useBatteryStore();

  // Get recent/upcoming reminder
  const recentReminder = reminders.find((r) => r.status === 'pending');

  const handleEmergency = async () => {
    if (partner) {
      await triggerEmergency();
    }
  };

  const openSettings = () => {
    router.push('/modals/settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with Settings Icon */}
        <View style={styles.header}>
          <Avatar
            source={profile?.profileImageUrl}
            name={profile?.name}
            size="lg"
          />
          <TouchableOpacity onPress={openSettings} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Greeting Card (customizable by adult child) + Note from child */}
        <Card style={styles.greetingCard}>
          <Text style={styles.greetingTitle}>
            {partner?.customGreeting || `Hello, ${profile?.name}!`}
          </Text>
          {partnerNote && (
            <Text style={styles.noteText}>
              Note from {partner?.name}: {partnerNote}
            </Text>
          )}
        </Card>

        {/* Status of Son Section */}
        <Card style={styles.statusCard}>
          <Text style={styles.sectionLabel}>Status of {partner?.name || 'Son'}</Text>
          <View style={styles.statusRow}>
            {/* My Battery */}
            <BatteryCard 
              level={batteryLevel} 
              label="My Battery"
            />
            {/* Emergency Button */}
            <EmergencyButtonCompact
              onPress={handleEmergency}
              isLoading={isTriggering}
            />
          </View>
        </Card>

        {/* Recent Reminder Section */}
        <Card style={styles.reminderSection}>
          <Text style={styles.sectionLabel}>Recent Reminder</Text>
          {recentReminder ? (
            <ReminderCard
              reminder={recentReminder}
              isParent
              showActions
            />
          ) : (
            <Text style={styles.noReminderText}>No upcoming reminders</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: layout.screenPadding,
    gap: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsButton: {
    padding: spacing[2],
  },
  greetingCard: {
    backgroundColor: colors.primary[100],
    padding: spacing[4],
  },
  greetingTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  noteText: {
    ...textStyles.body,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  statusCard: {
    padding: spacing[4],
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  reminderSection: {
    padding: spacing[4],
    flex: 1,
  },
  noReminderText: {
    ...textStyles.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing[6],
  },
});
```

### Adult Child Home Screen

Based on wireframe: Greeting + Note from parent → Status (Mom's Battery + Status) → Location Map

```typescript
// app/(child)/index.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUserStore } from '@/stores/userStore';
import { useLocationStore } from '@/stores/locationStore';
import { Card, Avatar } from '@/components/common';
import { PartnerNoteCard, BatteryCard, ParentLocationMap } from '@/components/home';
import { colors, spacing, textStyles, layout } from '@/constants/theme';

export default function ChildHomeScreen() {
  const { profile, partner, partnerNote } = useUserStore();
  const { partnerLocation } = useLocationStore();

  const openSettings = () => {
    router.push('/modals/settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with Settings Icon */}
        <View style={styles.header}>
          <Avatar
            source={profile?.profileImageUrl}
            name={profile?.name}
            size="lg"
          />
          <TouchableOpacity onPress={openSettings} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Greeting + Note from Parent */}
        <Card style={styles.greetingCard}>
          <Text style={styles.greetingTitle}>
            Hello, {profile?.name}!
          </Text>
          {partnerNote && (
            <Text style={styles.noteText}>
              Note from {partner?.name}: {partnerNote}
            </Text>
          )}
        </Card>

        {/* Mom's Status Card */}
        <Card style={styles.statusCard}>
          <Text style={styles.statusTitle}>
            {partner?.name || 'Mom'} is doing well.
          </Text>
          <View style={styles.statusRow}>
            {/* Mama's Battery */}
            <BatteryCard 
              level={partner?.batteryPercentage || 0} 
              label={`${partner?.name}'s Battery`}
            />
            {/* Mood indicator or additional status */}
            <View style={styles.moodCard}>
              <Ionicons 
                name={getMoodIcon(partner?.mood)} 
                size={32} 
                color={getMoodColor(partner?.mood)} 
              />
              <Text style={styles.moodText}>{partner?.mood || 'Unknown'}</Text>
            </View>
          </View>
        </Card>

        {/* Location with Google Maps */}
        <Card style={styles.mapCard}>
          <ParentLocationMap
            location={partnerLocation}
            parentName={partner?.name || 'Mom'}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const getMoodIcon = (mood?: string) => {
  const icons: Record<string, string> = {
    happy: 'happy',
    neutral: 'remove-circle',
    sad: 'sad',
    tired: 'moon',
  };
  return icons[mood || ''] || 'help-circle';
};

const getMoodColor = (mood?: string) => {
  const colors: Record<string, string> = {
    happy: '#27AE60',
    neutral: '#F5A623',
    sad: '#E74C3C',
    tired: '#9B59B6',
  };
  return colors[mood || ''] || '#636E72';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: layout.screenPadding,
    gap: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsButton: {
    padding: spacing[2],
  },
  greetingCard: {
    backgroundColor: colors.primary[100],
    padding: spacing[4],
  },
  greetingTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  noteText: {
    ...textStyles.body,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  statusCard: {
    padding: spacing[4],
  },
  statusTitle: {
    ...textStyles.bodyLarge,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  moodCard: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
    textTransform: 'capitalize',
  },
  mapCard: {
    padding: 0,
    overflow: 'hidden',
    height: 250,
  },
});
```

---

## Navigation Utilities

### Navigation Hook

```typescript
// src/hooks/useNavigation.ts

import { useRouter, useSegments } from 'expo-router';
import { useCallback } from 'react';

export const useAppNavigation = () => {
  const router = useRouter();
  const segments = useSegments();

  const navigateToReminder = useCallback((id?: string) => {
    if (id) {
      router.push(`/(child)/reminders/${id}`);
    } else {
      router.push('/(child)/reminders/create');
    }
  }, [router]);

  const navigateToChat = useCallback(() => {
    const currentGroup = segments[0];
    router.push(`/${currentGroup}/chat`);
  }, [router, segments]);

  const openReminderAlarm = useCallback((reminderId: string) => {
    router.push({
      pathname: '/modals/reminder-alarm',
      params: { reminderId },
    });
  }, [router]);

  const openEmergencyAlert = useCallback((alertId: string) => {
    router.push({
      pathname: '/modals/emergency-alert',
      params: { alertId },
    });
  }, [router]);

  const openImagePreview = useCallback((imageUrl: string) => {
    router.push({
      pathname: '/modals/image-preview',
      params: { imageUrl },
    });
  }, [router]);

  return {
    navigateToReminder,
    navigateToChat,
    openReminderAlarm,
    openEmergencyAlert,
    openImagePreview,
    goBack: router.back,
  };
};
```

### Deep Linking Configuration

```typescript
// app.json (partial)

{
  "expo": {
    "scheme": "eldercare",
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://eldercare.app"
        }
      ]
    ]
  }
}
```

### Notification Navigation Handler

```typescript
// src/services/notificationNavigation.ts

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

export const setupNotificationNavigation = () => {
  // Handle notification when app is foregrounded
  Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data;
    
    // Handle in-app if needed
    console.log('Notification received:', data);
  });

  // Handle notification tap
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    
    switch (data.type) {
      case 'reminder':
        router.push({
          pathname: '/modals/reminder-alarm',
          params: { reminderId: data.reminderId },
        });
        break;
        
      case 'emergency':
        router.push({
          pathname: '/modals/emergency-alert',
          params: { alertId: data.alertId },
        });
        break;
        
      case 'chat_message':
        router.push('/(child)/chat'); // or (parent)/chat
        break;
        
      default:
        break;
    }
  });
};
```

