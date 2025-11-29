import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import * as Animatable from 'react-native-animatable';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const gradientColors = useRef(new Animated.Value(0)).current;
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showTitle, setShowTitle] = useState(false);
  const [titleText, setTitleText] = useState('');
  const [sound, setSound] = useState<Audio.Sound>();

  // Function to handle navigation
  const handleNavigate = () => {
    console.log('Splash screen: Navigating to OnboardingScreen1');
    try {
      navigation.navigate('OnboardingScreen1' as never);
    } catch (error) {
      console.error('Navigation error from splash screen:', error);
    }
  };

  // Create floating particles
  useEffect(() => {
    const createParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 4 + 2,
          opacity: new Animated.Value(Math.random() * 0.6 + 0.2),
          translateY: new Animated.Value(0),
        });
      }
      setParticles(newParticles);
    };

    createParticles();
  }, []);

  // Animate particles
  useEffect(() => {
    particles.forEach((particle) => {
      const animateParticle = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(particle.translateY, {
              toValue: -50,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: 50,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();

        Animated.loop(
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.2,
              duration: 2000 + Math.random() * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0.8,
              duration: 2000 + Math.random() * 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      setTimeout(animateParticle, Math.random() * 1000);
    });
  }, [particles]);

  // Play sound effect (optional) - Disabled to prevent loading issues
  const playSound = async () => {
    // Sound playback disabled - can be re-enabled with local sound files
    // This prevents external URL loading delays
  };

  // Typewriter effect for title
  useEffect(() => {
    const fullText = 'UniWeek';
    let currentIndex = 0;
    
    const typeWriter = () => {
      if (currentIndex < fullText.length) {
        setTitleText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeWriter, 150);
      }
    };

    const timer = setTimeout(() => {
      setShowTitle(true);
      typeWriter();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Main animation sequence
  useEffect(() => {
    const startAnimations = () => {
      // Logo scale and rotation animation
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start();

      // Progress bar animation
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();

      // Background gradient animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(gradientColors, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(gradientColors, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Play sound effect
      playSound();
    };

    startAnimations();

    // Navigate to next screen after 3 seconds (increased from 2.5)
    const navigationTimer = setTimeout(() => {
      handleNavigate();
    }, 3000);

    return () => {
      clearTimeout(navigationTimer);
      sound?.unloadAsync();
    };
  }, [navigation, logoScale, logoRotation, progressWidth, gradientColors, sound]);

  // Animated gradient colors
  const animatedGradientColors = gradientColors.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const gradientColorStart = animatedGradientColors.interpolate({
    inputRange: [0, 1],
    outputRange: ['#667eea', '#764ba2'],
  });

  const gradientColorEnd = animatedGradientColors.interpolate({
    inputRange: [0, 1],
    outputRange: ['#764ba2', '#667eea'],
  });

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });

  return (
    <TouchableWithoutFeedback onPress={handleNavigate}>
      <View style={styles.container}>
        <StatusBar hidden />
      
      {/* Animated Gradient Background */}
      <Animated.View style={styles.gradientContainer}>
        <LinearGradient
          colors={['#6200EE', '#3700B3', '#03DAC6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Particle Background */}
      <View style={styles.particleContainer}>
        <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
          {particles.map((particle) => (
            <Animated.View
              key={particle.id}
              style={{
                position: 'absolute',
                left: particle.x,
                top: particle.y,
                opacity: particle.opacity,
                transform: [{ translateY: particle.translateY }],
              }}
            >
              <Circle
                r={particle.size}
                fill="rgba(255, 255, 255, 0.6)"
                opacity={0.7}
              />
            </Animated.View>
          ))}
        </Svg>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: logoScale },
                { rotate: logoRotationInterpolate },
              ],
            },
          ]}
        >
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={2000}
            style={styles.logo}
          >
            <View style={styles.logoIcon}>
              <Text style={styles.logoText}>📅</Text>
            </View>
          </Animatable.View>
        </Animated.View>

        {/* App Title with Typewriter Effect */}
        {showTitle && (
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            style={styles.titleContainer}
          >
            <Text style={styles.appTitle}>{titleText}</Text>
            <Animatable.View
              animation="fadeIn"
              delay={1000}
              style={styles.subtitleContainer}
            >
              <Text style={styles.subtitle}>University Event Management</Text>
            </Animatable.View>
          </Animatable.View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Animatable.Text
          animation="fadeIn"
          delay={500}
          style={styles.loadingText}
        >
          Loading amazing features...
        </Animatable.Text>
      </View>

      {/* Floating Elements */}
      <Animatable.View
        animation="bounceIn"
        delay={1500}
        style={styles.floatingElement1}
      >
        <Text style={styles.floatingIcon}>🎓</Text>
      </Animatable.View>

      <Animatable.View
        animation="bounceIn"
        delay={1800}
        style={styles.floatingElement2}
      >
        <Text style={styles.floatingIcon}>🎪</Text>
      </Animatable.View>

      <Animatable.View
        animation="bounceIn"
        delay={2100}
        style={styles.floatingElement3}
      >
        <Text style={styles.floatingIcon}>🏆</Text>
      </Animatable.View>
    </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitleContainer: {
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 1,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 60,
    left: 40,
    right: 40,
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#03DAC6',
    borderRadius: 2,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '300',
  },
  floatingElement1: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.1,
  },
  floatingElement2: {
    position: 'absolute',
    top: height * 0.25,
    right: width * 0.15,
  },
  floatingElement3: {
    position: 'absolute',
    bottom: height * 0.25,
    left: width * 0.2,
  },
  floatingIcon: {
    fontSize: 24,
    opacity: 0.7,
  },
});

export default SplashScreen;