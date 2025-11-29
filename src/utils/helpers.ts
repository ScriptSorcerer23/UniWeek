import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { Event } from '../types';

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

/**
 * Format time to readable string
 */
export const formatTime = (time: string): string => {
  return time;
};

/**
 * Check if event is upcoming
 */
export const isUpcoming = (eventDate: Date): boolean => {
  return isAfter(eventDate, new Date());
};

/**
 * Check if event is past
 */
export const isPast = (eventDate: Date): boolean => {
  return isBefore(eventDate, new Date());
};

/**
 * Check if event capacity is full
 */
export const isEventFull = (event: Event): boolean => {
  return event.registeredStudents.length >= event.capacity;
};

/**
 * Calculate available spots
 */
export const getAvailableSpots = (event: Event): number => {
  return event.capacity - event.registeredStudents.length;
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Calculate registration percentage
 */
export const getRegistrationPercentage = (event: Event): number => {
  return Math.round((event.registeredStudents.length / event.capacity) * 100);
};
