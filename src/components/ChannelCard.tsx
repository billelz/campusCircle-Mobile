import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, SPACING, SHADOWS } from '../constants/theme';
import { Channel } from '../types';

interface ChannelCardProps {
  channel: Channel;
  onPress: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  style?: ViewStyle;
  compact?: boolean;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onPress,
  onBookmark,
  isBookmarked = false,
  style,
  compact = false,
}) => {
  const getCategoryColor = (category?: string): string => {
    switch (category?.toLowerCase()) {
      case 'academics':
        return COLORS.categoryAcademics;
      case 'campus_life':
      case 'campus life':
        return COLORS.categoryCampusLife;
      case 'career':
        return COLORS.categoryCareer;
      case 'mental_health':
      case 'mental health':
        return COLORS.categoryMentalHealth;
      default:
        return COLORS.categoryGeneral;
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactContent}>
          <Text style={[styles.category, { color: getCategoryColor(channel.category) }]}>
            {channel.category || 'General'}
          </Text>
          <Text style={styles.compactName} numberOfLines={1}>
            {channel.name}
          </Text>
        </View>
        <TouchableOpacity onPress={onBookmark} style={styles.iconButton}>
          <Ionicons
            name={channel.isSubscribed ? 'eye' : 'add-circle-outline'}
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.category, { color: getCategoryColor(channel.category) }]}>
          {channel.category || 'CS & Engineering'}
        </Text>
        {onBookmark && (
          <TouchableOpacity onPress={onBookmark}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isBookmarked ? COLORS.secondary : COLORS.gray400}
            />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {channel.name}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {channel.description || channel.rules || 'Join the discussion in this channel.'}
      </Text>
      {channel.description && channel.description.length > 100 && (
        <TouchableOpacity>
          <Text style={styles.readMore}>Read More</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.memberCount}>{channel.subscriberCount} Joined</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginRight: SPACING.base,
    width: 280,
    ...SHADOWS.md,
  },
  compactCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  compactContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  category: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  name: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  compactName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  readMore: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginBottom: SPACING.sm,
  },
  memberCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
    fontWeight: '500',
  },
  iconButton: {
    padding: SPACING.xs,
  },
});

export default ChannelCard;
