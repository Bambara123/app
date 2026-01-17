// src/stores/albumStore.ts
// Photo album state management

import { create } from 'zustand';
import { AlbumImage, AlbumSection } from '../types';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

interface AlbumState {
  // State
  images: AlbumImage[];
  sections: AlbumSection[];
  selectedImage: AlbumImage | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;

  // Actions
  initialize: (connectionId: string) => () => void;
  uploadImage: (
    connectionId: string,
    userId: string,
    uri: string,
    width: number,
    height: number,
    note?: string
  ) => Promise<void>;
  setSelectedImage: (image: AlbumImage | null) => void;
  reset: () => void;
}

// Group images by date
const groupImagesByDate = (images: AlbumImage[]): AlbumSection[] => {
  const groups: Record<string, AlbumImage[]> = {};

  images.forEach((image) => {
    const date = new Date(image.createdAt);
    let key: string;

    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else if (isThisWeek(date)) {
      key = 'This Week';
    } else if (isThisMonth(date)) {
      key = 'This Month';
    } else {
      key = format(date, 'MMMM yyyy');
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(image);
  });

  return Object.entries(groups).map(([title, data]) => ({
    title,
    data,
  }));
};

export const useAlbumStore = create<AlbumState>((set, get) => ({
  // Initial state
  images: [],
  sections: [],
  selectedImage: null,
  isLoading: false,
  isUploading: false,
  error: null,

  // Initialize album subscription
  initialize: (connectionId: string) => {
    set({ isLoading: true });

    const initFirebase = async () => {
      try {
        const { albumService } = await import('../services/firebase/firestore');
        return albumService.subscribeToAlbum(connectionId, (images) => {
          set({
            images,
            sections: groupImagesByDate(images),
            isLoading: false,
          });
        });
      } catch (error) {
        console.error('Failed to initialize album:', error);
        set({ isLoading: false, error: 'Failed to load album' });
        return () => {};
      }
    };

    let unsubscribe: (() => void) | null = null;
    initFirebase().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  },

  // Upload new image
  uploadImage: async (
    connectionId: string,
    userId: string,
    uri: string,
    width: number,
    height: number,
    note?: string
  ) => {
    set({ isUploading: true, error: null });

    try {
      const { albumService } = await import('../services/firebase/firestore');
      const { uploadAlbumImage, getThumbnailUrl } = await import('../services/firebase/storage');

      const { url } = await uploadAlbumImage(userId, uri);
      const thumbnailUrl = getThumbnailUrl(url);

      await albumService.addImage(connectionId, userId, {
        imageUrl: url,
        thumbnailUrl,
        width,
        height,
        note,
      });

      set({ isUploading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to upload image',
        isUploading: false,
      });
      throw error;
    }
  },

  // Set selected image for preview
  setSelectedImage: (image: AlbumImage | null) => {
    set({ selectedImage: image });
  },

  // Reset store
  reset: () => {
    set({
      images: [],
      sections: [],
      selectedImage: null,
      isLoading: false,
      isUploading: false,
      error: null,
    });
  },
}));
