import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button, Input } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { UserRole, SocietyType } from '../../types';
import { APP_THEME } from '../../utils/constants';
import { isValidEmail } from '../../utils/helpers';

export const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [societyType, setSocietyType] = useState<SocietyType>('ACM');
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const { signup, loading } = useAuth();

  const handleSignup = async () => {
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validation
    if (!name) {
      setNameError('Name is required');
      return;
    }
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
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    try {
      await signup(email, password, name, role, role === 'society' ? societyType : undefined);
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Could not create account');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join UniWeek today</Text>
      </View>

      <Input
        label="Full Name"
        placeholder="Enter your full name"
        value={name}
        onChangeText={setName}
        error={nameError}
      />

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

      <Input
        label="Confirm Password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={confirmPasswordError}
        secureTextEntry
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>I am a</Text>
        <View style={styles.picker}>
          <Picker
            selectedValue={role}
            onValueChange={(value) => setRole(value as UserRole)}
          >
            <Picker.Item label="Student" value="student" />
            <Picker.Item label="Society Handler" value="society" />
          </Picker>
        </View>
      </View>

      {role === 'society' && (
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Society</Text>
          <View style={styles.picker}>
            <Picker
              selectedValue={societyType}
              onValueChange={(value) => setSocietyType(value as SocietyType)}
            >
              <Picker.Item label="ACM" value="ACM" />
              <Picker.Item label="CLS" value="CLS" />
              <Picker.Item label="CSS" value="CSS" />
            </Picker>
          </View>
        </View>
      )}

      <Button
        title="Sign Up"
        onPress={handleSignup}
        loading={loading}
        style={styles.signupButton}
      />

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <Button
          title="Login"
          onPress={() => navigation.navigate('Login')}
          variant="outline"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  content: {
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
  pickerContainer: {
    marginBottom: APP_THEME.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginBottom: APP_THEME.spacing.xs,
  },
  picker: {
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
    borderRadius: APP_THEME.borderRadius.md,
    backgroundColor: APP_THEME.colors.surface,
  },
  signupButton: {
    marginTop: APP_THEME.spacing.md,
  },
  loginContainer: {
    marginTop: APP_THEME.spacing.lg,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    marginBottom: APP_THEME.spacing.sm,
  },
});
