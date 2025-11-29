import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { APP_THEME } from '../../utils/constants';

interface UserSettings {
  pushNotifications: boolean;
  eventReminders: boolean;
  societyUpdates: boolean;
  theme: 'light' | 'dark';
  defaultCalendar: string;
}

const THEME_OPTIONS = ['Light', 'Dark'];
const CALENDAR_OPTIONS = ['Device Default', 'Google Calendar', 'Apple Calendar', 'Outlook'];

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<UserSettings>({
    pushNotifications: true,
    eventReminders: true,
    societyUpdates: true,
    theme: 'light',
    defaultCalendar: 'Device Default',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data?.preferences) {
        setSettings({
          pushNotifications: data.preferences.pushNotifications ?? true,
          eventReminders: data.preferences.eventReminders ?? true,
          societyUpdates: data.preferences.societyUpdates ?? true,
          theme: data.preferences.theme ?? 'light',
          defaultCalendar: data.preferences.defaultCalendar ?? 'Device Default',
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      // Use default settings if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ preferences: newSettings })
        .eq('id', user?.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'A password reset link will be sent to your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
                redirectTo: 'uniweek://reset-password',
              });
              
              if (error) throw error;
              
              Alert.alert(
                'Email Sent',
                'Please check your email for password reset instructions.'
              );
            } catch (error: any) {
              console.error('Error sending reset email:', error);
              Alert.alert('Error', error.message || 'Failed to send reset email');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete your account. Type DELETE to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Delete user data from users table
                      const { error: deleteError } = await supabase
                        .from('users')
                        .delete()
                        .eq('id', user?.id);

                      if (deleteError) throw deleteError;

                      // Sign out
                      await supabase.auth.signOut();
                      
                      Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
                    } catch (error: any) {
                      console.error('Error deleting account:', error);
                      Alert.alert('Error', 'Failed to delete account. Please contact support.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        {saving && <ActivityIndicator size="small" color={APP_THEME.colors.primary} />}
        {!saving && <View style={{ width: 24 }} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Notifications Section */}
        <Animatable.View animation="fadeInUp" delay={100} duration={600}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="notifications" size={20} color="#2196F3" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>Receive notifications on your device</Text>
                </View>
              </View>
              <Switch
                value={settings.pushNotifications}
                onValueChange={(value) => updateSetting('pushNotifications', value)}
                trackColor={{ false: '#E0E0E0', true: APP_THEME.colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="alarm" size={20} color="#FF9800" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Event Reminders</Text>
                  <Text style={styles.settingDescription}>Reminder 1 day before events</Text>
                </View>
              </View>
              <Switch
                value={settings.eventReminders}
                onValueChange={(value) => updateSetting('eventReminders', value)}
                trackColor={{ false: '#E0E0E0', true: APP_THEME.colors.primary }}
                thumbColor="#fff"
                disabled={!settings.pushNotifications}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="megaphone" size={20} color="#4CAF50" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Society Updates</Text>
                  <Text style={styles.settingDescription}>Get updates from societies</Text>
                </View>
              </View>
              <Switch
                value={settings.societyUpdates}
                onValueChange={(value) => updateSetting('societyUpdates', value)}
                trackColor={{ false: '#E0E0E0', true: APP_THEME.colors.primary }}
                thumbColor="#fff"
                disabled={!settings.pushNotifications}
              />
            </View>
          </View>
        </Animatable.View>

        {/* Preferences Section */}
        <Animatable.View animation="fadeInUp" delay={200} duration={600}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setShowThemePicker(!showThemePicker)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="color-palette" size={20} color="#9C27B0" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Theme</Text>
                  <Text style={styles.settingDescription}>
                    {settings.theme === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            {showThemePicker && (
              <Animatable.View animation="fadeInDown" duration={300} style={styles.pickerContainer}>
                {THEME_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.pickerOption}
                    onPress={() => {
                      updateSetting('theme', option.toLowerCase() as 'light' | 'dark');
                      setShowThemePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        settings.theme === option.toLowerCase() && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {settings.theme === option.toLowerCase() && (
                      <Ionicons name="checkmark" size={20} color={APP_THEME.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </Animatable.View>
            )}

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setShowCalendarPicker(!showCalendarPicker)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E1F5FE' }]}>
                  <Ionicons name="calendar" size={20} color="#03A9F4" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Default Calendar</Text>
                  <Text style={styles.settingDescription}>{settings.defaultCalendar}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            {showCalendarPicker && (
              <Animatable.View animation="fadeInDown" duration={300} style={styles.pickerContainer}>
                {CALENDAR_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.pickerOption}
                    onPress={() => {
                      updateSetting('defaultCalendar', option);
                      setShowCalendarPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        settings.defaultCalendar === option && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {settings.defaultCalendar === option && (
                      <Ionicons name="checkmark" size={20} color={APP_THEME.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </Animatable.View>
            )}
          </View>
        </Animatable.View>

        {/* Account Section */}
        <Animatable.View animation="fadeInUp" delay={300} duration={600}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleChangePassword}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF9C4' }]}>
                  <Ionicons name="key" size={20} color="#FBC02D" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Change Password</Text>
                  <Text style={styles.settingDescription}>Reset your account password</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="trash" size={20} color="#F44336" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, { color: '#F44336' }]}>Delete Account</Text>
                  <Text style={styles.settingDescription}>Permanently delete your account</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Changes are saved automatically. Some settings may require app restart to take effect.
        </Text>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 68,
  },
  pickerContainer: {
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 68,
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#666',
  },
  pickerOptionTextSelected: {
    color: APP_THEME.colors.primary,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
