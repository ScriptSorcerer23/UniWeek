import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Animated particle component
const Particle: React.FC<{ delay: number }> = ({ delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(moveAnim, {
            toValue: -100,
            duration: 4000,
            delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(moveAnim, {
            toValue: -200,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const randomLeft = Math.random() * width;
  const randomSize = 20 + Math.random() * 40;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: randomLeft,
          width: randomSize,
          height: randomSize,
          opacity: fadeAnim,
          transform: [{ translateY: moveAnim }],
        },
      ]}
    />
  );
};

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Animated Particles Background */}
      <View style={styles.particlesContainer}>
        {[...Array(15)].map((_, index) => (
          <Particle key={index} delay={index * 300} />
        ))}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo/Icon */}
        <Animatable.View
          animation="fadeIn"
          duration={1500}
          style={styles.logoContainer}
        >
          <View style={styles.logoCircle}>
            <Ionicons name="calendar" size={80} color="#fff" />
          </View>
        </Animatable.View>

        {/* App Name */}
        <Animatable.View
          animation="fadeInUp"
          delay={500}
          duration={1000}
          style={styles.titleContainer}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleGradient}
          >
            <Text style={styles.title}>UniWeek</Text>
          </LinearGradient>
        </Animatable.View>

        {/* Tagline */}
        <Animatable.Text
          animation="fadeInUp"
          delay={800}
          duration={1000}
          style={styles.tagline}
        >
          Your Campus Events, Simplified
        </Animatable.Text>

        {/* Buttons Container */}
        <Animatable.View
          animation="fadeInUp"
          delay={1100}
          duration={1000}
          style={styles.buttonsContainer}
        >
          {/* Login Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Footer */}
        <Animatable.Text
          animation="fadeIn"
          delay={1500}
          duration={1000}
          style={styles.footer}
        >
          Connect • Engage • Participate
        </Animatable.Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    bottom: height,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  titleContainer: {
    marginBottom: 15,
  },
  titleGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 60,
    fontWeight: '400',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
