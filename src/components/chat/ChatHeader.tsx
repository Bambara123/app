// src/components/chat/ChatHeader.tsx
// Chat header with call buttons

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../common';
import { colors, spacing, typography, radius } from '../../constants';

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
  const handleWhatsAppCall = async () => {
    if (partnerPhone) {
      const cleanPhone = partnerPhone.replace(/[^0-9]/g, '');
      const url = `whatsapp://call?number=${cleanPhone}`;
      
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          // Fall back to chat
          await Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
        }
      } catch (error) {
        console.log('WhatsApp not available');
      }
    }
  };

  const handleNormalCall = () => {
    if (partnerPhone) {
      Linking.openURL(`tel:${partnerPhone}`);
    }
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
          onPress={handleWhatsAppCall}
          style={[styles.callButton, styles.whatsappButton]}
          disabled={!partnerPhone}
        >
          <Ionicons name="logo-whatsapp" size={18} color={colors.neutral.white} />
          <Text style={styles.callButtonText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNormalCall}
          style={[styles.callButton, styles.normalCallButton]}
          disabled={!partnerPhone}
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
});

