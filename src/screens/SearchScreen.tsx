import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import UserAvatar from '../components/UserAvatar';
import { searchService } from '../services/searchService';
import { messageService } from '../services';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import { RootStackParamList, Channel, Post, User } from '../types';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Search'>;
type SearchScreenRouteProp = RouteProp<RootStackParamList, 'Search'>;

interface SearchScreenProps {
  navigation: SearchScreenNavigationProp;
  route: SearchScreenRouteProp;
}

interface SearchResults {
  channels: Channel[];
  posts: Post[];
  users: User[];
}

type TabType = 'all' | 'channels' | 'posts' | 'users';

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation, route }) => {
  const initialQuery = route.params?.query || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [results, setResults] = useState<SearchResults>({ channels: [], posts: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults({ channels: [], posts: [], users: [] });
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const searchResults = await searchService.searchAll(query, 20);
      setResults(searchResults);
    } catch (error) {
      console.log('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else if (searchQuery.trim().length === 0) {
        setResults({ channels: [], posts: [], users: [] });
        setHasSearched(false);
      }
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [searchQuery, performSearch]);

  const handleChannelPress = (channel: Channel) => {
    navigation.navigate('ChannelDetail', {
      channelId: channel.id,
      channelName: channel.name,
    });
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetail', {
      postId: post.id,
      channelId: post.channelId,
    });
  };

  const handleUserPress = async (user: User) => {
    try {
      const conversation = await messageService.startConversation(user.username);
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        recipientUsername: user.username,
        recipientName: user.realName || user.username,
      });
    } catch (error) {
      console.log('Error starting conversation:', error);
      navigation.navigate('Inbox');
    }
  };

  const renderChannelItem = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleChannelPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: COLORS.primaryLight }]}>
        <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.resultMeta}>
          {item.subscriberCount?.toLocaleString() || 0} members • {item.category}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handlePostPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
        <Ionicons name="document-text" size={20} color={COLORS.success} />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          by {item.authorUsername} in {item.channelName || 'Channel'}
        </Text>
        <Text style={styles.resultMeta}>
          {item.upvoteCount || 0} upvotes • {item.commentCount || 0} comments
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
    >
      <UserAvatar
        username={item.username}
        avatarUrl={item.profilePictureUrl}
        size="medium"
      />
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>@{item.username}</Text>
        {item.realName && (
          <Text style={styles.resultSubtitle}>{item.realName}</Text>
        )}
        <Text style={styles.resultMeta}>
          {item.totalKarma?.toLocaleString() || 0} karma
        </Text>
      </View>
      <View style={styles.messageButton}>
        <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
        <Text style={styles.messageText}>Message</Text>
      </View>
    </TouchableOpacity>
  );

  const getFilteredResults = () => {
    switch (activeTab) {
      case 'channels':
        return { type: 'channels', data: results.channels };
      case 'posts':
        return { type: 'posts', data: results.posts };
      case 'users':
        return { type: 'users', data: results.users };
      default:
        return null;
    }
  };

  const renderAllResults = () => {
    const hasResults = results.channels.length > 0 || results.posts.length > 0 || results.users.length > 0;
    if (!hasResults && hasSearched && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={COLORS.gray300} />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try different keywords</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {results.channels.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Channels</Text>
                {results.channels.slice(0, 5).map((channel) => (
                  <View key={`channel-${channel.id}`}>
                    {renderChannelItem({ item: channel })}
                  </View>
                ))}
              </View>
            )}
            {results.posts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Posts</Text>
                {results.posts.slice(0, 5).map((post) => (
                  <View key={`post-${post.id}`}>
                    {renderPostItem({ item: post })}
                  </View>
                ))}
              </View>
            )}
            {results.users.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Users</Text>
                {results.users.slice(0, 5).map((user) => (
                  <View key={`user-${user.id}`}>
                    {renderUserItem({ item: user })}
                  </View>
                ))}
              </View>
            )}
          </>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  const renderFilteredResults = () => {
    const filtered = getFilteredResults();
    if (!filtered) return renderAllResults();
    const { type, data } = filtered;
    if (data.length === 0 && hasSearched && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={COLORS.gray300} />
          <Text style={styles.emptyText}>No {type} found</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={data as any[]}
        renderItem={({ item }) => {
          if (type === 'channels') return renderChannelItem({ item: item as Channel });
          if (type === 'posts') return renderPostItem({ item: item as Post });
          if (type === 'users') return renderUserItem({ item: item as User });
          return null;
        }}
        keyExtractor={(item) => `${type}-${item.id}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'channels', label: 'Channels' },
    { id: 'posts', label: 'Posts' },
    { id: 'users', label: 'Users' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Search */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search channels, posts, users..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => {
              Keyboard.dismiss();
              performSearch(searchQuery);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={COLORS.gray300} />
          <Text style={styles.emptyText}>Search CampusCircle</Text>
          <Text style={styles.emptySubtext}>
            Find channels, posts, and users
          </Text>
        </View>
      ) : activeTab === 'all' ? (
        renderAllResults()
      ) : (
        renderFilteredResults()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray100,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray400,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  messageText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});

export default SearchScreen;
