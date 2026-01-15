// src/components/home/RhythmCard.tsx
// Activity rhythm card (Mom's Rhythm / Son's Rhythm)

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common';
import { colors, spacing, typography, radius } from '../../constants';

interface RhythmCardProps {
  label: string;
  activity: string;
  isOwnRhythm?: boolean; // true if this is the user's own rhythm
  userRole?: 'parent' | 'child'; // the role of the current user
  isEditable?: boolean;
  onActivityChange?: (activity: string) => void;
}

export const RhythmCard: React.FC<RhythmCardProps> = ({
  label,
  activity,
  isOwnRhythm = false,
  userRole = 'child',
  isEditable = false,
  onActivityChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedActivity, setEditedActivity] = useState(activity);

  const handleSave = () => {
    Keyboard.dismiss();
    setIsEditing(false);
    if (onActivityChange && editedActivity.trim() !== activity) {
      onActivityChange(editedActivity.trim());
    }
  };

  // Determine icon based on whose rhythm this is and the user's role
  const getIconConfig = () => {
    if (isOwnRhythm) {
      // User's own rhythm - show icon relevant to their role
      if (userRole === 'parent') {
        return { iconName: 'home', iconColor: colors.primary[500] };
      } else {
        return { iconName: 'briefcase', iconColor: colors.accent.main };
      }
    } else {
      // Partner's rhythm - show icon relevant to partner's role (opposite of user)
      if (userRole === 'parent') {
        return { iconName: 'briefcase', iconColor: colors.accent.main };
      } else {
        return { iconName: 'home', iconColor: colors.primary[500] };
      }
    }
  };

  const { iconName, iconColor } = getIconConfig();

  return (
    <Card variant="rhythm" style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editedActivity}
                onChangeText={setEditedActivity}
                onBlur={handleSave}
                onSubmitEditing={handleSave}
                autoFocus
                maxLength={50}
                placeholder="What are you up to?"
                placeholderTextColor={colors.text.tertiary}
              />
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Ionicons name="checkmark" size={20} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => isEditable && setIsEditing(true)}
              disabled={!isEditable}
              style={styles.activityContainer}
            >
              <Text style={styles.activity} numberOfLines={2}>
                {activity}
              </Text>
              {isEditable && (
                <Ionicons name="pencil" size={18} color={colors.text.tertiary} style={styles.editIcon} />
              )}
            </TouchableOpacity>
          )}
        </View>
        {!isEditing && (
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={iconName as any} size={24} color={iconColor} />
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activity: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '500',
  },
  editIcon: {
    marginLeft: spacing[2],
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '500',
    backgroundColor: colors.neutral[100],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    marginRight: spacing[2],
  },
  saveButton: {
    padding: spacing[2],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

