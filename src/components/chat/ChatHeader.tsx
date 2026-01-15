// src/components/chat/ChatHeader.tsx
// Chat header with call buttons

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../common';
import { colors, spacing, typography, radius } from '../../constants';

const WHATSAPP_PROMPT_KEY = '@whatsapp_prompt_shown';

interface ChatHeaderProps {
  partnerName: string;
  partnerAvatar?: string | null;
  partnerPhone?: string | null;
  isOnline?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  partnerName,
  partnerAvatar,
  partnerPhone,
  isOnline,
}) => {
  const [hasSeenPrompt, setHasSeenPrompt] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    checkPromptStatus();
  }, []);

  const checkPromptStatus = async () => {
    try {
      const shown = await AsyncStorage.getItem(WHATSAPP_PROMPT_KEY);
      setHasSeenPrompt(shown === 'true');
    } catch (error) {
      console.log('Error checking prompt status:', error);
    }
  };

  const markPromptAsShown = async () => {
    try {
      await AsyncStorage.setItem(WHATSAPP_PROMPT_KEY, 'true');
      setHasSeenPrompt(true);
    } catch (error) {
      console.log('Error saving prompt status:', error);
    }
  };

  const showNoPhoneAlert = () => {
    Alert.alert(
      'Phone Number Not Set',
      `${partnerName} has not set up their mobile number yet. Ask them to add it in their profile settings.`,
      [{ text: 'OK' }]
    );
  };

  const openWhatsApp = async () => {
    if (!partnerPhone) {
      showNoPhoneAlert();
      return;
    }

    // Clean the phone number - keep the + for country code
    const cleanPhone = partnerPhone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
    
    // WhatsApp URL to open chat (video call can be initiated from there)
    const url = `https://wa.me/${cleanPhone}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fall back to whatsapp:// scheme
        await Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
      }
    } catch (error) {
      console.log('WhatsApp not available');
      Alert.alert('WhatsApp Not Available', 'WhatsApp is not installed on this device.');
    }
  };

  const handleWhatsAppVideoCall = async () => {
    if (!partnerPhone) {
      showNoPhoneAlert();
      return;
    }

    // Show one-time prompt
    if (!hasSeenPrompt) {
      Alert.alert(
        'Video Call',
        'You will be navigated to WhatsApp. Make a video call on WhatsApp.',
        [
          { 
            text: 'OK', 
            onPress: async () => {
              await markPromptAsShown();
              await openWhatsApp();
            }
          }
        ]
      );
    } else {
      await openWhatsApp();
    }
  };

  const handleNormalCall = () => {
    if (!partnerPhone) {
      showNoPhoneAlert();
      return;
    }
    Linking.openURL(`tel:${partnerPhone}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Avatar
          source={partnerAvatar}
          name={partnerName}
          size="md"
          isOnline={isOnline}
        />
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{partnerName}</Text>
          <Text style={styles.status}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      {/* Call Buttons */}
      <View style={styles.callButtons}>
        <TouchableOpacity
          onPress={handleWhatsAppVideoCall}
          style={[styles.callButton, styles.whatsappButton, !partnerPhone && styles.buttonDisabled]}
        >
          <Ionicons name="videocam" size={18} color={colors.neutral.white} />
          <Text style={styles.callButtonText}>Video Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNormalCall}
          style={[styles.callButton, styles.normalCallButton, !partnerPhone && styles.buttonDisabled]}
        >
          <Ionicons name="call" size={18} color={colors.neutral.white} />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  nameContainer: {
    marginLeft: spacing[3],
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  status: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  callButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    gap: spacing[2],
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  normalCallButton: {
    backgroundColor: colors.primary[500],
  },
  callButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

