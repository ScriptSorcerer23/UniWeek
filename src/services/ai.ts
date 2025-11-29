import { eventService } from './events';
import { Event, EventCategory, SocietyType } from '../types';
import { supabase } from './supabase';

// Groq Llama 70B Integration
// TODO: Replace 'YOUR_GROQ_API_KEY_HERE' with your actual Groq API key from https://console.groq.com
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

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
   * Call Groq Llama 70B API for advanced AI processing
   */
  async callGroqAPI(prompt: string, systemPrompt: string = ''): Promise<string> {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data: GroqResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq API call failed:', error);
      return '';
    }
  },

  /**
   * Get personalized event recommendations for students using AI
   */
  async getEventRecommendations(params: EventRecommendationParams): Promise<AIRecommendation[]> {
    const { userId, limit = 5 } = params;

    try {
      // Get user's registration history and upcoming events
      const userEvents = await eventService.getUserRegisteredEvents(userId);
      const upcomingEvents = await eventService.getEvents();

      // Get user's past registration patterns with ratings
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select(`
          *,
          events(society, category, title)
        `)
        .eq('user_id', userId);

      if (regError) {
        console.error('Error fetching user registrations:', regError);
        return [];
      }

      // Filter available events (not registered + upcoming)
      const availableEvents = upcomingEvents.filter(event => 
        !userEvents.some(ue => ue.id === event.id) && 
        new Date(event.date) > new Date()
      );

      // Use AI for advanced recommendations if user has history
      const userHistory = registrations?.map(reg => 
        `${reg.events?.title} (${reg.events?.category}, ${reg.events?.society}) - Rating: ${reg.rating || 'N/A'}`
      ).join(', ') || '';

      if (userHistory && availableEvents.length > 0) {
        const eventsList = availableEvents.map((event, idx) => 
          `${idx + 1}. ${event.title} - ${event.category} by ${event.society}`
        ).join('\\n');

        const systemPrompt = `You are an AI assistant for university event recommendations. Analyze user preferences and recommend relevant events.`;
        
        const prompt = `User's event history: ${userHistory}

Available events:
${eventsList}

Recommend the top ${limit} events. Return only numbers separated by commas (e.g., 1,3,5).`;

        const aiResponse = await this.callGroqAPI(prompt, systemPrompt);
        
        // Parse AI response
        const recommendedIndices = aiResponse
          .split(',')
          .map(s => parseInt(s.trim()) - 1)
          .filter(i => i >= 0 && i < availableEvents.length)
          .slice(0, limit);

        if (recommendedIndices.length > 0) {
          return recommendedIndices.map((i, index) => ({
            eventId: availableEvents[i].id,
            score: (recommendedIndices.length - index) * 20,
            reason: `AI-recommended based on your preferences`,
            event: availableEvents[i]
          }));
        }
      }

      // Fallback to algorithm-based recommendations
      return this.getFallbackRecommendations(userId, availableEvents, registrations || []);

    } catch (error) {
      console.error('AI recommendation failed:', error);
      return [];
    }
  },

  /**
   * Fallback algorithm-based recommendations
   */
  getFallbackRecommendations(userId: string, events: Event[], registrations: any[]): AIRecommendation[] {
    const categoryPrefs = this.calculateCategoryPreferences(registrations);
    const recommendations: AIRecommendation[] = [];

    for (const event of events) {
      let score = 50; // Base score
      const categoryScore = categoryPrefs[event.category] || 0;
      score += categoryScore * 30;

      recommendations.push({
        eventId: event.id,
        score,
        reason: 'Recommended for you',
        event
      });
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  },

  /**
   * Calculate category preferences from user history
   */
  calculateCategoryPreferences(registrations: any[]): Record<string, number> {
    const preferences: Record<string, number> = {};
    const total = registrations.length;

    if (total === 0) return preferences;

    for (const reg of registrations) {
      const category = reg.events?.category;
      if (category) {
        preferences[category] = (preferences[category] || 0) + 1;
      }
    }

    // Normalize to 0-1 scale
    for (const category in preferences) {
      preferences[category] = preferences[category] / total;
    }

    return preferences;
  },

  /**
   * AI-powered event category suggestion using Groq
   */
  async suggestEventCategory(title: string, description: string): Promise<EventCategory> {
    try {
      const systemPrompt = `You are an expert at categorizing university events. Available categories: Technical, Cultural, Sports, Workshop, Competition, Other.`;
      
      const prompt = `Categorize this event:
Title: ${title}
Description: ${description}

Return only the category name: Technical, Cultural, Sports, Workshop, Competition, or Other`;

      const aiResponse = await this.callGroqAPI(prompt, systemPrompt);
      
      const validCategories: EventCategory[] = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Competition', 'Other'];
      const suggested = aiResponse.trim() as EventCategory;
      
      if (validCategories.includes(suggested)) {
        return suggested;
      }
    } catch (error) {
      console.error('AI category suggestion failed:', error);
    }

    // Fallback to keyword matching
    return this.getFallbackCategory(title, description);
  },

  /**
   * Fallback category suggestion using keywords
   */
  getFallbackCategory(title: string, description: string): EventCategory {
    const text = (title + ' ' + description).toLowerCase();
    const categories = {
      Technical: ['code', 'programming', 'tech', 'software', 'web', 'app', 'ai', 'hackathon'],
      Cultural: ['cultural', 'art', 'music', 'dance', 'drama', 'poetry', 'literature', 'debate'],
      Sports: ['sports', 'cricket', 'football', 'basketball', 'tournament', 'match'],
      Workshop: ['workshop', 'training', 'learn', 'hands-on', 'tutorial', 'session'],
      Competition: ['competition', 'contest', 'challenge', 'quiz', 'championship']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category as EventCategory;
      }
    }
    
    return 'Other';
  },

  /**
   * Advanced feedback sentiment analysis using Groq AI
   */
  async analyzeFeedbackSentiment(feedbacks: string[], eventId: string): Promise<FeedbackSentiment> {
    if (feedbacks.length === 0) {
      return {
        eventId,
        averageRating: 0,
        sentiment: 'neutral',
        keyTopics: [],
        summary: 'No feedback available',
        suggestions: []
      };
    }

    try {
      const feedbackText = feedbacks.join('\\n---\\n');
      
      const systemPrompt = `You are an expert at analyzing event feedback. Provide sentiment analysis and actionable insights.`;
      
      const prompt = `Analyze this feedback:
${feedbackText}

Return JSON:
{
  "sentiment": "positive|neutral|negative",
  "keyTopics": ["topic1", "topic2"],
  "summary": "brief summary",
  "suggestions": ["suggestion1", "suggestion2"]
}`;

      const aiResponse = await this.callGroqAPI(prompt, systemPrompt);
      
      try {
        const analysis = JSON.parse(aiResponse);
        
        // Get average rating from database
        const { data: ratings } = await supabase
          .from('registrations')
          .select('rating')
          .eq('event_id', eventId)
          .not('rating', 'is', null);

        const avgRating = ratings && ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
          : 0;

        return {
          eventId,
          averageRating: Number(avgRating.toFixed(1)),
          sentiment: analysis.sentiment || 'neutral',
          keyTopics: analysis.keyTopics || [],
          summary: analysis.summary || 'Analysis complete',
          suggestions: analysis.suggestions || []
        };
      } catch (parseError) {
        console.error('Failed to parse AI sentiment response:', parseError);
      }
    } catch (error) {
      console.error('AI sentiment analysis failed:', error);
    }

    // Fallback to simple sentiment analysis
    return this.getFallbackSentiment(feedbacks, eventId);
  },

  /**
   * Fallback sentiment analysis
   */
  async getFallbackSentiment(feedbacks: string[], eventId: string): Promise<FeedbackSentiment> {
    const positiveWords = ['great', 'excellent', 'amazing', 'good', 'love', 'awesome'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'hate', 'worst'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const feedback of feedbacks) {
      const text = feedback.toLowerCase();
      const hasPositive = positiveWords.some(word => text.includes(word));
      const hasNegative = negativeWords.some(word => text.includes(word));

      if (hasPositive && !hasNegative) positiveCount++;
      else if (hasNegative && !hasPositive) negativeCount++;
    }

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';

    // Get average rating
    const { data: ratings } = await supabase
      .from('registrations')
      .select('rating')
      .eq('event_id', eventId)
      .not('rating', 'is', null);

    const avgRating = ratings && ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;

    return {
      eventId,
      averageRating: Number(avgRating.toFixed(1)),
      sentiment,
      keyTopics: ['General feedback'],
      summary: `${Math.round((positiveCount / feedbacks.length) * 100)}% positive feedback`,
      suggestions: ['Continue current approach']
    };
  },

  /**
   * Generate analytics insights using AI
   */
  async generateAnalyticsInsights(analyticsData: any): Promise<AIInsight[]> {
    try {
      const systemPrompt = `You are a data analyst for university events. Provide actionable insights.`;
      
      const prompt = `Analyze this data and provide 3 key insights:
${JSON.stringify(analyticsData, null, 2)}

Return JSON array:
[{"type": "trend", "title": "Title", "description": "Description"}]`;

      const aiResponse = await this.callGroqAPI(prompt, systemPrompt);
      
      try {
        const insights = JSON.parse(aiResponse);
        return Array.isArray(insights) ? insights : [];
      } catch (parseError) {
        console.error('Failed to parse AI insights:', parseError);
      }
    } catch (error) {
      console.error('AI analytics insights failed:', error);
    }

    return [
      {
        type: 'analysis',
        title: 'Analytics Ready',
        description: 'Your analytics data has been processed successfully.'
      }
    ];
  }
};
