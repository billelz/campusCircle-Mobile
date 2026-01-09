import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SearchBar, ChannelCard, CategoryChips } from '../components';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context';
import { channelService, userService } from '../services';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { CHANNEL_CATEGORIES } from '../constants/config';
import { RootStackParamList, MainTabParamList, Channel, LeaderboardUser } from '../types';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [topContributors, setTopContributors] = useState<LeaderboardUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch channels and leaderboard in parallel
      const [channelsData, leaderboardData] = await Promise.all([
        channelService.getTrendingChannels(10),
        userService.getLeaderboard(10),
      ]);
      
      setChannels(channelsData);
      setTopContributors(leaderboardData);
    } catch (error) {
      console.log('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleChannelPress = (channel: Channel) => {
    navigation.navigate('ChannelDetail', {
      channelId: channel.id,
      channelName: channel.name,
    });
  };

  const handleSeeAllChannels = () => {
    navigation.navigate('Channels');
  };

  const handleNotifications = () => {
    // TODO: Navigate to notifications
  };

  const handleMessages = () => {
    navigation.navigate('Inbox');
  };

  const handleSearch = () => {
    navigation.navigate('Search', {});
  };

  const getUserDisplayName = () => {
    if (user?.realName) {
      const names = user.realName.split(' ');
      return `${names[0]} ${names[1]?.[0] || ''}. ${names[names.length - 1] || ''}`;
    }
    return user?.username || 'User';
  };

  const filteredChannels = selectedCategory === 'all' 
    ? channels 
    : channels.filter(c => c.category?.toLowerCase() === selectedCategory.toLowerCase());

  const renderChannelCard = ({ item }: { item: Channel }) => (
    <ChannelCard
      channel={item}
      onPress={() => handleChannelPress(item)}
      onBookmark={() => {}}
    />
  );

  const renderContributor = ({ item, index }: { item: LeaderboardUser; index: number }) => (
    <TouchableOpacity 
      style={styles.contributorItem}
      onPress={() => {
        // TODO: Navigate to user profile when UserProfileScreen is implemented
        console.log('View profile:', item.username);
      }}
    >
      <View style={styles.contributorRank}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>
      <UserAvatar
        username={item.username}
        avatarUrl={item.profilePictureUrl}
        size="large"
      />
      <Text style={styles.contributorName} numberOfLines={1}>
        {item.username}
      </Text>
      <Text style={styles.contributorKarma}>
        {item.totalKarma.toLocaleString()} karma
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with gradient */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>Hi, {getUserDisplayName()}</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton} onPress={handleNotifications}>
                <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleMessages}>
                <Ionicons name="chatbubble-outline" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for.."
            onFilterPress={() => {}}
            onPress={handleSearch}
            style={styles.searchBar}
          />
        </LinearGradient>

        {/* Popular/Trending Channels */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular/Trending Channels</Text>
            <TouchableOpacity onPress={handleSeeAllChannels} style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>SEE ALL</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <CategoryChips
            categories={CHANNEL_CATEGORIES}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            style={styles.categoryChips}
          />

          <FlatList
            data={filteredChannels}
            renderItem={renderChannelCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.channelList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No channels found</Text>
              </View>
            }
          />
        </View>

        {/* Top Contributors by Karma */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top contributors by karma</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>SEE ALL</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={topContributors}
            renderItem={renderContributor}
            keyExtractor={(item) => item.id.toString()}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contributorList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No contributors yet</Text>
              </View>
            }
          />
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
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
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    marginTop: SPACING.md,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  categoryChips: {
    marginBottom: SPACING.base,
  },
  channelList: {
    paddingHorizontal: SPACING.xl,
  },
  contributorList: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  contributorItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  contributorName: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
    maxWidth: 80,
    textAlign: 'center',
  },
  contributorKarma: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  contributorRank: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  rankText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.white,
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
  emptyContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default HomeScreen;
