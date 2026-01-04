// app/(parent)/album.tsx
// Parent Photo Album Screen (The Vault)

import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VaultCard } from '../../src/components/album';
import { useAlbumStore, useUserStore } from '../../src/stores';
import { colors, spacing, typography, layout, radius } from '../../src/constants';

export default function ParentAlbumScreen() {
  const { profile, partner, connection } = useUserStore();
  const { images, initialize, uploadImage, isUploading, setSelectedImage } = useAlbumStore();

  useEffect(() => {
    if (connection?.id) {
      const unsubscribe = initialize(connection.id);
      return unsubscribe;
    }
  }, [connection?.id]);

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0] && connection?.id && profile?.id) {
      const asset = result.assets[0];
      await uploadImage(
        connection.id,
        profile.id,
        asset.uri,
        asset.width,
        asset.height
      );
    }
  };

  const getUploaderInfo = (uploadedBy: string) => {
    if (uploadedBy === profile?.id) {
      return { name: profile.name || 'Me', role: 'parent' as const };
    }
    return { name: partner?.name || 'Family', role: 'child' as const };
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
          </View>
        }
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
});

