import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common';
import { APP_THEME } from '../../utils/constants';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  color = APP_THEME.colors.primary,
}) => {
  return (
    <Card style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: APP_THEME.spacing.xs,
  },
  title: {
    fontSize: 14,
    color: APP_THEME.colors.textSecondary,
    marginBottom: APP_THEME.spacing.xs,
    textAlign: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: APP_THEME.spacing.xs,
  },
  subtitle: {
    fontSize: 12,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
  },
});
