import { SocietyType } from '../types';

export const SOCIETY_COLORS = {
  ACM: '#2196F3', // Blue
  CLS: '#4CAF50', // Green
  CSS: '#FF9800', // Orange
};

export const EVENT_CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Competition',
  'Other',
];

export const APP_THEME = {
  colors: {
    primary: '#6200EE',
    accent: '#03DAC6',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    error: '#B00020',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
};

export const NOTIFICATION_CHANNELS = {
  EVENT_REMINDERS: 'event-reminders',
  SOCIETY_UPDATES: 'society-updates',
};
