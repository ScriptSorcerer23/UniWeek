import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StudentDashboard } from '../screens/student/StudentDashboard';
import { EventDetails } from '../screens/student/EventDetails';
import { APP_THEME } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Dashboard" 
      component={StudentDashboard}
      options={{ title: 'Browse Events' }}
    />
    <Stack.Screen 
      name="EventDetails" 
      component={EventDetails}
      options={{ title: 'Event Details' }}
    />
  </Stack.Navigator>
);

export const StudentNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: any) => {
          let iconName: any;

          if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'MyEvents') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
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
      <Tab.Screen name="Events" component={DashboardStack} />
      <Tab.Screen name="MyEvents" component={DashboardStack} options={{ title: 'My Events' }} />
      <Tab.Screen name="Profile" component={DashboardStack} />
    </Tab.Navigator>
  );
};
