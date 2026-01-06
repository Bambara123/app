// app/index.tsx
// Entry point - redirects based on auth state

import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores';

export default function Index() {
  const { user } = useAuthStore();

  // If not authenticated, go to login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // If user is already connected AND has a role, skip all onboarding
  // This handles the case where another user connected to this user
  if (user.connectedTo && user.role) {
    if (user.role === 'parent') {
      return <Redirect href="/(parent)" />;
    }
    return <Redirect href="/(child)" />;
  }

  // If no role selected, go to role selection
  if (!user.role) {
    return <Redirect href="/(auth)/role-selection" />;
  }

  // If profile setup not complete, go to profile setup
  if (!user.profileSetupComplete) {
    return <Redirect href="/(auth)/profile-setup" />;
  }

  // Redirect based on role (user may or may not be connected)
  if (user.role === 'parent') {
    return <Redirect href="/(parent)" />;
  }

  return <Redirect href="/(child)" />;
}

