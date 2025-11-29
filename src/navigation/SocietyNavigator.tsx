import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { SocietyDashboard } from '../screens/society/SocietyDashboard';
import { CreateEventScreen } from '../screens/society/CreateEventScreen';
import { EditEventScreen } from '../screens/society/EditEventScreen';
import { EventRegistrationsScreen } from '../screens/society/EventRegistrationsScreen';
import { SendNotificationScreen } from '../screens/society/SendNotificationScreen';
import { AnalyticsDashboard } from '../screens/society/AnalyticsDashboard';
import { ProfileScreen, SettingsScreen, NotificationsScreen } from '../screens/common';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Notifications Stack Navigator
const NotificationsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="NotificationsInbox" component={NotificationsScreen} />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileView" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="NotificationsView" component={NotificationsScreen} />
    </Stack.Navigator>
  );
};

// Home Stack Navigator for Dashboard, Create Event, Edit Event, Registrations, and Send Notification
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Dashboard" component={SocietyDashboard} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="EditEvent" component={EditEventScreen as any} />
      <Stack.Screen name="EventRegistrations" component={EventRegistrationsScreen as any} />
      <Stack.Screen name="SendNotification" component={SendNotificationScreen as any} />
    </Stack.Navigator>
  );
};

export const SocietyNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: any) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Analytics" component={AnalyticsDashboard} />
      <Tab.Screen name="Notifications" component={NotificationsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};
