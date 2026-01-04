// src/components/chat/ChatBubble.tsx
// Chat message bubble

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors, spacing, radius, typography } from '../../constants';
import { Message, MessageType } from '../../types';

interface ChatBubbleProps {
  message: Message;
  isSent: boolean;
  onImagePress?: (url: string) => void;
  onVoicePress?: (url: string, duration: number) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isSent,
  onImagePress,
  onVoicePress,
}) => {
  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <Text style={[styles.text, isSent ? styles.textSent : styles.textReceived]}>
            {message.content}
          </Text>
        );

      case 'image':
        return (
          <TouchableOpacity
            onPress={() => message.mediaUrl && onImagePress?.(message.mediaUrl)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: message.mediaUrl || message.content }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );

      case 'voice':
        return (
          <TouchableOpacity
            onPress={() =>
              message.mediaUrl &&
              onVoicePress?.(message.mediaUrl, message.duration || 0)
            }
            style={styles.voiceContainer}
          >
            <Ionicons
              name="play-circle"
              size={36}
              color={isSent ? colors.neutral.white : colors.primary[500]}
            />
            <View style={styles.voiceWave}>
              {[...Array(8)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.voiceBar,
                    {
                      height: Math.random() * 16 + 8,
                      backgroundColor: isSent
                        ? 'rgba(255,255,255,0.6)'
                        : colors.primary[300],
                    },
                  ]}
                />
              ))}
            </View>
            <Text
              style={[
                styles.voiceDuration,
                { color: isSent ? colors.neutral.white : colors.text.secondary },
              ]}
            >
              {message.duration ? `${Math.floor(message.duration / 60)}:${String(message.duration % 60).padStart(2, '0')}` : '0:00'}
            </Text>
          </TouchableOpacity>
        );

      case 'sticker':
        return (
          <Image
            source={{ uri: message.content }}
            style={styles.sticker}
            resizeMode="contain"
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, isSent ? styles.containerSent : styles.containerReceived]}>
      <View
        style={[
          styles.bubble,
          isSent ? styles.bubbleSent : styles.bubbleReceived,
          message.type === 'image' && styles.bubbleImage,
          message.type === 'sticker' && styles.bubbleSticker,
        ]}
      >
        {renderContent()}
      </View>
      <Text style={[styles.time, isSent ? styles.timeSent : styles.timeReceived]}>
        {format(message.createdAt, 'h:mm a')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[1],
    paddingHorizontal: spacing[4],
  },
  containerSent: {
    alignItems: 'flex-end',
  },
  containerReceived: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: spacing[3],
  },
  bubbleSent: {
    backgroundColor: colors.chat.sent,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: colors.chat.received,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  bubbleImage: {
    padding: 0,
    overflow: 'hidden',
  },
  bubbleSticker: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  text: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  textSent: {
    color: colors.chat.sentText,
  },
  textReceived: {
    color: colors.chat.receivedText,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  sticker: {
    width: 120,
    height: 120,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
  },
  voiceWave: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[2],
    gap: 2,
  },
  voiceBar: {
    width: 3,
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: typography.fontSize.xs,
    marginLeft: spacing[2],
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  timeSent: {
    marginRight: spacing[1],
  },
  timeReceived: {
    marginLeft: spacing[1],
  },
});

