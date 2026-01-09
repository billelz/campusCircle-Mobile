import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SearchBar, ChannelCard, TabBar } from '../components';
import { useAuth } from '../context';
import { channelService } from '../services';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList, MainTabParamList, Channel } from '../types';

type ChannelsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Channels'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface ChannelsScreenProps {
  navigation: ChannelsScreenNavigationProp;
}

const tabs = [
  { id: 'joined', label: 'Joined' },
  { id: 'explore', label: 'Explore' },
];

const ChannelsScreen: React.FC<ChannelsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('joined');
  const [searchQuery, setSearchQuery] = useState('');
  const [joinedChannels, setJoinedChannels] = useState<Channel[]>([]);
  const [exploreChannels, setExploreChannels] = useState<Channel[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchChannels = async () => {
    try {
      // Fetch both subscribed and all channels in parallel
      const [subscribed, allChannels] = await Promise.all([
        channelService.getMySubscriptions(),
        channelService.getAllChannels(),
      ]);
      
      // Set joined channels (user's subscriptions)
      setJoinedChannels(subscribed.map(c => ({ ...c, isSubscribed: true })));
      
      // Set explore channels (exclude already subscribed)
      const subscribedIds = new Set(subscribed.map(c => c.id));
      setExploreChannels(
        allChannels
          .filter(c => !subscribedIds.has(c.id))
          .map(c => ({ ...c, isSubscribed: false }))
      );
    } catch (error) {
      console.log('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChannels();
    setRefreshing(false);
  };

  const handleChannelPress = (channel: Channel) => {
    navigation.navigate('ChannelDetail', {
      channelId: channel.id,
      channelName: channel.name,
    });
  };

  const handleSubscribe = async (channel: Channel) => {
    if (!user) return;
    
    try {
      if (channel.isSubscribed) {
        await channelService.unsubscribe(channel.id);
        // Move from joined to explore
        setJoinedChannels(prev => prev.filter(c => c.id !== channel.id));
        setExploreChannels(prev => [...prev, { ...channel, isSubscribed: false }]);
      } else {
        await channelService.subscribe(channel.id);
        // Move from explore to joined
        setExploreChannels(prev => prev.filter(c => c.id !== channel.id));
        setJoinedChannels(prev => [...prev, { ...channel, isSubscribed: true }]);
      }
    } catch (error) {
      console.log('Subscription action failed:', error);
    }
  };

  const currentChannels = activeTab === 'joined' ? joinedChannels : exploreChannels;
  const filteredChannels = currentChannels.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChannelItem = ({ item }: { item: Channel }) => (
    <ChannelCard
      channel={item}
      onPress={() => handleChannelPress(item)}
      onBookmark={() => handleSubscribe(item)}
      compact
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading channels...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Channels</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="type channel name....."
          onFilterPress={() => {}}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      {/* Channel List */}
      <FlatList
        data={filteredChannels}
        renderItem={renderChannelItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No channels found</Text>
          </View>
        }
      />

      {/* FAB - Create Channel */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateChannel')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  tabContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  listContent: {
    padding: SPACING.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
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
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
    elevation: 5,
  },
});

export default ChannelsScreen;
