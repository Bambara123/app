// src/stores/chatStore.ts
// Chat state management

import { create } from 'zustand';
import { ChatRoom, Message, SendMessageInput, MessageType } from '../types';
import { QueryDocumentSnapshot } from 'firebase/firestore';

interface ChatState {
  // State
  chatRoom: ChatRoom | null;
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isSending: boolean;
  hasMoreMessages: boolean;
  lastDoc: QueryDocumentSnapshot | null;
  error: string | null;

  // Actions
  initialize: (participants: string[]) => Promise<() => void>;
  loadMore: () => Promise<void>;
  sendMessage: (
    senderId: string,
    type: MessageType,
    content: string,
    mediaUri?: string,
    duration?: number
  ) => Promise<void>;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  chatRoom: null,
  messages: [],
  isLoading: false,
  isLoadingMore: false,
  isSending: false,
  hasMoreMessages: true,
  lastDoc: null,
  error: null,

  // Initialize chat room - load initial messages + subscribe to new ones
  initialize: async (participants: string[]) => {
    set({ isLoading: true, error: null });

    try {
      const { chatService } = await import('../services/firebase/firestore');

      // Get or create chat room
      const chatRoom = await chatService.getOrCreateChatRoom(participants);
      set({ chatRoom });

      // Load initial messages (most recent 20)
      const { messages, lastDoc } = await chatService.loadInitialMessages(
        chatRoom.id,
        20
      );
      
      set({ 
        messages, 
        lastDoc,
        hasMoreMessages: messages.length >= 20,
        isLoading: false 
      });

      // Subscribe to NEW messages only (real-time)
      const latestMessageTime = messages.length > 0 
        ? messages[messages.length - 1].createdAt 
        : new Date();

      const unsubscribe = chatService.subscribeToNewMessages(
        chatRoom.id,
        latestMessageTime,
        (newMessages) => {
          const { messages: currentMessages } = get();
          set({ messages: [...currentMessages, ...newMessages] });
        }
      );

      return unsubscribe;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to initialize chat',
        isLoading: false,
      });
      throw error;
    }
  },

  // Load more older messages
  loadMore: async () => {
    const { chatRoom, lastDoc, isLoadingMore, hasMoreMessages } = get();
    
    if (!chatRoom || !lastDoc || isLoadingMore || !hasMoreMessages) {
      return;
    }

    set({ isLoadingMore: true });

    try {
      const { chatService } = await import('../services/firebase/firestore');
      
      const { messages: olderMessages, lastDoc: newLastDoc, hasMore } = 
        await chatService.loadMoreMessages(chatRoom.id, lastDoc, 20);
      
      const { messages: currentMessages } = get();
      
      set({
        messages: [...olderMessages, ...currentMessages],
        lastDoc: newLastDoc,
        hasMoreMessages: hasMore,
        isLoadingMore: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load more messages',
        isLoadingMore: false,
      });
    }
  },

  // Send message
  sendMessage: async (
    senderId: string,
    type: MessageType,
    content: string,
    mediaUri?: string,
    duration?: number
  ) => {
    const { chatRoom } = get();
    if (!chatRoom) return;

    set({ isSending: true, error: null });

    try {
      const { chatService } = await import('../services/firebase/firestore');
      const { uploadChatImage, uploadVoiceMessage } = await import('../services/firebase/storage');

      let mediaUrl: string | undefined;

      if (mediaUri) {
        if (type === 'image') {
          const result = await uploadChatImage(chatRoom.id, mediaUri);
          mediaUrl = result.url;
        } else if (type === 'voice') {
          const result = await uploadVoiceMessage(chatRoom.id, mediaUri);
          mediaUrl = result.url;
        }
      }

      const input: SendMessageInput = {
        type,
        content,
        mediaUrl,
        duration,
      };

      await chatService.sendMessage(chatRoom.id, senderId, input);
      set({ isSending: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to send message',
        isSending: false,
      });
      throw error;
    }
  },

  // Reset store
  reset: () => {
    set({
      chatRoom: null,
      messages: [],
      isLoading: false,
      isLoadingMore: false,
      isSending: false,
      hasMoreMessages: true,
      lastDoc: null,
      error: null,
    });
  },
}));
