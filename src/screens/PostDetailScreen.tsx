import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Post, Comment } from '../types';
import { postService, commentService } from '../services';
import { useAuth } from '../context';
import UserAvatar from '../components/UserAvatar';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

const PostDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { postId } = route.params;
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userVote, setUserVote] = useState<number | null>(null);

  const fetchPostData = useCallback(async () => {
    try {
      const [postData, commentsData] = await Promise.all([
        postService.getPostById(postId),
        commentService.getCommentsByPostId(postId),
      ]);
      setPost(postData);
      setComments(commentsData);
      setUserVote(postData.userVote || null);
    } catch (error) {
      console.log('Error fetching post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPostData();
    setRefreshing(false);
  };

  const handleVote = async (voteValue: number) => {
    if (!post) return;
    
    const newVote = userVote === voteValue ? 0 : voteValue;
    
    // Optimistic update
    const previousVote = userVote;
    setUserVote(newVote === 0 ? null : newVote);
    
    let newUpvotes = post.upvoteCount;
    let newDownvotes = post.downvoteCount;
    
    if (previousVote === 1) newUpvotes--;
    if (previousVote === -1) newDownvotes--;
    if (newVote === 1) newUpvotes++;
    if (newVote === -1) newDownvotes++;
    
    setPost({
      ...post,
      upvoteCount: newUpvotes,
      downvoteCount: newDownvotes,
      netScore: newUpvotes - newDownvotes,
    });

    try {
      await postService.votePost(postId, newVote, user?.id, undefined, post.channelId);
    } catch (error) {
      // Revert on error
      setUserVote(previousVote);
      setPost(post);
      console.log('Vote error:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const comment = await commentService.createComment({
        postId,
        content: newComment.trim(),
      });
      setComments([comment, ...comments]);
      setNewComment('');
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePost = async () => {
    if (!post || !user) return;
    
    try {
      if (post.isSaved) {
        await postService.unsavePost(postId, user.id);
      } else {
        await postService.savePost(postId, user.id, user.username, post.title, post.channelId, post.channelName);
      }
      setPost({ ...post, isSaved: !post.isSaved });
    } catch (error) {
      console.log('Save error:', error);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderComment = (comment: Comment) => (
    <View key={comment.id} style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <UserAvatar username={comment.authorUsername} size="small" />
        <View style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>{comment.authorUsername}</Text>
          <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="arrow-up-outline" size={16} color={COLORS.gray500} />
          <Text style={styles.commentActionText}>{comment.upvoteCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="arrow-down-outline" size={16} color={COLORS.gray500} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.gray500} />
          <Text style={styles.commentActionText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Post not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {post.channelName || 'Post'}
          </Text>
          {/* Only show save button if post is not already saved */}
          {!post.isSaved ? (
            <TouchableOpacity onPress={handleSavePost} style={styles.saveButton}>
              <Ionicons 
                name="bookmark-outline" 
                size={24} 
                color={COLORS.textPrimary} 
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.saveButton} />
          )}
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Post Content */}
          <View style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <UserAvatar username={post.authorUsername} size="medium" />
              <View style={styles.postMeta}>
                <Text style={styles.authorName}>{post.authorUsername}</Text>
                <Text style={styles.postTime}>
                  {formatTimeAgo(post.createdAt)}
                  {post.channelName && ` in ${post.channelName}`}
                </Text>
              </View>
            </View>

            {/* Post Title */}
            <Text style={styles.postTitle}>{post.title}</Text>

            {/* Post Body */}
            {post.content && (
              <Text style={styles.postContent}>{post.content}</Text>
            )}

            {/* Post Stats & Actions */}
            <View style={styles.postActions}>
              <View style={styles.voteContainer}>
                <TouchableOpacity 
                  onPress={() => handleVote(1)}
                  style={[styles.voteButton, userVote === 1 && styles.voteActive]}
                >
                  <Ionicons 
                    name={userVote === 1 ? "arrow-up" : "arrow-up-outline"} 
                    size={20} 
                    color={userVote === 1 ? COLORS.success : COLORS.gray500} 
                  />
                </TouchableOpacity>
                <Text style={[
                  styles.voteCount, 
                  userVote === 1 && styles.voteCountUp,
                  userVote === -1 && styles.voteCountDown,
                ]}>
                  {post.netScore}
                </Text>
                <TouchableOpacity 
                  onPress={() => handleVote(-1)}
                  style={[styles.voteButton, userVote === -1 && styles.voteActive]}
                >
                  <Ionicons 
                    name={userVote === -1 ? "arrow-down" : "arrow-down-outline"} 
                    size={20} 
                    color={userVote === -1 ? COLORS.error : COLORS.gray500} 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.gray500} />
                <Text style={styles.actionText}>{post.commentCount}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-social-outline" size={20} color={COLORS.gray500} />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({comments.length})
            </Text>
            {comments.length === 0 ? (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to share your thoughts!</Text>
              </View>
            ) : (
              comments.map(renderComment)
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <UserAvatar username={user?.username || ''} size="small" />
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor={COLORS.gray400}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity 
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            style={[
              styles.sendButton,
              (!newComment.trim() || submitting) && styles.sendButtonDisabled
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray600,
    marginBottom: SPACING.base,
  },
  backLink: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  saveButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  postCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  postMeta: {
    marginLeft: SPACING.sm,
  },
  authorName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  postTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginTop: 2,
  },
  postTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.xl * 1.3,
  },
  postContent: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.base * 1.6,
    marginBottom: SPACING.base,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    gap: SPACING.lg,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs,
  },
  voteButton: {
    padding: SPACING.sm,
  },
  voteActive: {
    backgroundColor: 'transparent',
  },
  voteCount: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  voteCountUp: {
    color: COLORS.success,
  },
  voteCountDown: {
    color: COLORS.error,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  commentsSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
  },
  commentsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.base,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noCommentsText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.gray500,
  },
  noCommentsSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    marginTop: SPACING.xs,
  },
  commentCard: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  commentMeta: {
    marginLeft: SPACING.sm,
  },
  commentAuthor: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  commentTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
  },
  commentContent: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.base * 1.5,
    marginLeft: 40, // Align with avatar
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 40,
    marginTop: SPACING.sm,
    gap: SPACING.base,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  commentActionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    gap: SPACING.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.sm,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
});

export default PostDetailScreen;
