// app/(auth)/role-selection.tsx
// Role selection screen (Parent or Child)

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  title,
  description,
  icon,
  onSelect,
}) => (
  <TouchableOpacity style={styles.roleCard} onPress={onSelect} activeOpacity={0.8}>
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
  const { setRole, isLoading } = useAuthStore();

  const handleSelectRole = async (role: UserRole) => {
    try {
      // For demo, just navigate - in production use setRole
      router.push({
        pathname: '/(auth)/partner-connection',
        params: { role },
      });
    } catch (error) {
      console.error('Failed to set role:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Who are you?</Text>
        <Text style={styles.subtitle}>
          Select your role to personalize your experience
        </Text>

        <View style={styles.cardsContainer}>
          <RoleCard
            role="parent"
            title="I'm a Parent"
            description="I want to receive reminders and stay connected with my family"
            icon="person"
            onSelect={() => handleSelectRole('parent')}
          />

          <RoleCard
            role="child"
            title="I'm a Caregiver"
            description="I want to care for my parent and help them with daily activities"
            icon="people"
            onSelect={() => handleSelectRole('child')}
          />
        </View>
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
    padding: spacing[6],
    justifyContent: 'center',
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

