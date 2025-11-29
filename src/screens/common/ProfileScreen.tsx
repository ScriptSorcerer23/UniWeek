import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { SOCIETY_COLORS, APP_THEME } from '../../utils/constants';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'society';
  society_type?: 'ACM' | 'CLS' | 'CSS';
  avatar_url?: string;
}

interface Statistics {
  eventsCount: number;
  ratingsAvg?: number;
  totalRegistrations?: number;
}

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    eventsCount: 0,
    ratingsAvg: 0,
    totalRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchStatistics();
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!user?.id) return;

    try {
      if (user.role === 'student') {
        // Fetch events attended and average rating given
        const { data: registrations, error: regError } = await supabase
          .from('registrations')
          .select('rating, attended')
          .eq('user_id', user.id);

        if (regError) throw regError;

        const attendedEvents = registrations?.filter((r) => r.attended).length || 0;
        const ratingsGiven = registrations?.filter((r) => r.rating !== null) || [];
        const avgRating =
          ratingsGiven.length > 0
            ? ratingsGiven.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsGiven.length
            : 0;

        setStatistics({
          eventsCount: attendedEvents,
          ratingsAvg: parseFloat(avgRating.toFixed(1)),
        });
      } else if (user.role === 'society') {
        // Fetch events created and total registrations
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('id')
          .eq('created_by', user.id);

        if (eventsError) throw eventsError;

        const eventIds = events?.map((e) => e.id) || [];
        let totalRegs = 0;

        if (eventIds.length > 0) {
          const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('id')
            .in('event_id', eventIds);

          if (regError) throw regError;
          totalRegs = registrations?.length || 0;
        }

        setStatistics({
          eventsCount: events?.length || 0,
          totalRegistrations: totalRegs,
        });
      }
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable photo library permissions');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user?.id) return;

    setUploading(true);
    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await logout();
            } catch (error: any) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const menuItems = [
    {
      icon: 'settings-outline',
      label: 'Settings',
      onPress: () => navigation.navigate('Settings'),
      color: '#333',
    },
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      onPress: () => Alert.alert('Coming Soon', 'Edit Profile feature'),
      color: '#333',
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Privacy & Terms',
      onPress: () => Alert.alert('Coming Soon', 'Privacy & Terms feature'),
      color: '#333',
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      onPress: () => Alert.alert('Coming Soon', 'Help & Support feature'),
      color: '#333',
    },
    {
      icon: 'log-out-outline',
      label: 'Logout',
      onPress: handleLogout,
      color: '#F44336',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={80} color="#ccc" />
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  const roleColor =
    profile.role === 'society' && profile.society_type
      ? SOCIETY_COLORS[profile.society_type]
      : APP_THEME.colors.primary;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={[APP_THEME.colors.primary, '#764BA2', '#667eea']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animatable.View animation="fadeInDown" duration={800} style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.8}
              disabled={uploading}
              style={styles.avatarWrapper}
            >
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.editIconContainer}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.Text animation="fadeInUp" delay={200} style={styles.userName}>
            {profile.full_name}
          </Animatable.Text>
          <Animatable.Text animation="fadeInUp" delay={300} style={styles.userEmail}>
            {profile.email}
          </Animatable.Text>

          <Animatable.View animation="fadeInUp" delay={400} style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {profile.role === 'student'
                ? 'Student'
                : `${profile.society_type} Society Handler`}
            </Text>
          </Animatable.View>
        </LinearGradient>

        {/* Statistics Cards */}
        <Animatable.View animation="fadeInUp" delay={500} style={styles.statsContainer}>
          {profile.role === 'student' ? (
            <>
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="calendar" size={24} color="#2196F3" />
                </View>
                <Text style={styles.statValue}>{statistics.eventsCount}</Text>
                <Text style={styles.statLabel}>Events Attended</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="star" size={24} color="#FF9800" />
                </View>
                <Text style={styles.statValue}>{statistics.ratingsAvg?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.statLabel}>Avg Rating Given</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="create" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.statValue}>{statistics.eventsCount}</Text>
                <Text style={styles.statLabel}>Events Created</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="people" size={24} color="#9C27B0" />
                </View>
                <Text style={styles.statValue}>{statistics.totalRegistrations || 0}</Text>
                <Text style={styles.statLabel}>Total Registrations</Text>
              </View>
            </>
          )}
        </Animatable.View>

        {/* Menu List */}
        <Animatable.View animation="fadeInUp" delay={600} style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
                <Text style={[styles.menuItemText, { color: item.color }]}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </Animatable.View>

        {/* App Version */}
        <Text style={styles.versionText}>UniWeek v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: APP_THEME.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 24,
    marginBottom: 24,
  },
});
