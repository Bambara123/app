// src/stores/chatStore.ts
// Chat state management

import { create } from 'zustand';
import { isDemoMode } from '../services/firebase/config';
import { ChatRoom, Message, SendMessageInput, MessageType } from '../types';

// Demo chat messages for testing
const DEMO_MESSAGES: Message[] = [
  {
    id: 'demo-msg-1',
    chatRoomId: 'demo-chat-room',
    senderId: 'demo-partner-456',
    type: 'text',
    content: 'Good morning, dear! How are you today?',
    mediaUrl: null,
    duration: null,
    status: 'read',
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'demo-msg-2',
    chatRoomId: 'demo-chat-room',
    senderId: 'demo-user-123',
    type: 'text',
    content: "Hi Mom! I'm doing great. Just wanted to check in on you 💕",
    mediaUrl: null,
    duration: null,
    status: 'read',
    createdAt: new Date(Date.now() - 3500000), // 58 minutes ago
    updatedAt: new Date(Date.now() - 3500000),
  },
  {
    id: 'demo-msg-3',
    chatRoomId: 'demo-chat-room',
    senderId: 'demo-partner-456',
    type: 'text',
    content: "I'm wonderful! Just had breakfast and took my medicine on time today.",
    mediaUrl: null,
    duration: null,
    status: 'read',
    createdAt: new Date(Date.now() - 3400000),
    updatedAt: new Date(Date.now() - 3400000),
  },
  {
    id: 'demo-msg-4',
    chatRoomId: 'demo-chat-room',
    senderId: 'demo-user-123',
    type: 'text',
    content: "That's great to hear! Don't forget your doctor's appointment tomorrow at 10am.",
    mediaUrl: null,
    duration: null,
    status: 'sent',
    createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 1800000),
  },
];

const DEMO_CHAT_ROOM: ChatRoom = {
  id: 'demo-chat-room',
  participants: ['demo-user-123', 'demo-partner-456'],
  lastMessage: DEMO_MESSAGES[DEMO_MESSAGES.length - 1],
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface ChatState {
  // State
  chatRoom: ChatRoom | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Actions
  initialize: (participants: string[]) => Promise<() => void>;
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
  isSending: false,
  error: null,

  // Initialize chat room and messages subscription
  initialize: async (participants: string[]) => {
    set({ isLoading: true, error: null });

    // Demo mode
    if (isDemoMode) {
      set({
        chatRoom: DEMO_CHAT_ROOM,
        messages: DEMO_MESSAGES,
        isLoading: false,
      });
      return () => {};
    }

    try {
      const { chatService } = await import('../services/firebase/firestore');

      const chatRoom = await chatService.getOrCreateChatRoom(participants);
      set({ chatRoom });

      const unsubscribe = chatService.subscribeToMessages(
        chatRoom.id,
        (messages) => {
          set({ messages, isLoading: false });
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

  // Send message
  sendMessage: async (
    senderId: string,
    type: MessageType,
    content: string,
    mediaUri?: string,
    duration?: number
  ) => {
    const { chatRoom, messages } = get();
    if (!chatRoom) return;

    set({ isSending: true, error: null });

    // Demo mode
    if (isDemoMode) {
      const newMessage: Message = {
        id: `demo-msg-${Date.now()}`,
        chatRoomId: chatRoom.id,
        senderId,
        type,
        content,
        mediaUrl: mediaUri || null,
        duration: duration || null,
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set({
        messages: [...messages, newMessage],
        chatRoom: { ...chatRoom, lastMessage: newMessage, updatedAt: new Date() },
        isSending: false,
      });
      return;
    }

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
      isSending: false,
      error: null,
    });
  },
}));
