import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { APP_THEME } from '../../utils/constants';

interface ChartProps {
  data: number[];
  labels: string[];
  title: string;
  type?: 'line' | 'bar';
}

export const Chart: React.FC<ChartProps> = ({ data, labels, title, type = 'bar' }) => {
  const screenWidth = Dimensions.get('window').width - 32;

  const chartConfig = {
    backgroundColor: APP_THEME.colors.surface,
    backgroundGradientFrom: APP_THEME.colors.surface,
    backgroundGradientTo: APP_THEME.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: APP_THEME.colors.primary,
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        data,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {type === 'line' ? (
        <LineChart
          data={chartData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      ) : (
        <BarChart
          data={chartData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=""
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: APP_THEME.spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_THEME.colors.text,
    marginBottom: APP_THEME.spacing.md,
  },
  chart: {
    borderRadius: APP_THEME.borderRadius.lg,
  },
});
