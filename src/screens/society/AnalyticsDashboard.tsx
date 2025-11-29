import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

const { width } = Dimensions.get('window');

// Society colors
const SOCIETY_COLORS = {
  ACM: { primary: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] as const },
  CLS: { primary: '#10B981', gradient: ['#10B981', '#059669'] as const },
  CSS: { primary: '#F97316', gradient: ['#F97316', '#EA580C'] as const },
};

interface AnalyticsData {
  registrationTrend: number[];
  trendLabels: string[];
  topEvents: { name: string; count: number }[];
  categoryDistribution: { name: string; count: number; color: string }[];
  averageRating: number;
  totalFeedback: number;
  attendanceRate: number;
  topRatedEvents: { title: string; rating: number; feedbackCount: number }[];
}

export const AnalyticsDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    registrationTrend: [],
    trendLabels: [],
    topEvents: [],
    categoryDistribution: [],
    averageRating: 0,
    totalFeedback: 0,
    attendanceRate: 0,
    topRatedEvents: [],
  });

  const societyColor = user?.societyType
    ? SOCIETY_COLORS[user.societyType]
    : SOCIETY_COLORS.ACM;

  const categoryColors = {
    Workshop: '#3B82F6',
    Competition: '#EF4444',
    Sports: '#10B981',
    Technical: '#8B5CF6',
    Cultural: '#F59E0B',
    Other: '#6B7280',
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user]);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);

      if (!user) return;

      // Fetch all events for this society
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('society', user.societyType);

      if (eventsError) throw eventsError;

      if (!events || events.length === 0) {
        setLoading(false);
        return;
      }

      const eventIds = events.map((e) => e.id);

      // Fetch all registrations for these events
      const { data: registrations, error: regsError } = await supabase
        .from('registrations')
        .select('*')
        .in('event_id', eventIds);

      if (regsError) throw regsError;

      // Calculate registration trend (last 30 days)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date;
      });

      const trendData = last30Days.map((date) => {
        const dateStr = date.toISOString().split('T')[0];
        return (
          registrations?.filter((reg) => reg.timestamp?.startsWith(dateStr)).length || 0
        );
      });

      const trendLabels = last30Days.map((date, i) => {
        if (i % 5 === 0) {
          return `${date.getDate()}/${date.getMonth() + 1}`;
        }
        return '';
      });

      // Calculate registrations per event (top 5)
      const eventRegistrations = events.map((event) => ({
        name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
        count: registrations?.filter((reg) => reg.event_id === event.id).length || 0,
      }));
      const topEvents = eventRegistrations
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate category distribution
      const categoryCounts: Record<string, number> = {};
      events.forEach((event) => {
        categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
      });

      const categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count,
        color: categoryColors[name as keyof typeof categoryColors] || categoryColors.Other,
        legendFontColor: '#333',
        legendFontSize: 12,
      }));

      // Calculate average rating and feedback count
      const ratingsData = registrations?.filter((reg) => reg.rating != null) || [];
      const averageRating =
        ratingsData.length > 0
          ? ratingsData.reduce((sum, reg) => sum + (reg.rating || 0), 0) / ratingsData.length
          : 0;
      const totalFeedback = registrations?.filter((reg) => reg.feedback).length || 0;

      // Calculate attendance rate
      const attendedCount = registrations?.filter((reg) => reg.attended).length || 0;
      const attendanceRate =
        registrations && registrations.length > 0
          ? (attendedCount / registrations.length) * 100
          : 0;

      // Calculate top rated events
      const eventsWithRatings = events
        .map((event) => {
          const eventRegs = registrations?.filter((reg) => reg.event_id === event.id) || [];
          const ratedRegs = eventRegs.filter((reg) => reg.rating != null);
          const avgRating =
            ratedRegs.length > 0
              ? ratedRegs.reduce((sum, reg) => sum + (reg.rating || 0), 0) / ratedRegs.length
              : 0;

          return {
            title: event.title,
            rating: avgRating,
            feedbackCount: ratedRegs.length,
          };
        })
        .filter((e) => e.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

      setAnalytics({
        registrationTrend: trendData,
        trendLabels,
        topEvents,
        categoryDistribution,
        averageRating,
        totalFeedback,
        attendanceRate,
        topRatedEvents: eventsWithRatings,
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const exportReport = async () => {
    try {
      const report = `
Event Analytics Report - ${user?.societyType}
Generated: ${new Date().toLocaleDateString()}

STATISTICS:
- Average Rating: ${analytics.averageRating.toFixed(1)}/5
- Total Feedback: ${analytics.totalFeedback}
- Attendance Rate: ${analytics.attendanceRate.toFixed(1)}%

TOP EVENTS BY REGISTRATIONS:
${analytics.topEvents.map((e, i) => `${i + 1}. ${e.name}: ${e.count} registrations`).join('\n')}

CATEGORY DISTRIBUTION:
${analytics.categoryDistribution.map((c) => `- ${c.name}: ${c.count} events`).join('\n')}

TOP RATED EVENTS:
${analytics.topRatedEvents
  .map((e, i) => `${i + 1}. ${e.title}: ${e.rating.toFixed(1)}/5 (${e.feedbackCount} ratings)`)
  .join('\n')}
`;

      await Share.share({
        message: report,
        title: 'Event Analytics Report',
      });
    } catch (error: any) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const renderLoadingSkeleton = () => (
    <View style={styles.loadingContainer}>
      {[1, 2, 3, 4].map((i) => (
        <Animatable.View
          key={i}
          animation="pulse"
          iterationCount="infinite"
          duration={1500}
          style={styles.skeletonCard}
        >
          <View style={styles.skeletonHeader} />
          <View style={styles.skeletonContent} />
        </Animatable.View>
      ))}
    </View>
  );

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: societyColor.primary,
    },
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={societyColor.gradient}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.societyBadge}>
              <Text style={styles.societyBadgeText}>{user?.societyType}</Text>
            </View>
            <Text style={styles.headerTitle}>Event Analytics</Text>
          </View>
        </LinearGradient>
        {renderLoadingSkeleton()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={societyColor.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerTop}>
          <View style={styles.societyBadge}>
            <Text style={styles.societyBadgeText}>{user?.societyType}</Text>
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={exportReport}>
            <Ionicons name="download-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Event Analytics</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <Animatable.View animation="fadeInUp" duration={600} style={styles.statCard}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="star" size={32} color="#fff" />
              <Text style={styles.statValue}>{analytics.averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </LinearGradient>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={100} duration={600} style={styles.statCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="chatbox-ellipses" size={32} color="#fff" />
              <Text style={styles.statValue}>{analytics.totalFeedback}</Text>
              <Text style={styles.statLabel}>Feedback</Text>
            </LinearGradient>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200} duration={600} style={styles.statCard}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="checkmark-circle" size={32} color="#fff" />
              <Text style={styles.statValue}>{analytics.attendanceRate.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </LinearGradient>
          </Animatable.View>
        </View>

        {/* Registration Trend Chart */}
        {analytics.registrationTrend.length > 0 && (
          <Animatable.View animation="fadeInUp" delay={300} duration={600} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Ionicons name="trending-up" size={24} color={societyColor.primary} />
              <Text style={styles.chartTitle}>Registration Trend (Last 30 Days)</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={{
                  labels: analytics.trendLabels,
                  datasets: [
                    {
                      data: analytics.registrationTrend,
                    },
                  ],
                }}
                width={Math.max(width - 40, analytics.trendLabels.length * 40)}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(${
                    societyColor.primary === '#3B82F6' ? '59, 130, 246' :
                    societyColor.primary === '#10B981' ? '16, 185, 129' :
                    '249, 115, 22'
                  }, ${opacity})`,
                }}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
              />
            </ScrollView>
          </Animatable.View>
        )}

        {/* Top Events Bar Chart */}
        {analytics.topEvents.length > 0 && (
          <Animatable.View animation="fadeInUp" delay={400} duration={600} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Ionicons name="bar-chart" size={24} color={societyColor.primary} />
              <Text style={styles.chartTitle}>Top Events by Registrations</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={{
                  labels: analytics.topEvents.map((e) => e.name),
                  datasets: [
                    {
                      data: analytics.topEvents.map((e) => e.count),
                    },
                  ],
                }}
                width={Math.max(width - 40, analytics.topEvents.length * 100)}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(${
                    societyColor.primary === '#3B82F6' ? '59, 130, 246' :
                    societyColor.primary === '#10B981' ? '16, 185, 129' :
                    '249, 115, 22'
                  }, ${opacity})`,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
              />
            </ScrollView>
          </Animatable.View>
        )}

        {/* Category Distribution Pie Chart */}
        {analytics.categoryDistribution.length > 0 && (
          <Animatable.View animation="fadeInUp" delay={500} duration={600} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Ionicons name="pie-chart" size={24} color={societyColor.primary} />
              <Text style={styles.chartTitle}>Events by Category</Text>
            </View>
            <PieChart
              data={analytics.categoryDistribution}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />
          </Animatable.View>
        )}

        {/* Top Rated Events List */}
        {analytics.topRatedEvents.length > 0 && (
          <Animatable.View animation="fadeInUp" delay={600} duration={600} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Ionicons name="trophy" size={24} color={societyColor.primary} />
              <Text style={styles.chartTitle}>Top Rated Events</Text>
            </View>

            {analytics.topRatedEvents.map((event, index) => (
              <View key={index} style={styles.ratedEventItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.eventInfoContainer}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= event.rating ? 'star' : 'star-outline'}
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                    <Text style={styles.ratingText}>
                      {event.rating.toFixed(1)} ({event.feedbackCount})
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Animatable.View>
        )}

        {/* Empty State */}
        {analytics.topEvents.length === 0 && (
          <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Analytics Data</Text>
            <Text style={styles.emptyText}>
              Create events and get registrations to see analytics
            </Text>
          </Animatable.View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerContent: {
    gap: 12,
  },
  societyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  societyBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  ratedEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  eventInfoContainer: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 20,
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skeletonHeader: {
    width: 150,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonContent: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
