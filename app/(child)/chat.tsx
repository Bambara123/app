// app/(child)/chat.tsx
// Child Chat Screen

import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Modal, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ChatHeader, ChatBubble, MessageInput } from '../../src/components/chat';
import { useChatStore, useUserStore, useAuthStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';
import { Message } from '../../src/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ChildChatScreen() {
  const { profile, partner } = useUserStore();
  const { user } = useAuthStore();
  const {
    messages,
    initialize,
    sendMessage,
    isSending,
  } = useChatStore();
  const flatListRef = useRef<FlatList>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isConnected = !!user?.connectedTo;
  const partnerDisplayName = user?.partnerCallName || partner?.name || 'Parent';

  useEffect(() => {
    if (profile?.id && partner?.id && isConnected) {
      const initChat = async () => {
        const unsubscribe = await initialize([profile.id, partner.id]);
        return unsubscribe;
      };
      initChat();
    }
  }, [profile?.id, partner?.id, isConnected]);

  const handleNavigateToConnect = () => {
    router.push('/(auth)/partner-connection');
  };

  const handleSendText = async (text: string) => {
    if (!isConnected) {
      handleNavigateToConnect();
      return;
    }
    if (profile?.id) {
      await sendMessage(profile.id, 'text', text);
    }
  };

  const handleSendImage = async (uri: string) => {
    if (!isConnected) {
      handleNavigateToConnect();
      return;
    }
    if (profile?.id) {
      await sendMessage(profile.id, 'image', '', uri);
    }
  };

  const handleSendVoice = async (uri: string, duration: number) => {
    if (!isConnected) {
      handleNavigateToConnect();
      return;
    }
    if (profile?.id) {
      await sendMessage(profile.id, 'voice', '', uri, duration);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble
      message={item}
      isSent={item.senderId === profile?.id}
      onImagePress={(url) => setSelectedImage(url)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fullscreen Image Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={28} color={colors.neutral.white} />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.imageModalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Echoes</Text>
      </View>

      {/* Not Connected Banner */}
      {!isConnected ? (
        <TouchableOpacity style={styles.notConnectedBanner} onPress={handleNavigateToConnect}>
          <Ionicons name="link-outline" size={20} color={colors.warning.dark} />
          <Text style={styles.notConnectedText}>
            Connect with your parent to start chatting
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.warning.dark} />
        </TouchableOpacity>
      ) : partner ? (
        <ChatHeader
          partnerName={partnerDisplayName}
          partnerAvatar={partner.profileImageUrl}
          partnerPhone={partner.phone}
          isOnline={partner.isOnline}
        />
      ) : null}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={isConnected ? messages : []}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={isConnected ? "chatbubbles-outline" : "link-outline"} 
              size={48} 
              color={colors.text.tertiary} 
            />
            <Text style={styles.emptyText}>
              {isConnected 
                ? `Start a conversation with ${partnerDisplayName}`
                : 'Connect with your parent to unlock chat'
              }
            </Text>
          </View>
        }
      />

      {/* Message Input - Disabled style when not connected */}
      <View style={!isConnected && styles.disabledOverlay}>
        <MessageInput
          onSendText={handleSendText}
          onSendImage={handleSendImage}
          onSendVoice={handleSendVoice}
          isSending={isSending}
        />
      </View>
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
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 28,
    color: colors.text.primary,
  },
  notConnectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning.light,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  notConnectedText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning.dark,
    fontWeight: '500',
  },
  messageList: {
    paddingVertical: spacing[4],
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[20],
    gap: spacing[3],
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing[6],
  },
  disabledOverlay: {
    opacity: 0.5,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: spacing[2],
  },
  imageModalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});

