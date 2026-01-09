import api from '../api/client';
import { Channel, ChannelRequest, Subscription } from '../types';

export const channelService = {
  // Get all channels
  getAllChannels: async (): Promise<Channel[]> => {
    const response = await api.get<Channel[]>('/channels');
    return response.data;
  },

  // Get channel by ID
  getChannelById: async (id: number): Promise<Channel> => {
    const response = await api.get<Channel>(`/channels/${id}`);
    return response.data;
  },

  // Create new channel
  createChannel: async (channel: ChannelRequest): Promise<Channel> => {
    const response = await api.post<Channel>('/channels', channel);
    return response.data;
  },

  // Update channel
  updateChannel: async (id: number, channel: Partial<ChannelRequest>): Promise<Channel> => {
    const response = await api.put<Channel>(`/channels/${id}`, channel);
    return response.data;
  },

  // Delete channel
  deleteChannel: async (id: number): Promise<void> => {
    await api.delete(`/channels/${id}`);
  },

  // Get my subscribed channels
  getMySubscriptions: async (): Promise<Channel[]> => {
    try {
      const response = await api.get<Channel[]>('/channels/subscriptions');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        // User not authenticated, return empty array
        return [];
      }
      throw error;
    }
  },

  // Subscribe to channel
  subscribe: async (channelId: number): Promise<void> => {
    await api.post(`/channels/${channelId}/subscribe`);
  },

  // Unsubscribe from channel
  unsubscribe: async (channelId: number): Promise<void> => {
    await api.delete(`/channels/${channelId}/subscribe`);
  },

  // Get channels by category
  getChannelsByCategory: async (category: string): Promise<Channel[]> => {
    const response = await api.get<Channel[]>('/channels', {
      params: { category }
    });
    return response.data;
  },

  // Search channels
  searchChannels: async (query: string): Promise<Channel[]> => {
    const response = await api.get<Channel[]>('/channels/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Get trending/popular channels
  getTrendingChannels: async (limit: number = 10): Promise<Channel[]> => {
    try {
      const response = await api.get<Channel[]>('/channels/trending', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      // Fallback to getting all channels sorted by subscribers
      const response = await api.get<Channel[]>('/channels');
      return response.data
        .sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0))
        .slice(0, limit);
    }
  },
};

export default channelService;
