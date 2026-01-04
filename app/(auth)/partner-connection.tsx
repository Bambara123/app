// app/(auth)/partner-connection.tsx
// Connect with partner screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Input, Card } from '../../src/components/common';
import { useAuthStore, useUserStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';

export default function PartnerConnectionScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const { connectToPartner, isLoading } = useUserStore();
  const [partnerId, setPartnerId] = useState('');
  const [myCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());

  const handleConnect = async () => {
    if (!partnerId.trim()) {
      Alert.alert('Error', 'Please enter your partner\'s code');
      return;
    }

    try {
      // For demo, just navigate
      const destination = role === 'parent' ? '/(parent)' : '/(child)';
      router.replace(destination as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to connect');
    }
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join me on ElderCare! Use my code: ${myCode}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSkip = () => {
    // For demo purposes - set up demo data
    const { user, updateUser } = useAuthStore.getState();
    if (user) {
      // Update user with role and mock partner connection
      useAuthStore.setState({
        user: {
          ...user,
          role: role as 'parent' | 'child',
          connectedTo: 'demo-partner-456',
        },
      });
    }
    
    const destination = role === 'parent' ? '/(parent)' : '/(child)';
    router.replace(destination as any);
  };

  const isParent = role === 'parent';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isParent ? 'Connect with your Child' : 'Connect with your Parent'}
        </Text>
        <Text style={styles.subtitle}>
          Share your code or enter theirs to connect
        </Text>

        {/* My Code */}
        <Card variant="spark" style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR CODE</Text>
          <Text style={styles.codeText}>{myCode}</Text>
          <Button
            title="Share Code"
            onPress={handleShareCode}
            variant="outline"
            size="sm"
            icon={<Ionicons name="share-outline" size={18} color={colors.primary[500]} />}
          />
        </Card>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Enter Partner Code */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            Enter {isParent ? "your child's" : "your parent's"} code
          </Text>
          <Input
            value={partnerId}
            onChangeText={setPartnerId}
            placeholder="Enter code"
            autoCapitalize="characters"
            maxLength={6}
            containerStyle={styles.input}
          />
          <Button
            title="Connect"
            onPress={handleConnect}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
          />
        </View>

        {/* Skip for demo */}
        <Button
          title="Skip for Demo"
          onPress={handleSkip}
          variant="tertiary"
          size="md"
        />
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
  codeCard: {
    alignItems: 'center',
    padding: spacing[6],
    marginBottom: spacing[6],
  },
  codeLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  codeText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 40,
    color: colors.primary[500],
    letterSpacing: 8,
    marginBottom: spacing[4],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[300],
  },
  dividerText: {
    paddingHorizontal: spacing[4],
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: spacing[6],
  },
  inputLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  input: {
    marginBottom: spacing[4],
  },
});

