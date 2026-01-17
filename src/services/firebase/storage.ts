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

// Image compression settings - optimized for smaller file sizes
const IMAGE_COMPRESSION_SETTINGS = {
  profile: { maxWidth: 300, maxHeight: 300, quality: 0.5 },
  chat: { maxWidth: 800, quality: 0.5 },
  album: { maxWidth: 1000, maxHeight: 1000, quality: 0.6 },
  thumbnail: { maxWidth: 150, maxHeight: 150, quality: 0.4 },
};

// Compress image before upload
const compressImage = async (
  uri: string,
  settings: { maxWidth: number; maxHeight: number; quality: number }
): Promise<string> => {
  try {
    // Get image dimensions first
    const { width, height } = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // Calculate resize dimensions while maintaining aspect ratio
    const aspectRatio = width / height;
    let resizeWidth = settings.maxWidth;
    let resizeHeight = resizeWidth / aspectRatio;
    
    // If height exceeds max, recalculate based on height
    if (resizeHeight > settings.maxHeight) {
      resizeHeight = settings.maxHeight;
      resizeWidth = resizeHeight * aspectRatio;
    }
    
    // Resize with only width specified (maintains aspect ratio)
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: resizeWidth } }], // Only specify width, height auto-calculated
      {
        compress: settings.quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return uri;
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

