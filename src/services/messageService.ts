import api from '../api/client';
import { DirectMessage, Message, Conversation } from '../types/index';

export const messageService = {
  // Get all conversations for current user
  getMyConversations: async (currentUsername?: string): Promise<Conversation[]> => {
    try {
      const response = await api.get<DirectMessage[]>('/direct-messages/my');
      // Transform DirectMessage to Conversation format
      return response.data.map((dm: DirectMessage) => {
        // Determine the other participant (not the current user)
        const participants: string[] = dm.participants || [];
        // Filter out current user to get the other participant
        const otherParticipant: string = currentUsername
          ? participants.find((p: string) => p !== currentUsername) || participants[0] || 'Unknown'
          : participants[0] || 'Unknown';

        return {
          id: dm.id,
          participantUsername: otherParticipant,
          participantName: otherParticipant,
          lastMessage: dm.lastMessage?.text || '',
          lastMessageTime: dm.lastMessage?.timestamp || dm.updatedAt,
          unreadCount: dm.unreadCount || 0,
          avatarUrl: undefined,
        };
      });
    } catch (error) {
      console.log('Error fetching conversations:', error);
      return [];
    }
  },

  // Get conversation by ID
  getConversationById: async (id: string): Promise<DirectMessage> => {
    const response = await api.get<DirectMessage>(`/direct-messages/${id}`);
    const data: any = response.data as any;

    // Normalize message shape so each message has a stable `id` field
    const normalizedMessages: Message[] = (data.messages || []).map((m: any) => ({
      id: m.messageId || m.id || Math.random().toString(),
      sender: m.sender,
      text: m.text,
      mediaUrls: m.mediaUrls,
      timestamp: m.timestamp,
      readAt: m.readAt,
    }));

    return {
      ...data,
      messages: normalizedMessages,
    } as DirectMessage;
  },

  // Get conversation between current user and another user
  getConversationWith: async (otherUsername: string): Promise<DirectMessage | null> => {
    try {
      const response = await api.get<DirectMessage>('/direct-messages/with', {
        params: { username: otherUsername },
      });
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Start a new conversation with a user
  startConversation: async (recipientUsername: string): Promise<DirectMessage> => {
    const response = await api.post<DirectMessage>('/direct-messages/start', {
      recipientUsername,
    });
    return response.data;
  },

  // Send message to a conversation
  sendMessage: async (
    conversationId: string,
    text: string,
    mediaUrls?: string[]
  ): Promise<Message> => {
    const response = await api.post<Message>(
      `/direct-messages/${conversationId}/messages`,
      { text, mediaUrls }
    );
    return response.data;
  },

  // Send message to a user (starts conversation if needed)
  sendMessageToUser: async (
    recipientUsername: string,
    text: string,
    mediaUrls?: string[]
  ): Promise<DirectMessage> => {
    const response = await api.post<DirectMessage>('/direct-messages/send', {
      recipientUsername,
      text,
      mediaUrls,
    });
    return response.data;
  },

  // Mark conversation as read
  markAsRead: async (conversationId: string): Promise<void> => {
    await api.post(`/direct-messages/${conversationId}/read`);
  },

  // Get unread count for current user
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get<{ unreadCount: number }>('/direct-messages/unread-count');
      return response.data.unreadCount;
    } catch (error) {
      return 0;
    }
  },

  // Delete a message
  deleteMessage: async (conversationId: string, messageId: string): Promise<void> => {
    await api.delete(`/direct-messages/${conversationId}/messages/${messageId}`);
  },
};

export default messageService;
