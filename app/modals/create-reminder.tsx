// app/modals/create-reminder.tsx
// Create/Edit Reminder Modal for Child

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { Input, Button } from '../../src/components/common';
import { useReminderStore, useUserStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';
import { ReminderLabel, ReminderRepeat, Reminder } from '../../src/types';

const LABELS: { value: ReminderLabel; label: string; icon: string; color: string }[] = [
  { value: 'medicine', label: 'Medicine', icon: 'medical', color: '#E85A6B' },
  { value: 'meal', label: 'Meal', icon: 'restaurant', color: '#FFA726' },
  { value: 'doctor', label: 'Doctor', icon: 'medkit', color: '#42A5F5' },
  { value: 'exercise', label: 'Exercise', icon: 'fitness', color: '#66BB6A' },
  { value: 'other', label: 'Other', icon: 'notifications', color: '#AB47BC' },
];

const REPEAT_OPTIONS: { value: ReminderRepeat; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

export default function CreateReminderModal() {
  const params = useLocalSearchParams<{ reminderId?: string }>();
  const { profile, partner } = useUserStore();
  const { createReminder, updateReminder, selectedReminder, setSelectedReminder, isLoading } = useReminderStore();

  const isEditing = !!params.reminderId || !!selectedReminder;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour from now
  const [selectedLabel, setSelectedLabel] = useState<ReminderLabel>('medicine');
  const [selectedRepeat, setSelectedRepeat] = useState<ReminderRepeat>('none');
  const [followUpMinutes, setFollowUpMinutes] = useState('10');

  // Custom audio state
  const [customAudioUri, setCustomAudioUri] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [previewSound, setPreviewSound] = useState<Audio.Sound | null>(null);

  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  // Load existing reminder data if editing
  useEffect(() => {
    if (selectedReminder) {
      setTitle(selectedReminder.title);
      setDescription(selectedReminder.description || '');
      setDateTime(new Date(selectedReminder.dateTime));
      setSelectedLabel(selectedReminder.label);
      setSelectedRepeat(selectedReminder.repeat);
      setFollowUpMinutes(String(selectedReminder.followUpMinutes));
      if (selectedReminder.customAlarmAudioUrl) {
        setCustomAudioUri(selectedReminder.customAlarmAudioUrl);
        setCustomAudioName('Custom ringtone');
      }
    }
  }, [selectedReminder]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (previewSound) {
        previewSound.unloadAsync();
      }
    };
  }, [previewSound]);

  // Pick audio file
  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCustomAudioUri(asset.uri);
        setCustomAudioName(asset.name);
      }
    } catch (error) {
      console.log('Error picking audio:', error);
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  // Preview audio
  const handlePreviewAudio = async () => {
    if (!customAudioUri) return;

    try {
      if (isPlayingPreview && previewSound) {
        await previewSound.stopAsync();
        await previewSound.unloadAsync();
        setPreviewSound(null);
        setIsPlayingPreview(false);
        return;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: customAudioUri },
        { shouldPlay: true },
        (status: any) => {
          if (status.didJustFinish) {
            setIsPlayingPreview(false);
            sound.unloadAsync();
            setPreviewSound(null);
          }
        }
      );
      setPreviewSound(sound);
      setIsPlayingPreview(true);
    } catch (error) {
      console.log('Error previewing audio:', error);
      Alert.alert('Error', 'Failed to play audio preview');
    }
  };

  // Remove custom audio
  const handleRemoveAudio = async () => {
    if (previewSound) {
      await previewSound.stopAsync();
      await previewSound.unloadAsync();
      setPreviewSound(null);
    }
    setCustomAudioUri(null);
    setCustomAudioName(null);
    setIsPlayingPreview(false);
  };

  const handleClose = () => {
    setSelectedReminder(null);
    router.back();
  };

  const handleDateChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
    if (selected) {
      if (pickerMode === 'date') {
        const newDate = new Date(dateTime);
        newDate.setFullYear(selected.getFullYear());
        newDate.setMonth(selected.getMonth());
        newDate.setDate(selected.getDate());
        setDateTime(newDate);
        
        // On Android, show time picker after date selection
        if (Platform.OS === 'android') {
          setTimeout(() => {
            setPickerMode('time');
            setShowTimePicker(true);
          }, 100);
        }
      } else {
        const newDate = new Date(dateTime);
        newDate.setHours(selected.getHours());
        newDate.setMinutes(selected.getMinutes());
        setDateTime(newDate);
      }
    }
  };

  const openDatePicker = () => {
    setPickerMode('date');
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setPickerMode('time');
    setShowTimePicker(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the reminder');
      return false;
    }
    if (dateTime <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return false;
    }
    if (!profile?.id || !partner?.id) {
      Alert.alert('Error', 'No partner connected. Please connect with your parent first.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      // Stop preview if playing
      if (previewSound) {
        await previewSound.stopAsync();
        await previewSound.unloadAsync();
        setPreviewSound(null);
        setIsPlayingPreview(false);
      }

      let audioUrl: string | null = null;

      // Upload custom audio if selected and it's a new local file
      if (customAudioUri && !customAudioUri.startsWith('http')) {
        setIsUploadingAudio(true);
        try {
          const { storageService } = await import('../../src/services/firebase/storage');
          audioUrl = await storageService.uploadReminderAudio(
            profile!.id,
            customAudioUri
          );
        } catch (uploadError) {
          console.log('Audio upload error:', uploadError);
          // Continue without custom audio
        }
        setIsUploadingAudio(false);
      } else if (customAudioUri?.startsWith('http')) {
        // Keep existing URL if editing
        audioUrl = customAudioUri;
      }

      const reminderData = {
        title: title.trim(),
        description: description.trim() || undefined,
        dateTime,
        repeat: selectedRepeat,
        label: selectedLabel,
        followUpMinutes: parseInt(followUpMinutes) || 10,
        customAlarmAudioUrl: audioUrl,
      };

      if (isEditing && selectedReminder) {
        await updateReminder(selectedReminder.id, reminderData);
        Alert.alert('Success', 'Reminder updated successfully!');
      } else {
        await createReminder(profile!.id, partner!.id, reminderData);
        Alert.alert('Success', `Reminder created for ${partner?.name || 'your parent'}!`);
      }
      
      handleClose();
    } catch (error: any) {
      setIsUploadingAudio(false);
      Alert.alert('Error', error.message || 'Failed to save reminder');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Reminder' : 'New Reminder'}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* For Who */}
          <View style={styles.forSection}>
            <Text style={styles.forLabel}>Creating reminder for</Text>
            <View style={styles.forPerson}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={colors.primary[500]} />
              </View>
              <Text style={styles.forName}>{partner?.name || 'Parent'}</Text>
            </View>
          </View>

          {/* Title */}
          <Input
            label="What needs to be done?"
            placeholder="e.g., Take blood pressure medicine"
            value={title}
            onChangeText={setTitle}
            icon="create-outline"
          />

          {/* Description */}
          <Input
            label="Additional notes (optional)"
            placeholder="e.g., Take with food after breakfast"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.descriptionInput}
            icon="document-text-outline"
          />

          {/* Date & Time */}
          <Text style={styles.sectionLabel}>When?</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={openDatePicker}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary[500]} />
              <Text style={styles.dateTimeText}>{formatDate(dateTime)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={openTimePicker}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary[500]} />
              <Text style={styles.dateTimeText}>{formatTime(dateTime)}</Text>
            </TouchableOpacity>
          </View>

          {/* Label Selection */}
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.labelGrid}>
            {LABELS.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.labelButton,
                  selectedLabel === item.value && {
                    backgroundColor: item.color + '20',
                    borderColor: item.color,
                  },
                ]}
                onPress={() => setSelectedLabel(item.value)}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={selectedLabel === item.value ? item.color : colors.text.tertiary} 
                />
                <Text style={[
                  styles.labelText,
                  selectedLabel === item.value && { color: item.color },
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Repeat Selection */}
          <Text style={styles.sectionLabel}>Repeat</Text>
          <View style={styles.repeatContainer}>
            {REPEAT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.repeatButton,
                  selectedRepeat === option.value && styles.repeatButtonActive,
                ]}
                onPress={() => setSelectedRepeat(option.value)}
              >
                <Text style={[
                  styles.repeatText,
                  selectedRepeat === option.value && styles.repeatTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Follow-up Time */}
          <Text style={styles.sectionLabel}>Follow-up reminder (if not done)</Text>
          <View style={styles.followUpContainer}>
            {['5', '10', '15', '30'].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.followUpButton,
                  followUpMinutes === mins && styles.followUpButtonActive,
                ]}
                onPress={() => setFollowUpMinutes(mins)}
              >
                <Text style={[
                  styles.followUpText,
                  followUpMinutes === mins && styles.followUpTextActive,
                ]}>
                  {mins} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Ringtone */}
          <Text style={styles.sectionLabel}>Custom Alarm Sound (optional)</Text>
          <View style={styles.audioSection}>
            {customAudioUri ? (
              <View style={styles.audioSelected}>
                <View style={styles.audioInfo}>
                  <Ionicons name="musical-note" size={20} color={colors.primary[500]} />
                  <Text style={styles.audioName} numberOfLines={1}>
                    {customAudioName || 'Custom audio'}
                  </Text>
                </View>
                <View style={styles.audioActions}>
                  <TouchableOpacity
                    onPress={handlePreviewAudio}
                    style={styles.audioActionButton}
                  >
                    <Ionicons
                      name={isPlayingPreview ? 'stop' : 'play'}
                      size={20}
                      color={colors.primary[500]}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRemoveAudio}
                    style={styles.audioActionButton}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger.main} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.audioPickerButton}
                onPress={handlePickAudio}
                disabled={isUploadingAudio}
              >
                {isUploadingAudio ? (
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                ) : (
                  <>
                    <Ionicons name="musical-notes-outline" size={24} color={colors.primary[500]} />
                    <Text style={styles.audioPickerText}>Choose Audio File</Text>
                    <Text style={styles.audioPickerHint}>MP3, WAV, M4A</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            <Text style={styles.audioNote}>
              Leave empty to use default alarm sound
            </Text>
          </View>

          {/* Spacing at bottom */}
          <View style={{ height: spacing[6] }} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <Button
            title={isEditing ? 'Update Reminder' : 'Create Reminder'}
            onPress={handleSave}
            loading={isLoading}
            fullWidth
            size="lg"
            icon={<Ionicons name="checkmark" size={20} color={colors.neutral.white} />}
          />
        </View>

        {/* Date/Time Pickers */}
        {(showDatePicker || showTimePicker) && (
          <DateTimePicker
            value={dateTime}
            mode={pickerMode}
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
        
        {/* iOS Modal Picker */}
        {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
          <View style={styles.iosPickerOverlay}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => {
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}>
                  <Text style={styles.iosPickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dateTime}
                mode={pickerMode}
                is24Hour={false}
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.iosPicker}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  forSection: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  forLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  forPerson: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  forName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: spacing[3],
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  dateTimeText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '500',
  },
  labelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  labelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral.white,
    gap: spacing[2],
  },
  labelText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  repeatContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  repeatButton: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
  },
  repeatButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  repeatText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  repeatTextActive: {
    color: colors.primary[500],
  },
  followUpContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  followUpButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
  },
  followUpButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  followUpText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  followUpTextActive: {
    color: colors.primary[500],
  },
  // Audio section styles
  audioSection: {
    marginBottom: spacing[4],
  },
  audioPickerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[5],
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
    gap: spacing[1],
  },
  audioPickerText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.primary[500],
  },
  audioPickerHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  audioSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: radius.lg,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[2],
  },
  audioName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  audioActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  audioActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  audioNote: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.background.primary,
  },
  // iOS Picker styles
  iosPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay.medium,
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  iosPickerDone: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary[500],
  },
  iosPicker: {
    height: 200,
  },
});

