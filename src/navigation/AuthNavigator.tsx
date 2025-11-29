import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen1 } from '../screens/onboarding/OnboardingScreen1';
import { OnboardingScreen2 } from '../screens/onboarding/OnboardingScreen2';
import { OnboardingScreen3 } from '../screens/onboarding/OnboardingScreen3';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';

const Stack = createStackNavigator();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable swipe gestures for controlled flow
      }}
      initialRouteName="Splash"
    >
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="OnboardingScreen1" 
        component={OnboardingScreen1}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="OnboardingScreen2" 
        component={OnboardingScreen2}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="OnboardingScreen3" 
        component={OnboardingScreen3}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="WelcomeScreen" 
        component={WelcomeScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};
