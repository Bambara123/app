// app/(auth)/role-selection.tsx
// Role selection screen (Parent or Child)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';
import { UserRole } from '../../src/types';

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  icon: string;
  onSelect: () => void;
  disabled?: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  title,
  description,
  icon,
  onSelect,
  disabled,
}) => (
  <TouchableOpacity 
    style={[styles.roleCard, disabled && styles.roleCardDisabled]} 
    onPress={onSelect} 
    activeOpacity={0.8}
    disabled={disabled}
  >
    <View style={[styles.iconContainer, role === 'parent' ? styles.parentIcon : styles.childIcon]}>
      <Ionicons
        name={icon as any}
        size={48}
        color={role === 'parent' ? colors.primary[500] : colors.accent.main}
      />
    </View>
    <Text style={styles.roleTitle}>{title}</Text>
    <Text style={styles.roleDescription}>{description}</Text>
  </TouchableOpacity>
);

export default function RoleSelectionScreen() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user already has a role - skip this screen
  useEffect(() => {
    if (user?.role) {
      // User already has a role, navigate to next screen
      if (user.profileSetupComplete) {
        // Profile complete, go to partner connection or home
        if (user.connectedTo) {
          const destination = user.role === 'parent' ? '/(parent)' : '/(child)';
          router.replace(destination as any);
        } else {
          router.replace('/(auth)/partner-connection');
        }
      } else {
        // Need to complete profile setup
        router.replace({
          pathname: '/(auth)/profile-setup',
          params: { role: user.role },
        });
      }
    }
  }, [user?.role, user?.profileSetupComplete, user?.connectedTo]);

  const handleSelectRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      // Save role to database
      if (user?.id) {
        try {
          const { userService } = await import('../../src/services/firebase/firestore');
          await userService.updateUser(user.id, { role });
        } catch (error) {
          console.log('Could not save to Firebase, continuing with local state');
        }
      }
      
      // Update local state
      useAuthStore.setState({
        user: user ? { ...user, role } : null,
      });
      
      // Navigate to profile setup
      router.push({
        pathname: '/(auth)/profile-setup',
        params: { role },
      });
    } catch (error) {
      console.error('Failed to set role:', error);
      Alert.alert('Error', 'Failed to set role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out and use a different account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Sign out from Firebase
              try {
                const { auth } = await import('../../src/services/firebase/config');
                const { signOut } = await import('firebase/auth');
                await signOut(auth);
              } catch (error) {
                console.log('Firebase sign out failed, clearing local state');
              }
              
              // Clear local state
              useAuthStore.setState({
                user: null,
                firebaseUser: null,
                isLoading: false,
                isInitialized: true,
              });
              
              // Navigate back to login
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sign Out Link */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="arrow-back" size={20} color={colors.text.secondary} />
        <Text style={styles.signOutText}>
          {user?.email ? `Not ${user.email}? Sign out` : 'Sign out'}
        </Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Who are you?</Text>
        <Text style={styles.subtitle}>
          Select your role to personalize your experience
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Setting up your profile...</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            <RoleCard
              role="parent"
              title="I'm a Parent"
              description="I want to receive reminders and stay connected with my family"
              icon="person"
              onSelect={() => handleSelectRole('parent')}
              disabled={isLoading}
            />

            <RoleCard
              role="child"
              title="I'm a Caregiver"
              description="I want to care for my parent and help them with daily activities"
              icon="people"
              onSelect={() => handleSelectRole('child')}
              disabled={isLoading}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    gap: spacing[2],
  },
  signOutText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
    padding: spacing[6],
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  roleCardDisabled: {
    opacity: 0.5,
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 32,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[10],
  },
  cardsContainer: {
    gap: spacing[4],
  },
  roleCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  parentIcon: {
    backgroundColor: colors.primary[50],
  },
  childIcon: {
    backgroundColor: colors.accent.light,
  },
  roleTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  roleDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

