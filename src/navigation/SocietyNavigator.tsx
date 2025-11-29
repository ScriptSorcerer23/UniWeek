import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SocietyDashboard } from '../screens/society/SocietyDashboard';
import { APP_THEME } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Dashboard" 
      component={SocietyDashboard}
      options={{ title: 'My Events' }}
    />
  </Stack.Navigator>
);

export const SocietyNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: any) => {
          let iconName: any;

          if (route.name === 'Events') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: APP_THEME.colors.primary,
        tabBarInactiveTintColor: APP_THEME.colors.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Events" component={DashboardStack} options={{ title: 'My Events' }} />
      <Tab.Screen name="Analytics" component={DashboardStack} />
      <Tab.Screen name="Profile" component={DashboardStack} />
    </Tab.Navigator>
  );
};
