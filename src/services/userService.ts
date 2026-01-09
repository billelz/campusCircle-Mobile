import api from '../api/client';
import { User, LeaderboardUser, Badge } from '../types';

export const userService = {
  // Get current user's profile
  getMyProfile: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Get user profile by username
  getUserProfile: async (username: string): Promise<User> => {
    const response = await api.get(`/users/profile/${username}`);
    return response.data;
  },

  // Update current user's profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  // Get leaderboard (top karma users)
  getLeaderboard: async (limit: number = 10): Promise<LeaderboardUser[]> => {
    try {
      const response = await api.get('/karma/leaderboard', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      // If leaderboard endpoint doesn't exist, return empty array
      console.log('Leaderboard endpoint not available');
      return [];
    }
  },

  // Get user's karma details
  getKarma: async (userId: number): Promise<{ totalKarma: number; postKarma: number; commentKarma: number }> => {
    try {
      const response = await api.get(`/karma/${userId}`);
      return response.data;
    } catch (error) {
      return { totalKarma: 0, postKarma: 0, commentKarma: 0 };
    }
  },

  // Get user's badges
  getUserBadges: async (userId: number): Promise<Badge[]> => {
    try {
      const response = await api.get(`/badges/user/${userId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  // Get all available badges
  getAllBadges: async (): Promise<Badge[]> => {
    try {
      const response = await api.get('/badges');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  // Block a user
  blockUser: async (blockedUsername: string): Promise<void> => {
    await api.post('/blocks', { blockedUsername });
  },

  // Unblock a user
  unblockUser: async (blockedUsername: string): Promise<void> => {
    await api.delete(`/blocks/${blockedUsername}`);
  },

  // Get blocked users
  getBlockedUsers: async (): Promise<string[]> => {
    try {
      const response = await api.get('/blocks');
      return response.data;
    } catch (error) {
      return [];
    }
  },
};

export default userService;
