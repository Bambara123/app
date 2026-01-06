// app/(parent)/chat.tsx
// Parent Chat Screen

import React, { useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatHeader, ChatBubble, MessageInput } from '../../src/components/chat';
import { useChatStore, useUserStore, useAuthStore } from '../../src/stores';
import { colors, spacing, typography } from '../../src/constants';
import { Message } from '../../src/types';

export default function ParentChatScreen() {
  const { profile, partner } = useUserStore();
  const { user } = useAuthStore();
  const {
    messages,
    initialize,
    sendMessage,
    isSending,
  } = useChatStore();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (profile?.id && partner?.id) {
      const initChat = async () => {
        const unsubscribe = await initialize([profile.id, partner.id]);
        return unsubscribe;
      };
      initChat();
    }
  }, [profile?.id, partner?.id]);

  const handleSendText = async (text: string) => {
    if (profile?.id) {
      await sendMessage(profile.id, 'text', text);
    }
  };

  const handleSendImage = async (uri: string) => {
    if (profile?.id) {
      await sendMessage(profile.id, 'image', '', uri);
    }
  };

  const handleSendVoice = async (uri: string, duration: number) => {
    if (profile?.id) {
      await sendMessage(profile.id, 'voice', '', uri, duration);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble
      message={item}
      isSent={item.senderId === profile?.id}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>The Bridge</Text>
        {partner && (
          <View style={styles.viewAsContainer}>
            <Text style={styles.viewAsText}>VIEW AS {partner.name?.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Chat Header with Call Buttons */}
      {partner && (
        <ChatHeader
          partnerName={partner.name}
          partnerAvatar={partner.profileImageUrl}
          partnerPhone={partner.phone}
          isOnline={partner.isOnline}
        />
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        inverted={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Start a conversation with {partner?.name || 'your family'}
            </Text>
          </View>
        }
      />

      {/* Message Input */}
      <MessageInput
        onSendText={handleSendText}
        onSendImage={handleSendImage}
        onSendVoice={handleSendVoice}
        isSending={isSending}
      />
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
  viewAsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[200],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 20,
  },
  viewAsText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
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
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

