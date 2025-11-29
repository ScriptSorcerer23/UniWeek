import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { Searchbar, Checkbox } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

interface User {
  name: string;
  email: string;
}

interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  timestamp: string;
  attended: boolean;
  users: User;
}

// Society colors
const SOCIETY_COLORS = {
  ACM: { primary: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] as const },
  CLS: { primary: '#10B981', gradient: ['#10B981', '#059669'] as const },
  CSS: { primary: '#F97316', gradient: ['#F97316', '#EA580C'] as const },
};

interface EventRegistrationsScreenProps {
  navigation: any;
  route: {
    params: {
      eventId: string;
      eventTitle: string;
    };
  };
}

export const EventRegistrationsScreen: React.FC<EventRegistrationsScreenProps> = ({
  navigation,
  route,
}) => {
  const { eventId, eventTitle } = route.params;
  const { user } = useAuth();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const societyColor = user?.societyType
    ? SOCIETY_COLORS[user.societyType]
    : SOCIETY_COLORS.ACM;

  const fetchRegistrations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, users(name, email)')
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setRegistrations(data || []);
      setFilteredRegistrations(data || []);
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
      Alert.alert('Error', 'Failed to load registrations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchRegistrations();

    // Set up realtime subscription for new registrations
    const channel = supabase
      .channel('registrations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchRegistrations]);

  // Filter registrations based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRegistrations(registrations);
    } else {
      const filtered = registrations.filter(
        (reg) =>
          reg.users.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reg.users.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRegistrations(filtered);
    }
  }, [searchQuery, registrations]);

  const toggleAttendance = async (regId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ attended: !currentStatus })
        .eq('id', regId);

      if (error) throw error;

      // Update local state
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === regId ? { ...reg, attended: !currentStatus } : reg
        )
      );
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  const handleSendNotification = (registration: Registration) => {
    Alert.alert(
      'Send Notification',
      `Send a notification to ${registration.users.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            // TODO: Implement notification sending
            Alert.alert('Success', 'Notification sent successfully!');
          },
        },
      ]
    );
  };

  const exportList = async () => {
    try {
      // Generate CSV content
      const csvHeader = 'Name,Email,Registration Date,Attended\n';
      const csvRows = registrations
        .map((reg) => {
          const date = new Date(reg.timestamp).toLocaleDateString();
          const attended = reg.attended ? 'Yes' : 'No';
          return `${reg.users.name},${reg.users.email},${date},${attended}`;
        })
        .join('\n');

      const csvContent = csvHeader + csvRows;

      // Share the CSV content
      await Share.share({
        message: csvContent,
        title: `${eventTitle} - Registrations`,
      });
    } catch (error: any) {
      console.error('Error exporting list:', error);
      Alert.alert('Error', 'Failed to export list');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRegistrations();
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRegistrationCard = ({ item, index }: { item: Registration; index: number }) => {
    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 100}
        duration={600}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={societyColor.gradient}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>
                {item.users.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.users.name}</Text>
            <Text style={styles.studentEmail}>{item.users.email}</Text>
            <View style={styles.dateContainer}>
              <Ionicons name="time-outline" size={14} color="#999" />
              <Text style={styles.registrationDate}>{formatDate(item.timestamp)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => handleSendNotification(item)}
          >
            <Ionicons name="notifications-outline" size={24} color={societyColor.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.attendanceRow}
            onPress={() => toggleAttendance(item.id, item.attended)}
          >
            <Checkbox
              status={item.attended ? 'checked' : 'unchecked'}
              onPress={() => toggleAttendance(item.id, item.attended)}
              color={societyColor.primary}
            />
            <Text style={styles.attendanceLabel}>Attended</Text>
          </TouchableOpacity>

          {item.attended && (
            <View style={styles.attendedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.attendedBadgeText}>Present</Text>
            </View>
          )}
        </View>
      </Animatable.View>
    );
  };

  const renderEmptyState = () => (
    <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Registrations Yet</Text>
      <Text style={styles.emptyText}>
        Students will appear here once they register for this event
      </Text>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={societyColor.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.exportButton} 
              onPress={() => navigation.navigate('SendNotification', { 
                eventId, 
                eventTitle 
              })}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton} onPress={exportList}>
              <Ionicons name="download-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {eventTitle}
          </Text>
          <View style={styles.countContainer}>
            <Ionicons name="people" size={20} color="#fff" />
            <Text style={styles.countText}>
              {registrations.length} {registrations.length === 1 ? 'Registration' : 'Registrations'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by name or email"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={societyColor.primary}
          inputStyle={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredRegistrations}
        renderItem={renderRegistrationCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[societyColor.primary]}
            tintColor={societyColor.primary}
          />
        }
      />
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
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
  },
  countText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    fontSize: 16,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  registrationDate: {
    fontSize: 12,
    color: '#999',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
  },
  attendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  attendedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
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
});
