// src/components/home/NoteCard.tsx
// "Note from Mom/Son" card - editable from partner's side

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common';
import { colors, spacing, typography, radius } from '../../constants';

interface NoteCardProps {
  note: string | null;
  partnerName: string;
  isEditable: boolean; // true for the partner who can edit, false for the one who reads
  onSaveNote?: (note: string) => void;
  isLoading?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  partnerName,
  isEditable,
  onSaveNote,
  isLoading = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editedNote, setEditedNote] = useState(note || '');

  const handleOpenEdit = () => {
    setEditedNote(note || '');
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (onSaveNote) {
      onSaveNote(editedNote.trim());
    }
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setEditedNote(note || '');
    setIsModalVisible(false);
  };

  return (
    <>
      <Card variant="default" style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="heart" size={18} color={colors.primary[500]} />
            <Text style={styles.label}>
              {isEditable ? `NOTE FOR ${partnerName.toUpperCase()}` : `NOTE FROM ${partnerName.toUpperCase()}`}
            </Text>
          </View>
          {isEditable && (
            <TouchableOpacity onPress={handleOpenEdit} style={styles.editButton}>
              <Ionicons name="create-outline" size={20} color={colors.primary[500]} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.noteContainer}>
          {note ? (
            <Text style={styles.noteText}>{note}</Text>
          ) : (
            <Text style={styles.emptyText}>
              {isEditable
                ? `Tap edit to leave a note for ${partnerName}`
                : `No note from ${partnerName} yet`}
            </Text>
          )}
        </View>

        {/* Decorative background */}
        <View style={styles.decorContainer}>
          <Ionicons name="heart-outline" size={60} color={colors.primary[100]} />
        </View>
      </Card>

      {/* Edit Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Note for {partnerName}</Text>
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Leave a loving message that {partnerName} will see on their home screen 💕
            </Text>

            <TextInput
              style={styles.textInput}
              value={editedNote}
              onChangeText={setEditedNote}
              placeholder={`Write something nice for ${partnerName}...`}
              placeholderTextColor={colors.text.tertiary}
              multiline
              maxLength={200}
              autoFocus
            />

            <Text style={styles.charCount}>{editedNote.length}/200</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Ionicons name="heart" size={18} color={colors.neutral.white} />
                <Text style={styles.saveButtonText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 100,
    overflow: 'hidden',
    backgroundColor: colors.primary[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: spacing[2],
  },
  editButton: {
    padding: spacing[1],
  },
  noteContainer: {
    minHeight: 40,
    justifyContent: 'center',
  },
  noteText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  decorContainer: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.medium,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.xl,
    padding: spacing[5],
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: colors.neutral[100],
    borderRadius: radius.lg,
    padding: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  cancelButton: {
    backgroundColor: colors.neutral[100],
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  saveButton: {
    backgroundColor: colors.primary[500],
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral.white,
  },
});

