import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Button } from '../components';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context';
import { userService } from '../services';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList, MainTabParamList, User, Badge } from '../types';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

interface StatItemProps {
  label: string;
  value: string | number;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onPress,
  showArrow = true,
  danger = false,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuItemLeft}>
      <Ionicons
        name={icon}
        size={22}
        color={danger ? COLORS.error : COLORS.textSecondary}
      />
      <Text style={[styles.menuItemLabel, danger && styles.menuItemLabelDanger]}>
        {label}
      </Text>
    </View>
    {showArrow && (
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
    )}
  </TouchableOpacity>
);

// Badge icon mapping
const getBadgeIcon = (badgeType: string): string => {
  const icons: Record<string, string> = {
    'TOP_CONTRIBUTOR': '🏆',
    'HELPFUL': '💡',
    'RISING_STAR': '🌟',
    'VERIFIED': '✅',
    'FIRST_POST': '📝',
    'MENTOR': '🎓',
    'POPULAR': '🔥',
    'VETERAN': '⭐',
  };
  return icons[badgeType] || '🏅';
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = async () => {
    try {
      const [profileData, userBadges] = await Promise.all([
        userService.getMyProfile(),
        authUser?.id ? userService.getUserBadges(authUser.id) : Promise.resolve([]),
      ]);
      setProfile(profileData);
      setBadges(userBadges);
    } catch (error) {
      console.log('Error fetching profile:', error);
      // Use auth user as fallback
      if (authUser) {
        setProfile(authUser as User);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleEditProfile = () => {
    navigation.navigate('Settings');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleSavedPosts = () => {
    navigation.navigate('SavedPosts');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayUser = profile || authUser;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleSettings}>
            <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <UserAvatar
            username={displayUser?.username || 'User'}
            avatarUrl={profile?.profilePictureUrl}
            size="large"
          />
          <Text style={styles.username}>@{displayUser?.username || 'username'}</Text>
          {displayUser?.realName && (
            <Text style={styles.realName}>{displayUser.realName}</Text>
          )}
          {profile?.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}
          <Text style={styles.email}>{displayUser?.email}</Text>
          {profile?.universityName && (
            <View style={styles.universityBadge}>
              <Ionicons name="school-outline" size={14} color={COLORS.primary} />
              <Text style={styles.universityText}>{profile.universityName}</Text>
            </View>
          )}

          <View style={styles.statsContainer}>
            <StatItem label="Karma" value={profile?.totalKarma || 0} />
            <View style={styles.statDivider} />
            <StatItem label="Posts" value={profile?.postCount || 0} />
            <View style={styles.statDivider} />
            <StatItem label="Badges" value={badges.length} />
          </View>

          <Button
            title="Edit Profile"
            onPress={handleEditProfile}
            variant="outline"
            size="small"
            style={styles.editButton}
          />
        </View>

        {/* Badges Section */}
        {badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesList}
            >
              {badges.map((badge) => (
                <View key={badge.id} style={styles.badge}>
                  <Text style={styles.badgeEmoji}>{getBadgeIcon(badge.badgeType)}</Text>
                  <Text style={styles.badgeLabel}>{badge.badgeName || badge.badgeType.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="bookmark-outline"
            label="Saved Posts"
            onPress={handleSavedPosts}
          />
          <MenuItem
            icon="person-outline"
            label="Account Settings"
            onPress={handleSettings}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => {}}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            onPress={() => {}}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => {}}
          />
          <MenuItem
            icon="information-circle-outline"
            label="About"
            onPress={() => {}}
          />
          <MenuItem
            icon="log-out-outline"
            label="Log Out"
            onPress={handleLogout}
            showArrow={false}
            danger
          />
        </View>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.base,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  username: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  realName: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  email: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  bio: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  universityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
  },
  universityText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  editButton: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  badgesList: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  badge: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    alignItems: 'center',
    marginRight: SPACING.md,
    minWidth: 80,
    ...SHADOWS.sm,
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  badgeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuItemLabel: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },
  menuItemLabelDanger: {
    color: COLORS.error,
  },
  version: {
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginVertical: SPACING.xxl,
  },
});

export default ProfileScreen;
