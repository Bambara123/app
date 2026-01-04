// src/services/firebase/storage.ts
// Firebase Storage service for file uploads

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config';
import * as FileSystem from 'expo-file-system';

export interface UploadResult {
  url: string;
  path: string;
}

// Upload profile image
export const uploadProfileImage = async (
  userId: string,
  uri: string
): Promise<UploadResult> => {
  const fileName = `profile_${Date.now()}.jpg`;
  const path = `profiles/${userId}/${fileName}`;
  return uploadFile(uri, path);
};

// Upload chat image
export const uploadChatImage = async (
  chatRoomId: string,
  uri: string
): Promise<UploadResult> => {
  const fileName = `image_${Date.now()}.jpg`;
  const path = `chat/${chatRoomId}/${fileName}`;
  return uploadFile(uri, path);
};

// Upload voice message
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
  const fileName = `album_${Date.now()}.jpg`;
  const path = `album/${userId}/${fileName}`;
  return uploadFile(uri, path);
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

