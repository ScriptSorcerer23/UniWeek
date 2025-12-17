import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

const BUCKET_NAME = 'event-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  url: string;
  path: string;
}

export const storageService = {
  /**
   * Request permissions for camera and media library
   */
  async requestPermissions(): Promise<boolean> {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return cameraStatus === 'granted' && mediaStatus === 'granted';
  },

  /**
   * Pick an image from the device gallery
   */
  async pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled) return null;
    return result.assets[0];
  },

  /**
   * Take a photo with the camera
   */
  async takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled) return null;
    return result.assets[0];
  },

  /**
   * Upload an image to Supabase storage
   * @param imageUri - Local URI of the image
   * @param eventId - Event ID to use as filename
   * @returns Public URL of the uploaded image
   */
  async uploadEventImage(imageUri: string, eventId: string): Promise<UploadResult> {
    try {
      // Fetch the image as a blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Check file size
      if (blob.size > MAX_FILE_SIZE) {
        throw new Error('Image size must be less than 5MB');
      }

      // Determine file extension
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${eventId}.${fileExt}`;
      const filePath = fileName;

      // Convert blob to array buffer
      const arrayBuffer = await blob.arrayBuffer();

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true, // Replace if exists
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: data.path,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  },

  /**
   * Delete an image from storage
   * @param imagePath - Path of the image in storage (not full URL)
   */
  async deleteEventImage(imagePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([imagePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw - deletion failure shouldn't block event operations
    }
  },

  /**
   * Extract the storage path from a full public URL
   * @param url - Full public URL from Supabase
   * @returns Storage path (filename)
   */
  extractPathFromUrl(url: string): string | null {
    try {
      const match = url.match(/event-images\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  },

  /**
   * Get the public URL for an image path
   * @param imagePath - Storage path of the image
   */
  getPublicUrl(imagePath: string): string {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(imagePath);
    
    return data.publicUrl;
  },

  /**
   * List all images in the bucket (for admin purposes)
   */
  async listAllImages(): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list();

      if (error) throw error;

      return data.map(file => file.name);
    } catch (error) {
      console.error('Error listing images:', error);
      return [];
    }
  },
};
