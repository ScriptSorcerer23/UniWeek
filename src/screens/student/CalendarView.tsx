import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
} from 'react-native';
import { Calendar, DateObject } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { SOCIETY_COLORS } from '../../utils/constants';
import { useNavigation } from '@react-navigation/native';

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];

export const CalendarViewScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(today));
  const [currentMonthFirstDay, setCurrentMonthFirstDay] = useState<string>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  );

  const listAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchRegistrations();

    // subscribe to realtime registration changes for current user
    let channel: any;
    if (user?.id) {
      channel = supabase
        .channel(`registrations-user-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'registrations', filter: `user_id=eq.${user.id}` },
          () => fetchRegistrations()
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchRegistrations = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, events(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const regs = data || [];
      setRegistrations(regs);
      const marks = buildMarkedDates(regs);
      // ensure selected date is marked as selected
      if (marks[selectedDate]) marks[selectedDate].selected = true;
      setMarkedDates(marks);
    } catch (err) {
      console.error('Error fetching registrations for calendar', err);
    }
  };

  const buildMarkedDates = (regs: any[]) => {
    const m: Record<string, any> = {};

    regs.forEach((reg) => {
      const ev = reg.events || reg.event || reg;
      if (!ev || !ev.date) return;
      const dateKey = ev.date; // expecting YYYY-MM-DD

      const society = (ev.society || 'ACM') as string;
      const color = SOCIETY_COLORS[society as keyof typeof SOCIETY_COLORS] || '#2196F3';

      if (!m[dateKey]) {
        m[dateKey] = { dots: [{ key: society + dateKey, color }], marked: true };
      } else {
        // avoid duplicate society dot for same date
        const exists = (m[dateKey].dots || []).some((d: any) => d.color === color);
        if (!exists) m[dateKey].dots.push({ key: society + dateKey, color });
      }
    });

    return m;
  };

  const handleDayPress = (day: DateObject) => {
    animateListOut(() => {
      setSelectedDate(day.dateString);
      // rebuild marked to set selected flag
      setMarkedDates((prev) => {
        const copy = { ...prev };
        Object.keys(copy).forEach((k) => (copy[k] = { ...copy[k], selected: false }));
        if (!copy[day.dateString]) copy[day.dateString] = { dots: [], selected: true };
        else copy[day.dateString].selected = true;
        return copy;
      });
      animateListIn();
    });
  };

  const animateListOut = (cb?: () => void) => {
    Animated.timing(listAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => cb && cb());
  };

  const animateListIn = () => {
    Animated.timing(listAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const jumpToToday = () => {
    const d = formatDate(new Date());
    setSelectedDate(d);
    setCurrentMonthFirstDay(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
    setMarkedDates((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((k) => (copy[k] = { ...copy[k], selected: false }));
      if (!copy[d]) copy[d] = { dots: [], selected: true };
      else copy[d].selected = true;
      return copy;
    });
  };

  const changeMonth = (offset: number) => {
    const cur = new Date(currentMonthFirstDay);
    cur.setMonth(cur.getMonth() + offset);
    const newFirst = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-01`;
    setCurrentMonthFirstDay(newFirst);
  };

  const onMonthChange = (month: { year: number; month: number }) => {
    const newFirst = `${month.year}-${String(month.month).padStart(2, '0')}-01`;
    setCurrentMonthFirstDay(newFirst);
  };

  const eventsForSelectedDate = registrations
    .map((r) => r.events || r.event || r)
    .filter((ev) => ev && ev.date === selectedDate);

  const renderEvent = ({ item }: { item: any }) => {
    const society = item.society || 'ACM';
    const color = SOCIETY_COLORS[society as keyof typeof SOCIETY_COLORS] || '#2196F3';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('EventDetails' as never, { eventId: item.id } as never)}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.societyBadge, { backgroundColor: color }]} />
        </View>

        <View style={styles.cardBody}>
          <Text numberOfLines={1} style={styles.eventTitle}>
            {item.title}
          </Text>
          <Text style={styles.eventMeta}>{`${item.time || ''} • ${item.venue || ''}`}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.chev}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </TouchableOpacity>

        <View style={styles.monthLabelContainer}>
          <Text style={styles.monthLabel}>
            {new Date(currentMonthFirstDay).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.chev}>
          <Ionicons name="chevron-forward" size={22} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity onPress={jumpToToday} style={styles.todayButton}>
          <Text style={styles.todayText}>Today</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        current={currentMonthFirstDay}
        onDayPress={handleDayPress}
        markingType={'multi-dot'}
        markedDates={markedDates}
        onMonthChange={onMonthChange}
        theme={{
          todayTextColor: '#ffffff',
          todayBackgroundColor: '#6200EE',
          arrowColor: '#333',
          dotColor: '#000',
          selectedDayBackgroundColor: '#6200EE',
        }}
      />

      <Animated.View
        style={{
          flex: 1,
          opacity: listAnim,
          transform: [
            {
              translateY: listAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        }}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>Events on {selectedDate}</Text>
        </View>

        <FlatList
          data={eventsForSelectedDate}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events for this date</Text>
            </View>
          )}
        />
      </Animated.View>
    </View>
  );
};

export default CalendarViewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  chev: {
    padding: 8,
  },
  monthLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  todayButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  todayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardLeft: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  societyBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  eventMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
  },
});
