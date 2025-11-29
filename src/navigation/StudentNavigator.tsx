import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StudentDashboard } from '../screens/student/StudentDashboard';
import { EventDetails } from '../screens/student/EventDetails';
import { MyEventsScreen } from '../screens/student/MyEventsScreen';
import { CalendarViewScreen } from '../screens/student/CalendarView';
import { RateEventScreen } from '../screens/student/RateEventScreen';
import { SearchFilterScreen } from '../screens/student/SearchFilterScreen';
import { ProfileScreen, SettingsScreen, NotificationsScreen } from '../screens/common';
import { APP_THEME } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Dashboard" 
      component={StudentDashboard}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="EventDetails" 
      component={EventDetails}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="SearchFilter" 
      component={SearchFilterScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const MyEventsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MyEventsList" 
      component={MyEventsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="EventDetails" 
      component={EventDetails}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="RateEvent" 
      component={RateEventScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const CalendarStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="CalendarView" 
      component={CalendarViewScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="EventDetails" 
      component={EventDetails}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ProfileView" 
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Notifications" 
      component={NotificationsScreen}
      options={{ headerShown: false }}
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
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyEvents') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
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
      <Tab.Screen name="Events" component={DashboardStack} options={{ title: 'Home' }} />
      <Tab.Screen name="MyEvents" component={MyEventsStack} options={{ title: 'My Events' }} />
      <Tab.Screen name="Calendar" component={CalendarStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};
