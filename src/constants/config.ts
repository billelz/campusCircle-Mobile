// API Configuration
// Use your local IP for physical device, 10.0.2.2 for Android emulator, localhost for iOS simulator
export const API_BASE_URL = 'http://192.168.1.143:8081/api';

// App Configuration
export const APP_NAME = 'CampusCircle';
export const APP_VERSION = '1.0.0';

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@campuscircle_access_token',
  REFRESH_TOKEN: '@campuscircle_refresh_token',
  USER_DATA: '@campuscircle_user_data',
  ONBOARDING_COMPLETED: '@campuscircle_onboarding_completed',
  REMEMBER_ME: '@campuscircle_remember_me',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Categories
export const CHANNEL_CATEGORIES = [
  { id: 'all', name: 'All', color: '#6B7280' },
  { id: 'academics', name: 'Academics', color: '#3366FF' },
  { id: 'campus_life', name: 'Campus Life', color: '#10B981' },
  { id: 'career', name: 'Career & Mentorship', color: '#F59E0B' },
  { id: 'mental_health', name: 'Mental Health', color: '#8B5CF6' },
  { id: 'social', name: 'Social', color: '#EC4899' },
  { id: 'general', name: 'General', color: '#6B7280' },
];

// Onboarding Slides - Images are optional, using placeholders
export const ONBOARDING_SLIDES = [
  {
    id: 1,
    title: 'Discuss Freely:',
    description: 'Join academic and social channels without revealing your real name.',
    image: null,
  },
  {
    id: 2,
    title: 'Stay Informed:',
    description: 'Explore trending topics and campus insights in real-time',
    image: null,
  },
  {
    id: 3,
    title: 'Build Reputation:',
    description: 'Earn karma, badges, and trust as a helpful community member.',
    image: null,
  },
];

// Validation Rules
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

export default {
  API_BASE_URL,
  APP_NAME,
  APP_VERSION,
  STORAGE_KEYS,
  DEFAULT_PAGE_SIZE,
  CHANNEL_CATEGORIES,
  ONBOARDING_SLIDES,
  VALIDATION,
};
