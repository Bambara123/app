// app/(auth)/profile-setup.tsx
// Profile setup screen - phone number and nickname

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Input } from '../../src/components/common';
import { useAuthStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';

// Nickname suggestions based on role
const PARENT_NICKNAMES = ['Mom', 'Dad', 'Grandma', 'Grandpa', 'Nana', 'Papa'];
const CHILD_NICKNAMES = ['Son', 'Daughter', 'Grandson', 'Granddaughter'];

export default function ProfileSetupScreen() {
  const { role: paramRole } = useLocalSearchParams<{ role: string }>();
  const { user } = useAuthStore();
  
  // Use role from user state if available, otherwise from params
  const role = user?.role || paramRole;

  const [phone, setPhone] = useState(user?.phone || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user already completed profile setup - skip this screen
  useEffect(() => {
    if (user?.profileSetupComplete) {
      // Profile already complete, navigate to next screen
      if (user.connectedTo && user.role) {
        const destination = user.role === 'parent' ? '/(parent)' : '/(child)';
        router.replace(destination as any);
      } else {
        router.replace('/(auth)/partner-connection');
      }
    }
  }, [user?.profileSetupComplete, user?.connectedTo, user?.role]);

  const suggestions = role === 'parent' ? PARENT_NICKNAMES : CHILD_NICKNAMES;

  const handleBack = () => {
    router.back();
  };

  const handleSelectNickname = (name: string) => {
    setNickname(name);
  };

  const handleContinue = async () => {
    // Validate phone number (basic validation)
    if (phone.trim() && phone.trim().length < 7) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    // Nickname is optional but recommended
    if (!nickname.trim()) {
      Alert.alert(
        'No Nickname',
        'Would you like to continue without setting a nickname? Your partner will see your name instead.',
        [
          { text: 'Go Back', style: 'cancel' },
          { text: 'Continue', onPress: () => saveAndNavigate() },
        ]
      );
      return;
    }

    await saveAndNavigate();
  };

  const saveAndNavigate = async () => {
    setIsLoading(true);
    try {
      const updateData: any = {
        phone: phone.trim() || null,
        nickname: nickname.trim() || null,
        profileSetupComplete: true,
      };

      // Save to Firebase
      if (user?.id) {
        try {
          const { userService } = await import('../../src/services/firebase/firestore');
          await userService.updateUser(user.id, updateData);
        } catch (error) {
          console.log('Could not save to Firebase, continuing with local state');
        }
      }

      // Update local state
      useAuthStore.setState({
        user: user ? { ...user, ...updateData } : null,
      });

      // Navigate to partner connection
      router.push('/(auth)/partner-connection');
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={role === 'parent' ? 'person' : 'people'}
              size={48}
              color={colors.primary[500]}
            />
          </View>

          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Help your {role === 'parent' ? 'caregiver' : 'parent'} connect with you
          </Text>

          {/* Phone Number Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
            <Input
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon="call-outline"
            />
            <Text style={styles.inputHint}>
              This helps your family reach you in emergencies
            </Text>
          </View>

          {/* Nickname Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              What should your {role === 'parent' ? 'caregiver' : 'parent'} call you?
            </Text>
            <Input
              placeholder={role === 'parent' ? 'e.g., Mom, Dad, Grandma' : 'e.g., Son, Daughter'}
              value={nickname}
              onChangeText={setNickname}
              icon="heart-outline"
            />

            {/* Nickname Suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>Quick picks:</Text>
              <View style={styles.suggestions}>
                {suggestions.map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.suggestionChip,
                      nickname === name && styles.suggestionChipActive,
                    ]}
                    onPress={() => handleSelectNickname(name)}
                  >
                    <Text
                      style={[
                        styles.suggestionText,
                        nickname === name && styles.suggestionTextActive,
                      ]}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Continue Button */}
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
            style={styles.continueButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    alignSelf: 'flex-start',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing[6],
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 28,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  inputSection: {
    marginBottom: spacing[6],
  },
  inputLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  inputHint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
  suggestionsContainer: {
    marginTop: spacing[3],
  },
  suggestionsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  suggestionChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  suggestionChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  suggestionTextActive: {
    color: colors.neutral.white,
  },
  continueButton: {
    marginTop: spacing[4],
  },
});

