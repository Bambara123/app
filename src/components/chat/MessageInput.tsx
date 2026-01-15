// src/components/chat/MessageInput.tsx
// Chat message input with attachments and voice recording

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { colors, spacing, radius, typography } from '../../constants';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendImage: (uri: string) => void;
  onSendVoice?: (uri: string, duration: number) => void;
  isSending?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendText,
  onSendImage,
  onSendVoice,
  isSending = false,
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handleSend = () => {
    if (message.trim()) {
      onSendText(message.trim());
      setMessage('');
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onSendImage(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onSendImage(result.assets[0].uri);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      // Request permission
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Please allow microphone access to record voice messages.');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording with compression settings
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 64000, // Lower bitrate for compression
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 64000, // Lower bitrate for compression
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 64000,
        },
      });

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Stop animation
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      setIsRecording(false);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const duration = recordingDuration;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      recordingRef.current = null;
      setRecordingDuration(0);

      if (uri && onSendVoice && duration > 0) {
        onSendVoice(uri, duration);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
  };

  const cancelRecording = async () => {
    if (!recordingRef.current) return;

    try {
      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Stop animation
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      setIsRecording(false);

      await recordingRef.current.stopAndUnloadAsync();
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      recordingRef.current = null;
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Recording UI
  if (isRecording) {
    return (
      <View style={styles.recordingContainer}>
        <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color={colors.danger.main} />
        </TouchableOpacity>

        <View style={styles.recordingInfo}>
          <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.recordingText}>Recording {formatDuration(recordingDuration)}</Text>
        </View>

        <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
          <Ionicons name="send" size={20} color={colors.neutral.white} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        {/* Attachment buttons */}
        <TouchableOpacity
          onPress={handlePickImage}
          style={styles.iconButton}
          disabled={isSending}
        >
          <Ionicons name="image-outline" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCamera}
          style={styles.iconButton}
          disabled={isSending}
        >
          <Ionicons name="camera-outline" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        {/* Text input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.tertiary}
            multiline
            maxLength={1000}
            editable={!isSending}
          />
        </View>

        {/* Send or Voice button */}
        {message.trim() ? (
          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendButton}
            disabled={isSending}
          >
            <Ionicons name="send" size={20} color={colors.neutral.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={startRecording}
            onLongPress={startRecording}
            style={styles.sendButton}
            disabled={isSending}
          >
            <Ionicons name="mic" size={20} color={colors.neutral.white} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

// Need to import Text for suggestButton
import { Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  iconButton: {
    padding: spacing[2],
    marginRight: spacing[1],
  },
  inputContainer: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    marginRight: spacing[2],
    maxHeight: 100,
  },
  input: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 36,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Recording styles
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.danger.light,
    borderTopWidth: 1,
    borderTopColor: colors.danger.main,
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.danger.main,
  },
  recordingText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.danger.dark,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

