// app/(auth)/_layout.tsx
// Auth stack layout

import { Stack } from 'expo-router';
import { colors } from '../../src/constants';

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
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="partner-connection" />
    </Stack>
  );
}

