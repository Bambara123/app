// app/(child)/chat.tsx
// Child Chat Screen

import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Modal, Image, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ChatHeader, ChatBubble, MessageInput } from '../../src/components/chat';
import { LoadingList } from '../../src/components/common';
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
    loadMore,
    sendMessage,
    isSending,
    isLoadingMore,
    hasMoreMessages,
    isLoading,
  } = useChatStore();
  const flatListRef = useRef<FlatList>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAtTop, setIsAtTop] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const isConnected = !!user?.connectedTo;
  const partnerDisplayName = user?.partnerCallName || partner?.name || 'Parent';

  useEffect(() => {
    if (profile?.id && partner?.id && isConnected) {
      const initChat = async () => {
        const unsubscribe = await initialize([profile.id, partner.id]);
        // Scroll to bottom after messages load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
        return unsubscribe;
      };
      initChat();
    }
  }, [profile?.id, partner?.id, isConnected]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [messages]);

  // Track initial loading completion
  useEffect(() => {
    if (!isLoading && isInitialLoad && messages.length >= 0) {
      setIsInitialLoad(false);
    }
  }, [isLoading, messages.length]);

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

  // Handle scroll to detect when user scrolls near top
  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    
    // Check if user scrolled to top (within 100px)
    const isNearTop = contentOffset.y < 100;
    
    if (isNearTop && !isLoadingMore && hasMoreMessages && !isAtTop) {
      setIsAtTop(true);
      loadMore();
    } else if (!isNearTop) {
      setIsAtTop(false);
    }
  };

  // Render load more button
  const renderLoadMoreButton = () => {
    if (!isConnected || messages.length === 0) return null;
    
    if (!hasMoreMessages) {
      return (
        <View style={styles.loadMoreContainer}>
          <Text style={styles.noMoreText}>No more messages</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity 
        onPress={loadMore} 
        style={styles.loadMoreButton}
        disabled={isLoadingMore}
      >
        <Text style={styles.loadMoreText}>
          {isLoadingMore ? 'Loading...' : 'Load older messages'}
        </Text>
        {!isLoadingMore && (
          <Ionicons name="chevron-up" size={16} color={colors.primary[500]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fullscreen Image Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
        statusBarTranslucent
      >
        <TouchableOpacity 
          style={styles.imageModalContainer}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}
        >
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color={colors.neutral.white} />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.imageModalImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
        {isInitialLoad && isConnected ? (
          <LoadingList type="chat" />
        ) : (
          <FlatList
            ref={flatListRef}
            data={isConnected ? messages : []}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={400}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
            ListHeaderComponent={renderLoadMoreButton}
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
        )}

        {/* Message Input */}
        <MessageInput
          onSendText={handleSendText}
          onSendImage={handleSendImage}
          onSendVoice={handleSendVoice}
          isSending={isSending}
          isConnected={isConnected}
          onNotConnectedPress={handleNavigateToConnect}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardAvoid: {
    flex: 1,
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
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: spacing[3],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  imageModalImage: {
    width: SCREEN_WIDTH - 20,
    height: SCREEN_HEIGHT * 0.75,
  },
  loadMoreContainer: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.neutral[100],
    borderRadius: radius.lg,
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
    gap: spacing[2],
  },
  loadMoreText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  noMoreText: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});

