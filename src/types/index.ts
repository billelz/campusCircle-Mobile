// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  realName?: string;
  profilePictureUrl?: string;
  bio?: string;
  universityId?: number;
  universityName?: string;
  graduationYear?: number;
  major?: string;
  verificationStatus?: string;
  isVerified?: boolean;
  totalKarma?: number;
  postKarma?: number;
  commentKarma?: number;
  postCount?: number;
  commentCount?: number;
  badges?: Badge[];
  profileVisibility?: 'PUBLIC' | 'UNIVERSITY' | 'PRIVATE';
  createdAt?: string;
  isOnline?: boolean;
  lastActive?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
    username: string;
    email: string;
    realName?: string;
    universityId?: number;
    universityName?: string;
    verificationStatus?: string;
  };
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  universityId?: number;
  realName?: string;
}

// Channel Types
export type ChannelCategory = 
  | 'ACADEMICS'
  | 'MENTAL_HEALTH'
  | 'CAREER'
  | 'CAMPUS_LIFE'
  | 'SOCIAL'
  | 'ENTERTAINMENT'
  | 'MARKETPLACE'
  | 'META'
  | 'GENERAL';

export interface Channel {
  id: number;
  name: string;
  description: string;
  rules?: string;
  universityId?: number;
  universityName?: string;
  createdByUsername?: string;
  subscriberCount: number;
  category?: ChannelCategory | string;
  isActive?: boolean;
  isSubscribed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChannelRequest {
  name: string;
  description: string;
  rules?: string;
  universityId?: number;
  category: ChannelCategory;
}

// Post Types
export interface PollOption {
  text: string;
  votes: number;
}

export interface PollData {
  question: string;
  options: PollOption[];
  totalVotes: number;
  expiresAt?: string;
  hasVoted?: boolean;
  userVoteIndex?: number;
}

export interface Post {
  id: number;
  authorUsername: string;
  channelId: number;
  channelName?: string;
  channelCategory?: string;
  title: string;
  content?: string;
  mediaUrls?: string[];
  poll?: PollData;
  upvoteCount: number;
  downvoteCount: number;
  netScore: number;
  commentCount: number;
  viewCount?: number;
  isPinned?: boolean;
  isLocked?: boolean;
  isSaved?: boolean;
  userVote?: number | null; // 1, -1, or null/undefined
  createdAt: string;
  editedAt?: string;
}

export interface PostRequest {
  channelId: number;
  title: string;
  content?: string;
  mediaUrls?: string[];
  poll?: {
    question: string;
    options: string[];
    expiresInHours?: number;
  };
}

// Comment Types
export interface Comment {
  id: number;
  postId: number;
  parentCommentId?: number;
  authorUsername: string;
  content: string;
  mediaUrls?: string[];
  upvoteCount: number;
  downvoteCount: number;
  replyCount: number;
  isDeleted?: boolean;
  createdAt: string;
  editedAt?: string;
  replies?: Comment[];
}

export interface CommentRequest {
  postId: number;
  parentCommentId?: number;
  content: string;
  mediaUrls?: string[];
}

// Vote Types
export interface VoteRequest {
  contentId: number;
  contentType: 'POST' | 'COMMENT';
  voteValue: number; // 1 or -1
}

export interface VoteResponse {
  status: 'voted' | 'removed';
  newVoteCount: number;
  vote?: {
    id: number;
    voteValue: number;
  };
}

// Direct Message Types
export interface DirectMessage {
  id: string;
  conversationId: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  mediaUrls?: string[];
  timestamp: string;
  readAt?: string;
}

export interface Conversation {
  id: string;
  participantUsername: string;
  participantName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatarUrl?: string;
}

// Karma Types
export interface Karma {
  userId: number;
  totalKarma: number;
  postKarma: number;
  commentKarma: number;
  karmaByChannel?: { [channelId: string]: number };
}

// Badge Types
export interface Badge {
  id: number;
  userId: number;
  badgeType: string;
  badgeName?: string;
  badgeIcon?: string;
  earnedAt: string;
}

// Subscription Types
export interface Subscription {
  id: number;
  userId: number;
  channelId: number;
  notificationEnabled?: boolean;
  subscribedAt: string;
}

// University Types
export interface University {
  id: number;
  name: string;
  domain: string;
  location?: string;
  studentCount?: number;
  activeStatus?: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  userId: number;
  type: 'reply' | 'mention' | 'upvote' | 'trending' | 'message' | 'badge';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// Leaderboard Types
export interface LeaderboardUser {
  id: number;
  username: string;
  profilePictureUrl?: string;
  totalUpvotes?: number;
  totalKarma?: number;
  postKarma?: number;
  commentKarma?: number;
  rank?: number;
}

// Onboarding Types
export interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  image: any;
}

// Navigation Types
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  ChannelDetail: { channelId: number; channelName: string };
  PostDetail: { postId: number; channelId?: number };
  CreatePost: { channelId?: number; channelName?: string };
  CreateChannel: undefined;
  Chat: { conversationId?: string; recipientUsername?: string; recipientName?: string; participantName?: string };
  UserProfile: { username: string };
  Settings: undefined;
  SavedPosts: undefined;
  Search: { query?: string };
  Inbox: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Channels: undefined;
  Inbox: undefined;
  SavedPosts: undefined;
  Profile: undefined;
};

// API Response Types
export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
