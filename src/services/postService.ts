import api from '../api/client';
import { Post, PostRequest, Comment, CommentRequest, VoteRequest, VoteResponse } from '../types/index';

export const postService = {
  // Get all posts (feed)
  getAllPosts: async (): Promise<Post[]> => {
    const response = await api.get<Post[]>('/posts');
    return response.data;
  },

  // Get posts by channel
  getPostsByChannel: async (channelId: number): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/posts/channel/${channelId}`);
    return response.data;
  },

  // Get post by ID
  getPostById: async (id: number): Promise<Post> => {
    const response = await api.get<Post>(`/posts/${id}`);
    return response.data;
  },

  // Create new post
  createPost: async (post: PostRequest): Promise<Post> => {
    const response = await api.post<Post>('/posts', post);
    return response.data;
  },

  // Update post
  updatePost: async (id: number, post: Partial<PostRequest>): Promise<Post> => {
    const response = await api.put<Post>(`/posts/${id}`, post);
    return response.data;
  },

  // Delete post
  deletePost: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  // Vote on post (upvote/downvote)
  votePost: async (postId: number, voteValue: number, userId?: number, authorUserId?: number, channelId?: number): Promise<VoteResponse> => {
    const response = await api.post<VoteResponse>('/votes', {
      contentId: postId,
      contentTypeString: 'POST',  // Send as string for backend parsing
      voteValue,
      userId,
      authorUserId,
      channelId,
    });
    return response.data;
  },

  // Save post
  savePost: async (postId: number, userId?: number, username?: string, postTitle?: string, channelId?: number, channelName?: string): Promise<void> => {
    await api.post('/saved-posts/save', {
      postId,
      userId,
      username,
      postTitle,
      channelId,
      channelName,
      folder: 'default'
    });
  },

  // Unsave post
  unsavePost: async (postId: number, userId?: number): Promise<void> => {
    await api.delete('/saved-posts/unsave', {
      params: { userId, postId }
    });
  },

  // Get saved posts for current user
  getSavedPosts: async (username: string): Promise<Post[]> => {
    try {
      const savedResponse = await api.get(`/saved-posts/username/${username}`);
      if (savedResponse.data && savedResponse.data.savedItems) {
        const postIds = savedResponse.data.savedItems.map((item: any) => item.postId);
        // Fetch full post details
        const posts: Post[] = [];
        for (const id of postIds) {
          try {
            const postResponse = await api.get(`/posts/${id}`);
            posts.push(postResponse.data);
          } catch (e) {
            // Post may have been deleted
          }
        }
        return posts;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  // Get trending posts
  getTrendingPosts: async (limit: number = 10): Promise<Post[]> => {
    try {
      const response = await api.get<Post[]>('/posts/trending', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      // Fallback to getting all posts sorted by score
      const response = await api.get<Post[]>('/posts');
      return response.data
        .sort((a, b) => (b.netScore || 0) - (a.netScore || 0))
        .slice(0, limit);
    }
  },

  // Get posts by user
  getPostsByUser: async (username: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/posts/user/${username}`);
    return response.data;
  },

  // Search posts
  searchPosts: async (query: string): Promise<Post[]> => {
    const response = await api.get<Post[]>('/posts/search', {
      params: { q: query }
    });
    return response.data;
  },
};

export const commentService = {
  // Get comments for post
  getCommentsByPostId: async (postId: number): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(`/comments/post/${postId}`);
    return response.data;
  },

  // Create comment
  createComment: async (comment: CommentRequest): Promise<Comment> => {
    const response = await api.post<Comment>('/comments', comment);
    return response.data;
  },

  // Update comment
  updateComment: async (id: number, content: string): Promise<Comment> => {
    const response = await api.put<Comment>(`/comments/${id}`, { content });
    return response.data;
  },

  // Delete comment
  deleteComment: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },

  // Vote on comment
  voteComment: async (commentId: number, voteValue: number): Promise<VoteResponse> => {
    const response = await api.post<VoteResponse>('/votes', {
      contentId: commentId,
      contentType: 'COMMENT',
      voteValue,
    } as VoteRequest);
    return response.data;
  },

  // Get replies to a comment
  getReplies: async (commentId: number): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(`/comments/${commentId}/replies`);
    return response.data;
  },
};

export default { postService, commentService };
