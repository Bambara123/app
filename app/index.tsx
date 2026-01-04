// app/index.tsx
// Entry point - redirects based on auth state

import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores';

export default function Index() {
  const { user, isLoading } = useAuthStore();

  // If not authenticated, go to auth
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // If no role selected, go to role selection
  if (!user.role) {
    return <Redirect href="/(auth)/role-selection" />;
  }

  // If not connected to partner, go to partner connection
  if (!user.connectedTo) {
    return <Redirect href="/(auth)/partner-connection" />;
  }

  // Redirect based on role
  if (user.role === 'parent') {
    return <Redirect href="/(parent)" />;
  }

  return <Redirect href="/(child)" />;
}

