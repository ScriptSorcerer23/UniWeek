import { eventService } from './events';
import { Event, EventCategory, SocietyType } from '../types';
import { supabase } from './supabase';

export interface AIRecommendation {
  eventId: string;
  score: number;
  reason: string;
  event: Event;
}

export interface AIInsight {
  type: 'trend' | 'recommendation' | 'analysis';
  title: string;
  description: string;
  data?: any;
}

export interface EventRecommendationParams {
  userId: string;
  limit?: number;
  preferredCategories?: EventCategory[];
  preferredSocieties?: SocietyType[];
}

export interface FeedbackSentiment {
  eventId: string;
  averageRating: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyTopics: string[];
  summary: string;
  suggestions: string[];
}

export const aiService = {
  /**
   * Get personalized event recommendations for students
   */
  async getEventRecommendations(params: EventRecommendationParams): Promise<AIRecommendation[]> {
    const { userId, limit = 5 } = params;

    // Get user's registration history
    const userEvents = await eventService.getUserRegisteredEvents(userId);
    const upcomingEvents = await eventService.getEvents();

    // Get user's past registration patterns
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        events(society, category, title)
      `)
      .eq('user_id', userId);

    if (regError) throw regError;

    // Analyze user preferences
    const categoryPreferences = this.calculateCategoryPreferences(registrations || []);
    const societyPreferences = this.calculateSocietyPreferences(registrations || []);

    // Score upcoming events
    const recommendations: AIRecommendation[] = [];

    for (const event of upcomingEvents) {
      // Skip if user is already registered
      if (event.registeredStudents.includes(userId)) continue;

      // Skip past events
      if (event.date < new Date()) continue;

      let score = 0;
      let reason = '';

      // Category preference scoring (40% weight)
      const categoryScore = categoryPreferences[event.category] || 0;
      score += categoryScore * 0.4;
      
      if (categoryScore > 0.5) {
        reason += `You've shown interest in ${event.category} events. `;
      }

      // Society preference scoring (30% weight)
      const societyScore = societyPreferences[event.society] || 0;
      score += societyScore * 0.3;
      
      if (societyScore > 0.5) {
        reason += `You frequently attend ${event.society} events. `;
      }

      // Popularity scoring (20% weight) - events with good registration rates
      const capacityFillRate = event.registeredStudents.length / event.capacity;
      if (capacityFillRate > 0.3 && capacityFillRate < 0.8) {
        score += 0.2;
        reason += 'This event has good attendance but still has space. ';
      }

      // Diversity bonus (10% weight) - encourage trying new societies/categories
      if (!userEvents.some(ue => ue.society === event.society)) {
        score += 0.1;
        reason += `Try something new with ${event.society}! `;
      }

      if (score > 0.1) {
        recommendations.push({
          eventId: event.id,
          score,
          reason: reason.trim(),
          event,
        });
      }
    }

    // Sort by score and limit results
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  /**
   * Calculate category preferences based on user history
   */
  calculateCategoryPreferences(registrations: any[]): Record<EventCategory, number> {
    const preferences: Record<string, number> = {};
    const total = registrations.length;

    if (total === 0) return preferences as Record<EventCategory, number>;

    // Count category occurrences
    for (const reg of registrations) {
      const category = reg.events?.category;
      if (category) {
        preferences[category] = (preferences[category] || 0) + 1;
      }
    }

    // Normalize to 0-1 scale
    Object.keys(preferences).forEach(category => {
      preferences[category] = preferences[category] / total;
    });

    return preferences as Record<EventCategory, number>;
  },

  /**
   * Calculate society preferences based on user history
   */
  calculateSocietyPreferences(registrations: any[]): Record<SocietyType, number> {
    const preferences: Record<string, number> = {};
    const total = registrations.length;

    if (total === 0) return preferences as Record<SocietyType, number>;

    // Count society occurrences
    for (const reg of registrations) {
      const society = reg.events?.society;
      if (society) {
        preferences[society] = (preferences[society] || 0) + 1;
      }
    }

    // Normalize to 0-1 scale
    Object.keys(preferences).forEach(society => {
      preferences[society] = preferences[society] / total;
    });

    return preferences as Record<SocietyType, number>;
  },

  /**
   * Analyze feedback sentiment for events
   */
  async analyzeFeedbackSentiment(eventId: string): Promise<FeedbackSentiment> {
    const { data: feedbacks, error } = await supabase
      .from('registrations')
      .select('rating, feedback')
      .eq('event_id', eventId)
      .not('rating', 'is', null);

    if (error) throw error;

    const feedbackData = feedbacks || [];
    
    if (feedbackData.length === 0) {
      return {
        eventId,
        averageRating: 0,
        sentiment: 'neutral',
        keyTopics: [],
        summary: 'No feedback available',
        suggestions: [],
      };
    }

    // Calculate average rating
    const averageRating = feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length;

    // Determine sentiment based on rating
    let sentiment: 'positive' | 'neutral' | 'negative';
    if (averageRating >= 4) sentiment = 'positive';
    else if (averageRating >= 3) sentiment = 'neutral';
    else sentiment = 'negative';

    // Analyze text feedback (simplified keyword extraction)
    const allFeedback = feedbackData
      .filter(f => f.feedback)
      .map(f => f.feedback.toLowerCase())
      .join(' ');

    const keyTopics = this.extractKeyTopics(allFeedback);
    const summary = this.generateFeedbackSummary(averageRating, feedbackData.length, sentiment);
    const suggestions = this.generateImprovementSuggestions(sentiment, keyTopics, averageRating);

    return {
      eventId,
      averageRating: Math.round(averageRating * 10) / 10,
      sentiment,
      keyTopics,
      summary,
      suggestions,
    };
  },

  /**
   * Extract key topics from feedback text
   */
  extractKeyTopics(text: string): string[] {
    if (!text) return [];

    // Common positive and negative keywords
    const positiveKeywords = ['excellent', 'great', 'amazing', 'good', 'helpful', 'informative', 'engaging', 'fun'];
    const negativeKeywords = ['bad', 'boring', 'unclear', 'confusing', 'poor', 'disappointing', 'waste'];
    const topicKeywords = ['presentation', 'speaker', 'venue', 'organization', 'timing', 'content', 'food', 'networking'];

    const foundTopics: string[] = [];
    const words = text.split(/\s+/);

    // Find relevant keywords
    [...positiveKeywords, ...negativeKeywords, ...topicKeywords].forEach(keyword => {
      if (words.some(word => word.includes(keyword)) && !foundTopics.includes(keyword)) {
        foundTopics.push(keyword);
      }
    });

    return foundTopics.slice(0, 5); // Return top 5 topics
  },

  /**
   * Generate feedback summary
   */
  generateFeedbackSummary(averageRating: number, totalFeedbacks: number, sentiment: string): string {
    if (sentiment === 'positive') {
      return `Event received excellent feedback with ${averageRating.toFixed(1)}/5 stars from ${totalFeedbacks} participants. Most attendees had a positive experience.`;
    } else if (sentiment === 'neutral') {
      return `Event received mixed feedback with ${averageRating.toFixed(1)}/5 stars from ${totalFeedbacks} participants. There's room for improvement.`;
    } else {
      return `Event needs improvement with ${averageRating.toFixed(1)}/5 stars from ${totalFeedbacks} participants. Consider addressing participant concerns.`;
    }
  },

  /**
   * Generate improvement suggestions
   */
  generateImprovementSuggestions(sentiment: string, keyTopics: string[], averageRating: number): string[] {
    const suggestions: string[] = [];

    if (sentiment === 'negative' || averageRating < 3) {
      suggestions.push('Review event planning and organization');
      suggestions.push('Gather more detailed feedback from participants');
      suggestions.push('Consider changing venue or timing');
    }

    if (keyTopics.includes('speaker')) {
      suggestions.push('Improve speaker selection and preparation');
    }

    if (keyTopics.includes('venue')) {
      suggestions.push('Consider a better venue with improved facilities');
    }

    if (keyTopics.includes('timing')) {
      suggestions.push('Reconsider event timing and duration');
    }

    if (keyTopics.includes('content')) {
      suggestions.push('Enhance content quality and relevance');
    }

    if (sentiment === 'positive') {
      suggestions.push('Maintain current quality standards');
      suggestions.push('Consider organizing similar events');
    }

    return suggestions.slice(0, 4); // Return top 4 suggestions
  },

  /**
   * Generate insights for society analytics dashboard
   */
  async generateAnalyticsInsights(societyType?: SocietyType, userId?: string): Promise<AIInsight[]> {
    const analytics = await eventService.getEventAnalytics(societyType, userId);
    const insights: AIInsight[] = [];

    // Registration trend insight
    const recentTrends = analytics.registrationTrends.slice(-7);
    const trendDirection = this.calculateTrendDirection(recentTrends);
    
    if (trendDirection !== 'stable') {
      insights.push({
        type: 'trend',
        title: `Registration Trend: ${trendDirection}`,
        description: trendDirection === 'increasing' 
          ? 'Event registrations are growing! Your events are gaining popularity.'
          : 'Registration numbers are declining. Consider reviewing your event strategy.',
        data: { trend: trendDirection, data: recentTrends }
      });
    }

    // Popular event categories
    const topCategory = analytics.categoryDistribution
      .sort((a, b) => b.count - a.count)[0];
    
    if (topCategory) {
      insights.push({
        type: 'analysis',
        title: `Most Popular Category: ${topCategory.category}`,
        description: `${topCategory.category} events are your most successful with ${topCategory.count} events.`,
        data: topCategory
      });
    }

    // Participation rate analysis
    const societyParticipation = analytics.participationRates.find(p => p.society === societyType);
    if (societyParticipation) {
      const rateCategory = societyParticipation.rate >= 70 ? 'excellent' : 
                          societyParticipation.rate >= 50 ? 'good' : 'needs improvement';
      
      insights.push({
        type: 'analysis',
        title: `Participation Rate: ${societyParticipation.rate}%`,
        description: `Your events have ${rateCategory} attendance rates. ${this.getParticipationAdvice(societyParticipation.rate)}`,
        data: societyParticipation
      });
    }

    // Event recommendations for societies
    if (analytics.totalEvents > 5) {
      insights.push({
        type: 'recommendation',
        title: 'Event Strategy Recommendation',
        description: this.generateEventStrategyRecommendation(analytics),
        data: analytics
      });
    }

    return insights;
  },

  /**
   * Calculate trend direction from data points
   */
  calculateTrendDirection(dataPoints: { date: string; count: number; }[]): 'increasing' | 'decreasing' | 'stable' {
    if (dataPoints.length < 3) return 'stable';

    const recent = dataPoints.slice(-3).map(d => d.count);
    const earlier = dataPoints.slice(-6, -3).map(d => d.count);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

    const change = ((recentAvg - earlierAvg) / Math.max(earlierAvg, 1)) * 100;

    if (change > 20) return 'increasing';
    if (change < -20) return 'decreasing';
    return 'stable';
  },

  /**
   * Get participation advice based on rate
   */
  getParticipationAdvice(rate: number): string {
    if (rate >= 70) {
      return 'Keep up the excellent work!';
    } else if (rate >= 50) {
      return 'Consider promoting events more actively to increase attendance.';
    } else {
      return 'Review your event marketing strategy and timing to boost participation.';
    }
  },

  /**
   * Generate event strategy recommendation
   */
  generateEventStrategyRecommendation(analytics: any): string {
    const { averageRating } = analytics;

    if (averageRating >= 4.0) {
      return 'Your events are highly rated! Consider increasing event frequency to meet demand.';
    } else if (averageRating >= 3.0) {
      return 'Focus on improving event quality based on participant feedback to boost ratings.';
    } else {
      return 'Event quality needs significant improvement. Review feedback and revamp your approach.';
    }
  },

  /**
   * Auto-suggest event category based on title and description
   */
  async suggestEventCategory(title: string, description: string): Promise<EventCategory> {
    const keywords = {
      'Technical': ['workshop', 'coding', 'hackathon', 'tech', 'ai', 'ml', 'web', 'app', 'software', 'programming', 'development', 'javascript', 'python'],
      'Cultural': ['music', 'dance', 'art', 'cultural', 'performance', 'show', 'concert', 'drama', 'theater'],
      'Sports': ['sports', 'cricket', 'football', 'basketball', 'tournament', 'match', 'game', 'athletics', 'competition'],
      'Workshop': ['workshop', 'training', 'seminar', 'session', 'tutorial', 'learn', 'hands-on'],
      'Competition': ['competition', 'contest', 'challenge', 'hackathon', 'quiz', 'debate', 'championship'],
      'Seminar': ['seminar', 'lecture', 'talk', 'presentation', 'discussion', 'symposium'],
      'Social': ['meetup', 'networking', 'social', 'gathering', 'mixer', 'party', 'celebration'],
    };

    const text = `${title} ${description}`.toLowerCase();
    
    for (const [category, terms] of Object.entries(keywords)) {
      if (terms.some((term) => text.includes(term))) {
        return category as EventCategory;
      }
    }

    return 'Other';
  },

  /**
   * Get recommended event categories for societies
   */
  async getRecommendedCategories(societyType: SocietyType): Promise<EventCategory[]> {
    // Get all events for this society type
    const { data: events, error } = await supabase
      .from('events')
      .select('category, registered_students, capacity')
      .eq('society', societyType);

    if (error) throw error;

    // Calculate success rate by category
    const categoryStats = new Map<EventCategory, { total: number; success: number }>();

    (events || []).forEach((event: any) => {
      const category = event.category;
      const fillRate = (event.registered_students?.length || 0) / event.capacity;
      
      const stats = categoryStats.get(category) || { total: 0, success: 0 };
      stats.total += 1;
      if (fillRate > 0.6) stats.success += 1;
      
      categoryStats.set(category, stats);
    });

    // Get categories with high success rates
    const recommendations: EventCategory[] = [];
    categoryStats.forEach((stats, category) => {
      const successRate = stats.success / stats.total;
      if (successRate > 0.5 && stats.total >= 2) {
        recommendations.push(category);
      }
    });

    return recommendations;
  },

  /**
   * Suggest optimal event timing
   */
  async suggestOptimalTiming(societyType: SocietyType): Promise<{
    bestDaysOfWeek: string[];
    bestTimeSlots: string[];
    reasoning: string;
  }> {
    // Get successful events for this society
    const { data: events, error } = await supabase
      .from('events')
      .select('date, time, registered_students, capacity')
      .eq('society', societyType);

    if (error) throw error;

    const successfulEvents = (events || []).filter((event: any) => {
      const fillRate = (event.registered_students?.length || 0) / event.capacity;
      return fillRate > 0.6;
    });

    // Analyze timing patterns
    const dayAnalysis = new Map<string, number>();
    const timeAnalysis = new Map<string, number>();

    successfulEvents.forEach((event: any) => {
      const eventDate = new Date(event.date);
      const dayOfWeek = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      dayAnalysis.set(dayOfWeek, (dayAnalysis.get(dayOfWeek) || 0) + 1);
      
      const hour = parseInt(event.time.split(':')[0]);
      let timeSlot = '';
      if (hour >= 9 && hour < 12) timeSlot = 'Morning (9-12)';
      else if (hour >= 12 && hour < 17) timeSlot = 'Afternoon (12-17)';
      else timeSlot = 'Evening (17-20)';
      
      timeAnalysis.set(timeSlot, (timeAnalysis.get(timeSlot) || 0) + 1);
    });

    const bestDaysOfWeek = Array.from(dayAnalysis.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);

    const bestTimeSlots = Array.from(timeAnalysis.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([slot]) => slot);

    return {
      bestDaysOfWeek,
      bestTimeSlots,
      reasoning: `Based on ${successfulEvents.length} successful ${societyType} events, these timing patterns show the highest attendance rates.`,
    };
  },
};
