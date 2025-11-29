import React from 'react';
import { TextInput, StyleSheet, View, Text, TextInputProps } from 'react-native';
import { APP_THEME } from '../../utils/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, ...props }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : undefined, style]}
        placeholderTextColor={APP_THEME.colors.textSecondary}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: APP_THEME.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginBottom: APP_THEME.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
    borderRadius: APP_THEME.borderRadius.md,
    padding: APP_THEME.spacing.md,
    fontSize: 16,
    backgroundColor: APP_THEME.colors.surface,
  },
  inputError: {
    borderColor: APP_THEME.colors.error,
  },
  errorText: {
    color: APP_THEME.colors.error,
    fontSize: 12,
    marginTop: APP_THEME.spacing.xs,
  },
});
