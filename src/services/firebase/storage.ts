// src/services/firebase/storage.ts
// Firebase Storage service for file uploads

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config';
import * as ImageManipulator from 'expo-image-manipulator';

export interface UploadResult {
  url: string;
  path: string;
}

// Image compression settings
const IMAGE_COMPRESSION_SETTINGS = {
  profile: { maxWidth: 500, maxHeight: 500, quality: 0.7 },
  chat: { maxWidth: 1200, maxHeight: 1200, quality: 0.7 },
  album: { maxWidth: 1600, maxHeight: 1600, quality: 0.8 },
  thumbnail: { maxWidth: 200, maxHeight: 200, quality: 0.6 },
};

// Compress image before upload
const compressImage = async (
  uri: string,
  settings: { maxWidth: number; maxHeight: number; quality: number }
): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: settings.maxWidth, height: settings.maxHeight } }],
      {
        compress: settings.quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return uri; // Return original if compression fails
  }
};

// Upload profile image
export const uploadProfileImage = async (
  userId: string,
  uri: string
): Promise<UploadResult> => {
  const compressedUri = await compressImage(uri, IMAGE_COMPRESSION_SETTINGS.profile);
  const fileName = `profile_${Date.now()}.jpg`;
  const path = `profiles/${userId}/${fileName}`;
  return uploadFile(compressedUri, path);
};

// Upload chat image
export const uploadChatImage = async (
  chatRoomId: string,
  uri: string
): Promise<UploadResult> => {
  const compressedUri = await compressImage(uri, IMAGE_COMPRESSION_SETTINGS.chat);
  const fileName = `image_${Date.now()}.jpg`;
  const path = `chat/${chatRoomId}/${fileName}`;
  return uploadFile(compressedUri, path);
};

// Upload voice message (no compression needed)
export const uploadVoiceMessage = async (
  chatRoomId: string,
  uri: string
): Promise<UploadResult> => {
  const fileName = `voice_${Date.now()}.m4a`;
  const path = `voice/${chatRoomId}/${fileName}`;
  return uploadFile(uri, path);
};

// Upload album image
export const uploadAlbumImage = async (
  userId: string,
  uri: string
): Promise<UploadResult> => {
  const compressedUri = await compressImage(uri, IMAGE_COMPRESSION_SETTINGS.album);
  const fileName = `album_${Date.now()}.jpg`;
  const path = `album/${userId}/${fileName}`;
  return uploadFile(compressedUri, path);
};

// Upload reminder audio (custom ringtone)
export const uploadReminderAudio = async (
  userId: string,
  uri: string
): Promise<string> => {
  const fileName = `ringtone_${Date.now()}.m4a`;
  const path = `ringtones/${userId}/${fileName}`;
  const result = await uploadFile(uri, path);
  return result.url;
};

// Generic file upload
const uploadFile = async (uri: string, path: string): Promise<UploadResult> => {
  try {
    // Read file as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    return { url, path };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Delete file
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

// Generate thumbnail URL (using Firebase Extensions or custom logic)
export const getThumbnailUrl = (imageUrl: string): string => {
  // For now, return the same URL
  // In production, use Firebase Extensions or image processing
  return imageUrl;
};

// Export all as storageService for easier imports
export const storageService = {
  uploadProfileImage,
  uploadChatImage,
  uploadVoiceMessage,
  uploadAlbumImage,
  uploadReminderAudio,
  deleteFile,
  getThumbnailUrl,
};

