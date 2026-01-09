import api from '../api/client';
import { Channel, Post, User } from '../types';

export interface SearchResults {
  channels: Channel[];
  posts: Post[];
  users: User[];
}

export const searchService = {
  // Unified search - search all types
  searchAll: async (query: string, limit: number = 10): Promise<SearchResults> => {
    if (!query.trim()) {
      return { channels: [], posts: [], users: [] };
    }
    const response = await api.get<SearchResults>('/search', {
      params: { q: query, type: 'all', limit }
    });
    return response.data;
  },

  // Search only channels
  searchChannels: async (query: string, limit: number = 20): Promise<Channel[]> => {
    if (!query.trim()) return [];
    const response = await api.get<Channel[]>('/search/channels', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Search only posts
  searchPosts: async (query: string, limit: number = 20): Promise<Post[]> => {
    if (!query.trim()) return [];
    const response = await api.get<Post[]>('/search/posts', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Search only users
  searchUsers: async (query: string, limit: number = 20): Promise<User[]> => {
    if (!query.trim()) return [];
    const response = await api.get<User[]>('/search/users', {
      params: { q: query, limit }
    });
    return response.data;
  },
};

export default searchService;
