import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { TextInput, ActivityIndicator, Menu } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { EventCategory } from '../../types';

const CATEGORIES: EventCategory[] = [
  'Workshop',
  'Competition',
  'Sports',
  'Technical',
  'Cultural',
  'Other',
];

// Society colors
const SOCIETY_COLORS = {
  ACM: { primary: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] as const },
  CLS: { primary: '#10B981', gradient: ['#10B981', '#059669'] as const },
  CSS: { primary: '#F97316', gradient: ['#F97316', '#EA580C'] as const },
};

interface EditEventScreenProps {
  navigation: any;
  route: {
    params: {
      eventId: string;
    };
  };
}

export const EditEventScreen: React.FC<EditEventScreenProps> = ({ navigation, route }) => {
  const { eventId } = route.params;
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [capacity, setCapacity] = useState('');
  const [category, setCategory] = useState<EventCategory>('Workshop');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const [errors, setErrors] = useState({
    title: '',
    description: '',
    venue: '',
    capacity: '',
  });

  const societyColor = user?.societyType
    ? SOCIETY_COLORS[user.societyType]
    : SOCIETY_COLORS.ACM;

  // Fetch event data on mount
  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setVenue(data.venue);
        setCapacity(data.capacity.toString());
        setCategory(data.category);
        setExistingImageUrl(data.image_url);
        setUpdatedAt(data.updated_at || data.created_at);

        // Parse date
        const eventDate = new Date(data.date);
        setDate(eventDate);

        // Parse time
        const [hours, minutes] = data.time.split(':');
        const eventTime = new Date();
        eventTime.setHours(parseInt(hours), parseInt(minutes));
        setTime(eventTime);
      }
    } catch (error: any) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Failed to load event data');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `event-posters/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-posters')
        .upload(filePath, blob);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('event-posters')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      title: '',
      description: '',
      venue: '',
      capacity: '',
    };

    let isValid = true;

    if (!title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
      isValid = false;
    }

    if (!venue.trim()) {
      newErrors.venue = 'Venue is required';
      isValid = false;
    }

    if (!capacity.trim()) {
      newErrors.capacity = 'Capacity is required';
      isValid = false;
    } else if (isNaN(Number(capacity)) || Number(capacity) < 1) {
      newErrors.capacity = 'Capacity must be a valid number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleUpdateEvent = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);

    try {
      // Upload new image if selected, otherwise keep existing
      let imageUrl: string | null = existingImageUrl;
      if (imageUri) {
        const uploadedUrl = await uploadImage(imageUri);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Format time as HH:MM
      const timeString = `${time.getHours().toString().padStart(2, '0')}:${time
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      // Update event in database
      const { error } = await supabase
        .from('events')
        .update({
          title: title.trim(),
          description: description.trim(),
          venue: venue.trim(),
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          time: timeString,
          capacity: parseInt(capacity),
          category: category,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) throw error;

      // Show success message
      Alert.alert(
        'Success! ✅',
        'Event updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating event:', error);
      Alert.alert('Error', error.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure? This will cancel all registrations',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteEvent,
        },
      ]
    );
  };

  const confirmDeleteEvent = async () => {
    setDeleting(true);

    try {
      // Delete event (this will cascade delete registrations if set up in DB)
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      // Show success message
      Alert.alert(
        'Deleted',
        'Event deleted successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', error.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: Date): string => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatUpdatedAt = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={societyColor.primary} />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={societyColor.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Edit Event</Text>
            {updatedAt && (
              <Text style={styles.lastUpdated}>
                Last updated: {formatUpdatedAt(updatedAt)}
              </Text>
            )}
          </View>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Event Details Section */}
        <Animatable.View animation="fadeInUp" duration={600} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color={societyColor.primary} />
            <Text style={styles.sectionTitle}>Event Details</Text>
          </View>

          {/* Title Input */}
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="Event Title *"
              placeholder="Enter event title"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setErrors({ ...errors, title: '' });
              }}
              style={styles.input}
              outlineColor="#e0e0e0"
              activeOutlineColor={societyColor.primary}
              error={!!errors.title}
            />
            {errors.title ? (
              <Text style={styles.errorText}>{errors.title}</Text>
            ) : null}
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="Description *"
              placeholder="Enter event description"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                setErrors({ ...errors, description: '' });
              }}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
              outlineColor="#e0e0e0"
              activeOutlineColor={societyColor.primary}
              error={!!errors.description}
            />
            {errors.description ? (
              <Text style={styles.errorText}>{errors.description}</Text>
            ) : null}
          </View>

          {/* Venue Input */}
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="Venue *"
              placeholder="Enter event venue"
              value={venue}
              onChangeText={(text) => {
                setVenue(text);
                setErrors({ ...errors, venue: '' });
              }}
              left={<TextInput.Icon icon={() => <Ionicons name="location" size={20} color="#666" />} />}
              style={styles.input}
              outlineColor="#e0e0e0"
              activeOutlineColor={societyColor.primary}
              error={!!errors.venue}
            />
            {errors.venue ? (
              <Text style={styles.errorText}>{errors.venue}</Text>
            ) : null}
          </View>
        </Animatable.View>

        {/* Date & Time Section */}
        <Animatable.View animation="fadeInUp" delay={200} duration={600} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color={societyColor.primary} />
            <Text style={styles.sectionTitle}>Date & Time</Text>
          </View>

          <View style={styles.row}>
            {/* Date Picker */}
            <View style={styles.halfWidth}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={societyColor.primary} />
                <View style={styles.pickerContent}>
                  <Text style={styles.pickerLabel}>Date</Text>
                  <Text style={styles.pickerValue}>{formatDate(date)}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Time Picker */}
            <View style={styles.halfWidth}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={20} color={societyColor.primary} />
                <View style={styles.pickerContent}>
                  <Text style={styles.pickerLabel}>Time</Text>
                  <Text style={styles.pickerValue}>{formatTime(time)}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  setTime(selectedTime);
                }
              }}
            />
          )}
        </Animatable.View>

        {/* Category & Capacity Section */}
        <Animatable.View animation="fadeInUp" delay={400} duration={600} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="options-outline" size={24} color={societyColor.primary} />
            <Text style={styles.sectionTitle}>Additional Info</Text>
          </View>

          {/* Category Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category *</Text>
            <Menu
              visible={showCategoryMenu}
              onDismiss={() => setShowCategoryMenu(false)}
              anchor={
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCategoryMenu(true)}
                >
                  <Ionicons name="grid-outline" size={20} color="#666" />
                  <Text style={styles.dropdownText}>{category}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              }
            >
              {CATEGORIES.map((cat) => (
                <Menu.Item
                  key={cat}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryMenu(false);
                  }}
                  title={cat}
                />
              ))}
            </Menu>
          </View>

          {/* Capacity Input */}
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="Capacity *"
              placeholder="Enter max capacity"
              value={capacity}
              onChangeText={(text) => {
                setCapacity(text.replace(/[^0-9]/g, ''));
                setErrors({ ...errors, capacity: '' });
              }}
              keyboardType="numeric"
              left={<TextInput.Icon icon={() => <Ionicons name="people" size={20} color="#666" />} />}
              style={styles.input}
              outlineColor="#e0e0e0"
              activeOutlineColor={societyColor.primary}
              error={!!errors.capacity}
            />
            {errors.capacity ? (
              <Text style={styles.errorText}>{errors.capacity}</Text>
            ) : null}
          </View>
        </Animatable.View>

        {/* Event Poster Section */}
        <Animatable.View animation="fadeInUp" delay={600} duration={600} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="image-outline" size={24} color={societyColor.primary} />
            <Text style={styles.sectionTitle}>Event Poster</Text>
          </View>

          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            {imageUri || existingImageUrl ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: imageUri || existingImageUrl || undefined }} 
                  style={styles.imagePreview} 
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setImageUri(null);
                    setExistingImageUrl(null);
                  }}
                >
                  <Ionicons name="close-circle" size={32} color="#ff6b6b" />
                </TouchableOpacity>
                {!imageUri && existingImageUrl && (
                  <View style={styles.existingBadge}>
                    <Text style={styles.existingBadgeText}>Current</Text>
                  </View>
                )}
                {imageUri && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>New</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.imagePickerContent}>
                <Ionicons name="cloud-upload-outline" size={48} color="#999" />
                <Text style={styles.imagePickerText}>Tap to upload poster</Text>
                <Text style={styles.imagePickerSubtext}>Recommended: 16:9 ratio</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animatable.View>

        {/* Action Buttons */}
        <Animatable.View animation="fadeInUp" delay={800} duration={600} style={styles.buttonContainer}>
          {/* Update Button */}
          <TouchableOpacity
            onPress={handleUpdateEvent}
            disabled={loading || deleting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={societyColor.gradient}
              style={styles.updateButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Update Event</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDeleteEvent}
            disabled={loading || deleting}
            activeOpacity={0.8}
            style={styles.deleteButtonContainer}
          >
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.deleteButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Delete Event</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  pickerContent: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  pickerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  imagePickerButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  imagePickerContent: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  existingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  existingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 12,
  },
  updateButton: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  deleteButtonContainer: {
    marginTop: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
