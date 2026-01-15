// src/components/chat/ChatBubble.tsx
// Chat message bubble with audio playback

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Audio } from 'expo-av';
import { colors, spacing, radius, typography } from '../../constants';
import { Message, MessageType } from '../../types';

interface ChatBubbleProps {
  message: Message;
  isSent: boolean;
  onImagePress?: (url: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isSent,
  onImagePress,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Preload audio for voice messages
  useEffect(() => {
    if (message.type === 'voice' && message.mediaUrl && !isPreloaded) {
      preloadAudio();
    }
    
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [message.mediaUrl, message.type]);

  const preloadAudio = async () => {
    if (!message.mediaUrl) return;
    
    try {
      // Set audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Preload the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: message.mediaUrl },
        { shouldPlay: false, progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
      setIsPreloaded(true);
    } catch (error) {
      console.log('Error preloading voice message:', error);
    }
  };

  const handleVoicePlay = async () => {
    if (!message.mediaUrl) return;

    try {
      // If already playing, pause
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      // If preloaded, just play
      if (isPreloaded && soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      // Not preloaded, load and play
      setIsLoading(true);
      
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: message.mediaUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
      setIsPreloaded(true);
      setIsLoading(false);
      setIsPlaying(true);
    } catch (error) {
      console.log('Error playing voice message:', error);
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackProgress(0);
        progressAnim.setValue(0);
        // Reset to beginning instead of unloading (for quick replay)
        if (soundRef.current) {
          soundRef.current.setPositionAsync(0);
        }
      } else if (status.isPlaying && status.durationMillis) {
        const progress = status.positionMillis / status.durationMillis;
        setPlaybackProgress(progress);
        progressAnim.setValue(progress);
      }
    }
  };
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
            onPress={handleVoicePlay}
            style={styles.voiceContainer}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingIcon}>
                <Ionicons
                  name="hourglass-outline"
                  size={28}
                  color={isSent ? colors.neutral.white : colors.primary[500]}
                />
              </View>
            ) : (
              <Ionicons
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                size={36}
                color={isSent ? colors.neutral.white : colors.primary[500]}
              />
            )}
            <View style={styles.voiceWaveContainer}>
              <View style={styles.voiceWave}>
                {[...Array(12)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.voiceBar,
                      {
                        height: Math.random() * 16 + 8,
                        backgroundColor: isSent
                          ? 'rgba(255,255,255,0.6)'
                          : colors.primary[300],
                        opacity: isPlaying && i / 12 <= playbackProgress ? 1 : 0.4,
                      },
                    ]}
                  />
                ))}
              </View>
              {/* Progress bar */}
              <View style={[styles.progressBar, { backgroundColor: isSent ? 'rgba(255,255,255,0.3)' : colors.primary[100] }]}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: isSent ? colors.neutral.white : colors.primary[500],
                      width: `${playbackProgress * 100}%`,
                    }
                  ]} 
                />
              </View>
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
    width: 240,
    height: 240,
    borderRadius: 16,
  },
  sticker: {
    width: 120,
    height: 120,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  loadingIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceWaveContainer: {
    flex: 1,
    marginHorizontal: spacing[2],
  },
  voiceWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: spacing[1],
  },
  voiceBar: {
    width: 3,
    borderRadius: 2,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: typography.fontSize.xs,
    marginLeft: spacing[2],
    minWidth: 35,
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

