import { supabase } from './supabase';
import { User, UserRole, SocietyType } from '../types';

export const authService = {
  /**
   * Sign up a new user
   */
  async signup(
    email: string,
    password: string,
    name: string,
    role: UserRole,
    societyType?: SocietyType
  ): Promise<User> {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          society_type: societyType,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // If email confirmation is required, return a partial user object
    if (!authData.session) {
      throw new Error('Please check your email and click the confirmation link to complete your signup.');
    }

    // Create user profile (only if session exists)
    const userProfile = {
      id: authData.user.id,
      email,
      name,
      role,
      society_type: societyType,
      registered_events: [],
      created_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('users')
      .insert([userProfile]);

    if (profileError) throw profileError;

    return {
      id: authData.user.id,
      email,
      name,
      role,
      societyType,
      registeredEvents: [],
      createdAt: new Date(),
    };
  },

  /**
   * Sign in existing user
   */
  async login(email: string, password: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to login');

    // Try to fetch user profile by ID first
    let { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    // If not found by ID, try by email
    if (!profile) {
      const { data: profileByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', authData.user.email!)
        .maybeSingle();
      
      profile = profileByEmail;
    }

    // If still no profile found, create a basic one
    if (!profile) {
      const defaultProfile = {
        id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
        role: 'student' as const,
        society_type: null,
        registered_events: [],
        created_at: new Date().toISOString(),
      };

      const { data: newProfile } = await supabase
        .from('users')
        .upsert([defaultProfile], { onConflict: 'id' })
        .select()
        .single();

      profile = newProfile;
    }

    if (!profile) {
      throw new Error('Could not create or retrieve user profile');
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      societyType: profile.society_type,
      registeredEvents: profile.registered_events || [],
      createdAt: new Date(profile.created_at),
    };
  },

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return null;

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error || !profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      societyType: profile.society_type,
      registeredEvents: profile.registered_events || [],
      createdAt: new Date(profile.created_at),
    };
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        society_type: updates.societyType,
      })
      .eq('id', userId);

    if (error) throw error;
  },
};
