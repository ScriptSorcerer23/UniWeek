import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { TextInput, ActivityIndicator, Menu } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { UserRole, SocietyType } from '../../types';
import { isValidEmail } from '../../utils/helpers';

const { width } = Dimensions.get('window');

// Society colors
const SOCIETY_COLORS = {
  ACM: '#3B82F6', // Blue
  CLS: '#10B981', // Green
  CSS: '#F97316', // Orange
};

export const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [societyType, setSocietyType] = useState<SocietyType>('ACM');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [roleError, setRoleError] = useState('');
  
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  
  const { signup, loading } = useAuth();

  const handleSignup = async () => {
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setRoleError('');

    // Validation
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Invalid email format');
      return;
    }
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }
    if (!role) {
      setRoleError('Please select your role');
      return;
    }

    try {
      await signup(
        email.trim(),
        password,
        name.trim(),
        role as UserRole,
        role === 'society' ? societyType : undefined
      );
      // Store session in AsyncStorage
      await AsyncStorage.setItem('userEmail', email.trim());
      // Navigation will be handled by AuthContext
    } catch (error: any) {
      if (error.message?.includes('Email confirmation')) {
        setEmailError('Please check your email to confirm your account');
      } else {
        setEmailError(error.message || 'Could not create account');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Header */}
          <Animatable.View
            animation="fadeInDown"
            duration={1000}
            style={styles.header}
          >
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join UniWeek today</Text>
          </Animatable.View>

          {/* Form Container */}
          <Animatable.View
            animation="fadeInUp"
            delay={200}
            duration={1000}
            style={styles.formContainer}
          >
            {/* Name Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                mode="outlined"
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setNameError('');
                }}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                autoCapitalize="words"
                left={
                  <TextInput.Icon
                    icon={() => (
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={nameFocused ? '#667eea' : '#999'}
                      />
                    )}
                  />
                }
                style={styles.input}
                outlineColor="rgba(255, 255, 255, 0.3)"
                activeOutlineColor="#667eea"
                theme={{
                  colors: {
                    background: 'rgba(255, 255, 255, 0.9)',
                    text: '#333',
                    placeholder: '#999',
                  },
                }}
              />
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                mode="outlined"
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={
                  <TextInput.Icon
                    icon={() => (
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={emailFocused ? '#667eea' : '#999'}
                      />
                    )}
                  />
                }
                style={styles.input}
                outlineColor="rgba(255, 255, 255, 0.3)"
                activeOutlineColor="#667eea"
                theme={{
                  colors: {
                    background: 'rgba(255, 255, 255, 0.9)',
                    text: '#333',
                    placeholder: '#999',
                  },
                }}
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                mode="outlined"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                left={
                  <TextInput.Icon
                    icon={() => (
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={passwordFocused ? '#667eea' : '#999'}
                      />
                    )}
                  />
                }
                right={
                  <TextInput.Icon
                    icon={() => (
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#999"
                      />
                    )}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                outlineColor="rgba(255, 255, 255, 0.3)"
                activeOutlineColor="#667eea"
                theme={{
                  colors: {
                    background: 'rgba(255, 255, 255, 0.9)',
                    text: '#333',
                    placeholder: '#999',
                  },
                }}
              />
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                mode="outlined"
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setConfirmPasswordError('');
                }}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                left={
                  <TextInput.Icon
                    icon={() => (
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={confirmPasswordFocused ? '#667eea' : '#999'}
                      />
                    )}
                  />
                }
                right={
                  <TextInput.Icon
                    icon={() => (
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#999"
                      />
                    )}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                style={styles.input}
                outlineColor="rgba(255, 255, 255, 0.3)"
                activeOutlineColor="#667eea"
                theme={{
                  colors: {
                    background: 'rgba(255, 255, 255, 0.9)',
                    text: '#333',
                    placeholder: '#999',
                  },
                }}
              />
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>I am a</Text>
              <View style={styles.roleCards}>
                {/* Student Card */}
                <TouchableOpacity
                  onPress={() => {
                    setRole('student');
                    setRoleError('');
                  }}
                  activeOpacity={0.8}
                >
                  <Animatable.View
                    animation={role === 'student' ? 'pulse' : undefined}
                    style={[
                      styles.roleCard,
                      role === 'student' && styles.roleCardSelected,
                    ]}
                  >
                    <Ionicons
                      name="school-outline"
                      size={32}
                      color={role === 'student' ? '#667eea' : '#999'}
                    />
                    <Text
                      style={[
                        styles.roleCardText,
                        role === 'student' && styles.roleCardTextSelected,
                      ]}
                    >
                      Student
                    </Text>
                    {role === 'student' && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={24} color="#667eea" />
                      </View>
                    )}
                  </Animatable.View>
                </TouchableOpacity>

                {/* Society Handler Card */}
                <TouchableOpacity
                  onPress={() => {
                    setRole('society');
                    setRoleError('');
                  }}
                  activeOpacity={0.8}
                >
                  <Animatable.View
                    animation={role === 'society' ? 'pulse' : undefined}
                    style={[
                      styles.roleCard,
                      role === 'society' && styles.roleCardSelected,
                    ]}
                  >
                    <Ionicons
                      name="people-outline"
                      size={32}
                      color={role === 'society' ? '#667eea' : '#999'}
                    />
                    <Text
                      style={[
                        styles.roleCardText,
                        role === 'society' && styles.roleCardTextSelected,
                      ]}
                    >
                      Society Handler
                    </Text>
                    {role === 'society' && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={24} color="#667eea" />
                      </View>
                    )}
                  </Animatable.View>
                </TouchableOpacity>
              </View>
              {roleError ? (
                <Text style={styles.errorText}>{roleError}</Text>
              ) : null}
            </View>

            {/* Society Type Dropdown */}
            {role === 'society' && (
              <Animatable.View
                animation="fadeInDown"
                duration={500}
                style={styles.societyContainer}
              >
                <Text style={styles.societyLabel}>Select Your Society</Text>
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <TouchableOpacity
                      style={styles.societySelector}
                      onPress={() => setMenuVisible(true)}
                    >
                      <View
                        style={[
                          styles.societyBadge,
                          { backgroundColor: SOCIETY_COLORS[societyType] },
                        ]}
                      >
                        <Text style={styles.societyBadgeText}>{societyType}</Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color="#333" />
                    </TouchableOpacity>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setSocietyType('ACM');
                      setMenuVisible(false);
                    }}
                    title="ACM"
                    leadingIcon={() => (
                      <View
                        style={[
                          styles.menuBadge,
                          { backgroundColor: SOCIETY_COLORS.ACM },
                        ]}
                      />
                    )}
                  />
                  <Menu.Item
                    onPress={() => {
                      setSocietyType('CLS');
                      setMenuVisible(false);
                    }}
                    title="CLS"
                    leadingIcon={() => (
                      <View
                        style={[
                          styles.menuBadge,
                          { backgroundColor: SOCIETY_COLORS.CLS },
                        ]}
                      />
                    )}
                  />
                  <Menu.Item
                    onPress={() => {
                      setSocietyType('CSS');
                      setMenuVisible(false);
                    }}
                    title="CSS"
                    leadingIcon={() => (
                      <View
                        style={[
                          styles.menuBadge,
                          { backgroundColor: SOCIETY_COLORS.CSS },
                        ]}
                      />
                    )}
                  />
                </Menu>
              </Animatable.View>
            )}

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.signupButtonContainer}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.signupButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.signupButtonText}>Sign Up</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  roleContainer: {
    marginBottom: 20,
    marginTop: 8,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleCards: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 120,
    position: 'relative',
  },
  roleCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#fff',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  roleCardText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  roleCardTextSelected: {
    color: '#667eea',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  societyContainer: {
    marginBottom: 20,
  },
  societyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  societySelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  societyBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  societyBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  menuBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  signupButtonContainer: {
    marginTop: 24,
  },
  signupButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  loginLink: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
