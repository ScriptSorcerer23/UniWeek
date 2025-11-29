import { Event } from '../types';

const CLAUDE_API_KEY = ''; // Add your Claude API key here or use environment variable

export const aiService = {
  /**
   * Get event recommendations for a student based on past registrations
   */
  async getEventRecommendations(
    userRegisteredEvents: string[],
    allEvents: Event[]
  ): Promise<Event[]> {
    // Simple recommendation algorithm based on:
    // 1. Category matching with past events
    // 2. Society diversity
    // 3. Events not yet registered for

    if (userRegisteredEvents.length === 0) {
      // Return upcoming events if no history
      return allEvents.slice(0, 5);
    }

    // Get categories and societies from registered events
    const registeredEvents = allEvents.filter((e) =>
      userRegisteredEvents.includes(e.id)
    );
    
    const preferredCategories = registeredEvents.map((e) => e.category);
    const attendedSocieties = registeredEvents.map((e) => e.society);

    // Score events
    const scoredEvents = allEvents
      .filter((e) => !userRegisteredEvents.includes(e.id))
      .map((event) => {
        let score = 0;
        
        // Prefer categories the user has attended before
        if (preferredCategories.includes(event.category)) {
          score += 3;
        }
        
        // Encourage diversity - lower score for societies already attended
        if (!attendedSocieties.includes(event.society)) {
          score += 2;
        }
        
        // Prefer events with available capacity
        if (event.registeredStudents.length < event.capacity) {
          score += 1;
        }

        // Prefer upcoming events
        if (event.date > new Date()) {
          score += 2;
        }

        return { event, score };
      })
      .sort((a, b) => b.score - a.score);

    return scoredEvents.slice(0, 5).map((s) => s.event);
  },

  /**
   * Auto-suggest event category based on title and description
   */
  async suggestEventCategory(title: string, description: string): Promise<string> {
    const keywords = {
      Technical: ['workshop', 'coding', 'hackathon', 'tech', 'ai', 'ml', 'web', 'app', 'software', 'programming'],
      Cultural: ['music', 'dance', 'art', 'cultural', 'performance', 'show', 'concert'],
      Sports: ['sports', 'cricket', 'football', 'basketball', 'tournament', 'match', 'game', 'athletics'],
      Workshop: ['workshop', 'training', 'seminar', 'session', 'tutorial', 'learn'],
      Competition: ['competition', 'contest', 'challenge', 'hackathon', 'quiz', 'debate'],
    };

    const text = `${title} ${description}`.toLowerCase();
    
    for (const [category, terms] of Object.entries(keywords)) {
      if (terms.some((term) => text.includes(term))) {
        return category;
      }
    }

    return 'Other';
  },

  /**
   * Analyze feedback sentiment
   */
  async analyzeFeedbackSentiment(feedbacks: string[]): Promise<{
    positive: number;
    neutral: number;
    negative: number;
    summary: string;
  }> {
    if (feedbacks.length === 0) {
      return {
        positive: 0,
        neutral: 0,
        negative: 0,
        summary: 'No feedback available',
      };
    }

    // Simple sentiment analysis based on keywords
    const positiveWords = ['great', 'excellent', 'amazing', 'good', 'love', 'awesome', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'hate', 'worst', 'disappointing'];

    let positive = 0;
    let negative = 0;
    let neutral = 0;

    feedbacks.forEach((feedback) => {
      const text = feedback.toLowerCase();
      const hasPositive = positiveWords.some((word) => text.includes(word));
      const hasNegative = negativeWords.some((word) => text.includes(word));

      if (hasPositive && !hasNegative) {
        positive++;
      } else if (hasNegative && !hasPositive) {
        negative++;
      } else {
        neutral++;
      }
    });

    const total = feedbacks.length;
    const summary = `${Math.round((positive / total) * 100)}% positive feedback`;

    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100),
      summary,
    };
  },

  /**
   * Use Claude API for advanced recommendations (optional)
   */
  async getClaudeRecommendations(
    userHistory: string,
    availableEvents: Event[]
  ): Promise<string> {
    // This would integrate with Claude API for more sophisticated recommendations
    // Placeholder for future implementation
    return 'Claude API integration coming soon';
  },
};
