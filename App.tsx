import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { EventProvider } from './src/context/EventContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { notificationService } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    // Request notification permissions on app start
    notificationService.requestPermissions();
  }, []);

  return (
    <PaperProvider>
      <AuthProvider>
        <EventProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </EventProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
