import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Button, Input } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { APP_THEME } from '../../utils/constants';
import { isValidEmail } from '../../utils/helpers';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validation
    if (!email) {
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

    try {
      await login(email, password);
      // Navigation will be handled by AuthNavigator
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to UniWeek</Text>
          <Text style={styles.subtitle}>Login to your account</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            secureTextEntry
          />

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Button
              title="Sign Up"
              onPress={() => navigation.navigate('Signup')}
              variant="outline"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: APP_THEME.spacing.lg,
  },
  header: {
    marginBottom: APP_THEME.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: APP_THEME.colors.text,
    marginBottom: APP_THEME.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: APP_THEME.colors.textSecondary,
  },
  form: {
    marginBottom: APP_THEME.spacing.xl,
  },
  loginButton: {
    marginTop: APP_THEME.spacing.md,
  },
  signupContainer: {
    marginTop: APP_THEME.spacing.lg,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    marginBottom: APP_THEME.spacing.sm,
  },
});
