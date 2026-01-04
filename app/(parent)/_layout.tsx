// app/(parent)/_layout.tsx
// Parent tab navigator (4 tabs)

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, tabIcons } from '../../src/constants';

export default function ParentTabLayout() {
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
        }}
      />
      <Tabs.Screen
        name="album"
        options={{
          title: 'The Vault',
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

