import React, { useState, useEffect, useCallback } from 'react';
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
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { SearchBar } from '../components';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context';
import { channelService, postService } from '../services';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { RootStackParamList, Post } from '../types';

type ChannelDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChannelDetail'>;
type ChannelDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChannelDetail'>;

interface ChannelDetailScreenProps {
  navigation: ChannelDetailScreenNavigationProp;
  route: ChannelDetailScreenRouteProp;
}

const ChannelDetailScreen: React.FC<ChannelDetailScreenProps> = ({ navigation, route }) => {
  const { channelId, channelName } = route.params;
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const channelPosts = await postService.getPostsByChannel(channelId);
      setPosts(channelPosts);
    } catch (error) {
      console.log('Error fetching channel posts:', error);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  // Auto-refresh posts when screen is focused (e.g., coming back from CreatePost)
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const handleVote = async (post: Post, voteValue: number) => {
    try {
      await postService.votePost(post.id, voteValue, user?.id, undefined, post.channelId);
      // Update local state
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          const wasUpvoted = p.userVote === 1;
          const wasDownvoted = p.userVote === -1;
          const newVote = p.userVote === voteValue ? null : voteValue;
          
          let upvoteChange = 0;
          let downvoteChange = 0;
          
          if (newVote === 1) {
            upvoteChange = 1;
            if (wasDownvoted) downvoteChange = -1;
          } else if (newVote === -1) {
            downvoteChange = 1;
            if (wasUpvoted) upvoteChange = -1;
          } else {
            if (wasUpvoted) upvoteChange = -1;
            if (wasDownvoted) downvoteChange = -1;
          }
          
          return {
            ...p,
            upvoteCount: p.upvoteCount + upvoteChange,
            downvoteCount: p.downvoteCount + downvoteChange,
            netScore: p.netScore + upvoteChange - downvoteChange,
            userVote: newVote,
          };
        }
        return p;
      }));
    } catch (error) {
      console.log('Vote failed:', error);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => handlePostPress(item)}
      activeOpacity={0.7}
    >
      <UserAvatar username={item.authorUsername} size="medium" />
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <Text style={styles.authorName} numberOfLines={1}>
            {item.authorUsername}
          </Text>
          <Text style={styles.postTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.postStats}>
          <TouchableOpacity 
            style={styles.voteButton}
            onPress={() => handleVote(item, 1)}
          >
            <Ionicons 
              name={item.userVote === 1 ? "arrow-up" : "arrow-up-outline"} 
              size={16} 
              color={item.userVote === 1 ? COLORS.primary : COLORS.textSecondary} 
            />
            <Text style={[styles.voteText, item.userVote === 1 && styles.voteActive]}>
              {item.upvoteCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.voteButton}
            onPress={() => handleVote(item, -1)}
          >
            <Ionicons 
              name={item.userVote === -1 ? "arrow-down" : "arrow-down-outline"} 
              size={16} 
              color={item.userVote === -1 ? COLORS.error : COLORS.textSecondary} 
            />
            <Text style={[styles.voteText, item.userVote === -1 && styles.voteDownActive]}>
              {item.downvoteCount}
            </Text>
          </TouchableOpacity>
          <View style={styles.commentCount}>
            <Ionicons name="chatbubble-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.commentText}>{item.commentCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{channelName}</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading posts...</Text>
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
        <Text style={styles.headerTitle}>{channelName}</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts in this channel yet</Text>
            <Text style={styles.emptySubtext}>Be the first to post!</Text>
          </View>
        }
      />

      {/* FAB - Create Post */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost', { channelId, channelName })}
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
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  postItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
  },
  postContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  authorName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  postTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  postTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  upvoteBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.sm,
  },
  upvoteText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
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
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  voteText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  voteActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  voteDownActive: {
    color: COLORS.error,
    fontWeight: '600',
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: 4,
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

export default ChannelDetailScreen;
