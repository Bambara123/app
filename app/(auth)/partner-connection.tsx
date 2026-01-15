// app/(auth)/partner-connection.tsx
// Connect with partner screen using connection codes

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Share, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Button, Input, Card } from '../../src/components/common';
import { useAuthStore, useUserStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';

// Generate a unique 6-character connection code
const generateConnectionCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars: 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function PartnerConnectionScreen() {
  const { user } = useAuthStore();
  const { connectByCode, isLoading } = useUserStore();
  
  // Get role from user state (saved in role-selection)
  const role = user?.role;
  
  const [partnerCode, setPartnerCode] = useState('');
  const [myCode, setMyCode] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState(true);
  const [copied, setCopied] = useState(false);

  // Check if user is already connected (another user connected to them)
  useEffect(() => {
    if (user?.connectedTo && user?.role) {
      // User is already connected, navigate to home
      Alert.alert(
        'Connected! 🎉',
        `Someone connected with you! Redirecting to home...`,
        [
          {
            text: 'OK',
            onPress: () => {
              const destination = user.role === 'parent' ? '/(parent)' : '/(child)';
              router.replace(destination as any);
            },
          },
        ]
      );
    }
  }, [user?.connectedTo, user?.role]);

  // Listen for real-time updates to detect when another user connects
  useEffect(() => {
    if (!user?.id) return;

    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const { userService } = await import('../../src/services/firebase/firestore');
        unsubscribe = userService.subscribeToUser(user.id, (updatedUser) => {
          if (updatedUser && updatedUser.connectedTo && !user.connectedTo) {
            // User was just connected by someone else
            useAuthStore.setState({ user: updatedUser });
          }
        });
      } catch (error) {
        console.log('Could not set up real-time listener');
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, user?.connectedTo]);

  // Load or generate the user's connection code
  useEffect(() => {
    const loadOrGenerateCode = async () => {
      setIsLoadingCode(true);
      try {
        if (user?.connectionCode) {
          // User already has a code
          setMyCode(user.connectionCode);
        } else if (user) {
          // User doesn't have a code - generate one
          const newCode = generateConnectionCode();
          setMyCode(newCode);
          
          // Update local state with new code
          useAuthStore.setState({
            user: { ...user, connectionCode: newCode }
          });
          
          // Try to save to Firebase
          try {
            if (user.id) {
              const { userService } = await import('../../src/services/firebase/firestore');
              await userService.updateUser(user.id, { connectionCode: newCode });
            }
          } catch (error) {
            console.log('Failed to save code to Firebase');
          }
        } else {
          // No user - just generate a temporary code for display
          setMyCode(generateConnectionCode());
        }
      } catch (error) {
        console.error('Error with connection code:', error);
        // Fallback: generate a code anyway
        setMyCode(generateConnectionCode());
      } finally {
        setIsLoadingCode(false);
      }
    };

    loadOrGenerateCode();
  }, [user?.id]);

  const handleBack = () => {
    router.back();
  };

  const handleConnect = async () => {
    const cleanCode = partnerCode.trim().toUpperCase();
    
    if (!cleanCode) {
      Alert.alert('Error', 'Please enter your partner\'s code');
      return;
    }

    if (cleanCode.length !== 6) {
      Alert.alert('Error', 'Connection code must be 6 characters');
      return;
    }

    if (cleanCode === myCode) {
      Alert.alert('Error', 'You cannot connect to yourself. Enter your partner\'s code.');
      return;
    }

    if (!user?.id || !role) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    try {
      await connectByCode(user.id, role as 'parent' | 'child', cleanCode);
      
      Alert.alert(
        'Connected! 🎉',
        `You are now connected with your ${role === 'parent' ? 'caregiver' : 'parent'}.`,
        [
          {
            text: 'Continue',
            onPress: () => {
      const destination = role === 'parent' ? '/(parent)' : '/(child)';
      router.replace(destination as any);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message || 'Failed to connect. Please try again.');
    }
  };

  const handleCopyCode = async () => {
    if (myCode && myCode !== '------') {
      await Clipboard.setStringAsync(myCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareCode = async () => {
    try {
      const roleText = role === 'parent' ? 'parent' : 'adult child';
      await Share.share({
        message: `Join me on ElderCare! I'm signing up as a ${roleText}.\n\nUse my connection code: ${myCode}\n\nDownload the app and enter this code to connect with me.`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSkipForNow = () => {
    // Allow user to continue without connecting to a partner
    // They can connect later from the settings page
    if (!role) {
      Alert.alert('Error', 'Please select your role first');
      router.replace('/(auth)/role-selection');
      return;
    }
    
    const destination = role === 'parent' ? '/(parent)' : '/(child)';
    router.replace(destination as any);
  };

  const isParent = role === 'parent';

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
        <Text style={styles.title}>
            {isParent ? 'Connect with your Caregiver' : 'Connect with your Parent'}
        </Text>
        <Text style={styles.subtitle}>
            Share your unique code or enter theirs to connect
        </Text>
        </View>

        {/* My Code Card */}
        <Card variant="spark" style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR UNIQUE CODE</Text>
          
          {isLoadingCode ? (
            <ActivityIndicator size="large" color={colors.primary[500]} style={styles.codeLoader} />
          ) : (
            <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.7}>
              <View style={styles.codeContainer}>
          <Text style={styles.codeText}>{myCode}</Text>
                <View style={styles.copyBadge}>
                  <Ionicons 
                    name={copied ? "checkmark" : "copy-outline"} 
                    size={16} 
                    color={colors.primary[500]} 
                  />
                  <Text style={styles.copyText}>{copied ? 'Copied!' : 'Tap to copy'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          
          <Text style={styles.codeHint}>
            Share this code with your {isParent ? 'child' : 'parent'} so they can connect with you
          </Text>
          
          <Button
            title="Share Code"
            onPress={handleShareCode}
            variant="outline"
            size="md"
            icon={<Ionicons name="share-outline" size={18} color={colors.primary[500]} />}
            disabled={isLoadingCode}
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
            value={partnerCode}
            onChangeText={(text) => setPartnerCode(text.toUpperCase())}
            placeholder="e.g., ABC123"
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
            disabled={partnerCode.length !== 6}
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.infoText}>
            Both users need to have the app installed. One person shares their code, the other enters it to connect.
          </Text>
      </View>

        {/* Skip for now */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipForNow}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
        <Text style={styles.skipHint}>
          You can connect with your {isParent ? 'caregiver' : 'parent'} later from Settings
        </Text>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    padding: spacing[5],
    paddingTop: 0,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing[6],
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
  },
  codeCard: {
    alignItems: 'center',
    padding: spacing[5],
    marginBottom: spacing[4],
  },
  codeLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 1.5,
    marginBottom: spacing[3],
  },
  codeLoader: {
    marginVertical: spacing[4],
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  codeText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 42,
    color: colors.primary[500],
    letterSpacing: 8,
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    marginTop: spacing[2],
    gap: spacing[1],
  },
  copyText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    fontWeight: '500',
  },
  codeHint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing[4],
    paddingHorizontal: spacing[2],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[4],
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
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing[2],
    fontWeight: '500',
  },
  input: {
    marginBottom: spacing[4],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.secondary[100],
    padding: spacing[4],
    borderRadius: radius.lg,
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
  },
  skipText: {
    fontSize: typography.fontSize.base,
    color: colors.primary[500],
    fontWeight: '600',
  },
  skipHint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
});
