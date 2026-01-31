// app/(child)/album.tsx
// Child Photo Album Screen (The Vault)

import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { VaultCard } from '../../src/components/album';
import { LoadingList } from '../../src/components/common';
import { useAlbumStore, useUserStore, useAuthStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';

export default function ChildAlbumScreen() {
  const { profile, partner, connection } = useUserStore();
  const { user } = useAuthStore();
  const { images, initialize, uploadImage, isUploading, isLoading, setSelectedImage } = useAlbumStore();
  
  // Note modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<{uri: string, width: number, height: number} | null>(null);
  const [imageNote, setImageNote] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Generate a fallback connection ID based on user IDs if no connection exists
  const getConnectionId = () => {
    if (connection?.id) return connection.id;
    // Fallback: create a pseudo connection ID from user IDs
    if (profile?.id && partner?.id) {
      const ids = [profile.id, partner.id].sort();
      return `connection_${ids[0]}_${ids[1]}`;
    }
    // Demo mode fallback
    return 'demo-connection-789';
  };

  useEffect(() => {
    const connectionId = getConnectionId();
    if (connectionId) {
      const unsubscribe = initialize(connectionId);
      return unsubscribe;
    }
  }, [connection?.id, profile?.id, partner?.id]);

  // Track initial loading completion
  useEffect(() => {
    if (!isLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isLoading]);

  const handleAddPhoto = async () => {
    // Check if user is connected first
    if (!user?.connectedTo) {
      router.push('/(auth)/partner-connection');
      return;
    }

    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Store the pending image and show note modal
        setPendingImage({
          uri: asset.uri,
          width: asset.width || 400,
          height: asset.height || 300,
        });
        setImageNote('');
        setShowNoteModal(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSaveWithNote = async () => {
    if (!pendingImage || !profile?.id) return;
    
    const connectionId = getConnectionId();
    if (!connectionId) {
      Alert.alert('Error', 'No connection found. Please connect with your parent first.');
      return;
    }

    try {
      await uploadImage(
        connectionId,
        profile.id,
        pendingImage.uri,
        pendingImage.width,
        pendingImage.height,
        imageNote.trim() || undefined
      );
      setShowNoteModal(false);
      setPendingImage(null);
      setImageNote('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image');
    }
  };

  const handleSkipNote = async () => {
    if (!pendingImage || !profile?.id) return;
    
    const connectionId = getConnectionId();
    if (!connectionId) {
      Alert.alert('Error', 'No connection found. Please connect with your parent first.');
      return;
    }

    try {
      await uploadImage(
        connectionId,
        profile.id,
        pendingImage.uri,
        pendingImage.width,
        pendingImage.height
      );
      setShowNoteModal(false);
      setPendingImage(null);
      setImageNote('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image');
    }
  };

  // Get display name for partner (use partnerCallName if set)
  const partnerDisplayName = user?.partnerCallName || partner?.name || 'Parent';

  const getUploaderInfo = (uploadedBy: string) => {
    if (uploadedBy === profile?.id) {
      return { name: 'Me', role: 'child' as const };
    }
    return { name: partnerDisplayName, role: 'parent' as const };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>The Vault</Text>
          <Text style={styles.subtitle}>Shared history, kept safe.</Text>
        </View>
        <TouchableOpacity
          onPress={handleAddPhoto}
          style={styles.addButton}
          disabled={isUploading}
        >
          <Ionicons name="add" size={24} color={colors.neutral.white} />
        </TouchableOpacity>
      </View>

      {/* Photos */}
      {isInitialLoad ? (
        <LoadingList count={6} type="album" />
      ) : (
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const uploader = getUploaderInfo(item.uploadedBy);
            return (
              <VaultCard
                image={item}
                uploaderName={uploader.name}
                uploaderRole={uploader.role}
                onPress={() => setSelectedImage(item)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>No photos yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first memory
              </Text>
              <TouchableOpacity
                onPress={handleAddPhoto}
                style={styles.emptyAddButton}
              >
                <Ionicons name="add" size={20} color={colors.neutral.white} />
                <Text style={styles.emptyAddButtonText}>Add Photo</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowNoteModal(false);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add a note</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowNoteModal(false);
                      setPendingImage(null);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={24} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.modalSubtitle}>
                  Add a short note to remember this moment 💝
                </Text>
                
                <TextInput
                  style={styles.noteInput}
                  placeholder="e.g., Beautiful sunset from the garden 🌅"
                  placeholderTextColor={colors.text.tertiary}
                  value={imageNote}
                  onChangeText={setImageNote}
                  maxLength={150}
                  autoFocus
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                />
                
                <Text style={styles.charCount}>{imageNote.length}/150</Text>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.skipButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleSkipNote();
                    }}
                    disabled={isUploading}
                  >
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.saveButton, isUploading && styles.saveButtonDisabled]}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleSaveWithNote();
                    }}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Text style={styles.saveButtonText}>Uploading...</Text>
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color={colors.neutral.white} />
                        <Text style={styles.saveButtonText}>Save</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 32,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing[1],
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[20],
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginTop: spacing[4],
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[900],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius.full,
    marginTop: spacing[4],
    gap: spacing[2],
  },
  emptyAddButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.medium,
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing[5],
    paddingBottom: Platform.OS === 'ios' ? spacing[8] : spacing[5],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  noteInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.lg,
    padding: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    height: 52,
  },
  charCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  skipButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[900],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral.white,
    fontWeight: '600',
  },
});

