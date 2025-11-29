import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polyline, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Analytics Chart Illustration
const AnalyticsIllustration = () => {
  return (
    <Svg width={280} height={280} viewBox="0 0 280 280">
      {/* Dashboard Card Background */}
      <Rect
        x="40"
        y="50"
        width="200"
        height="180"
        rx="16"
        fill="#F5F5F5"
        stroke="#E0E0E0"
        strokeWidth="2"
      />
      
      {/* Header Section */}
      <Rect x="50" y="60" width="80" height="12" rx="6" fill="#6200EE" opacity="0.8" />
      <Rect x="200" y="60" width="30" height="12" rx="6" fill="#E0E0E0" />
      
      {/* Bar Chart - Event Attendance Analytics */}
      <G>
        {/* Y-axis labels - represented by tick marks */}
        <Line x1="50" y1="95" x2="53" y2="95" stroke="#999999" strokeWidth="1" />
        <Line x1="50" y1="125" x2="53" y2="125" stroke="#999999" strokeWidth="1" />
        <Line x1="50" y1="155" x2="53" y2="155" stroke="#999999" strokeWidth="1" />
        
        {/* Chart bars with gradient effect */}
        <Rect x="80" y="120" width="20" height="40" rx="4" fill="#2196F3" opacity="0.8" />
        <Rect x="110" y="105" width="20" height="55" rx="4" fill="#4CAF50" opacity="0.8" />
        <Rect x="140" y="130" width="20" height="30" rx="4" fill="#FF9800" opacity="0.8" />
        <Rect x="170" y="110" width="20" height="50" rx="4" fill="#9C27B0" opacity="0.8" />
        <Rect x="200" y="95" width="20" height="65" rx="4" fill="#FF5722" opacity="0.8" />
        
        {/* X-axis tick marks for days */}
        <Line x1="90" y1="160" x2="90" y2="163" stroke="#999999" strokeWidth="1" />
        <Line x1="120" y1="160" x2="120" y2="163" stroke="#999999" strokeWidth="1" />
        <Line x1="150" y1="160" x2="150" y2="163" stroke="#999999" strokeWidth="1" />
        <Line x1="180" y1="160" x2="180" y2="163" stroke="#999999" strokeWidth="1" />
        <Line x1="210" y1="160" x2="210" y2="163" stroke="#999999" strokeWidth="1" />
      </G>
      
      {/* Rating Stars Card */}
      <G>
        <Rect x="50" y="185" width="85" height="35" rx="8" fill="#FFFFFF" />
        
        {/* Stars - 5 stars for rating */}
        <G>
          <Path
            d="M 62 195 L 64 201 L 70 201 L 65 205 L 67 211 L 62 207 L 57 211 L 59 205 L 54 201 L 60 201 Z"
            fill="#FFD700"
            stroke="#FFA000"
            strokeWidth="0.5"
          />
          <Path
            d="M 76 195 L 78 201 L 84 201 L 79 205 L 81 211 L 76 207 L 71 211 L 73 205 L 68 201 L 74 201 Z"
            fill="#FFD700"
            stroke="#FFA000"
            strokeWidth="0.5"
          />
          <Path
            d="M 90 195 L 92 201 L 98 201 L 93 205 L 95 211 L 90 207 L 85 211 L 87 205 L 82 201 L 88 201 Z"
            fill="#FFD700"
            stroke="#FFA000"
            strokeWidth="0.5"
          />
          <Path
            d="M 104 195 L 106 201 L 112 201 L 107 205 L 109 211 L 104 207 L 99 211 L 101 205 L 96 201 L 102 201 Z"
            fill="#FFD700"
            stroke="#FFA000"
            strokeWidth="0.5"
          />
          <Path
            d="M 118 195 L 120 201 L 126 201 L 121 205 L 123 211 L 118 207 L 113 211 L 115 205 L 110 201 L 116 201 Z"
            fill="#FFD700"
            stroke="#FFA000"
            strokeWidth="0.5"
          />
        </G>
        {/* Rating indicator - 5 golden stars represent perfect 5.0 */}
      </G>
      
      {/* Calendar Mini Widget */}
      <G>
        <Rect x="145" y="185" width="85" height="35" rx="8" fill="#FFFFFF" />
        
        {/* Calendar icon */}
        <Rect x="155" y="193" width="20" height="18" rx="2" fill="#4CAF50" opacity="0.2" />
        <Rect x="155" y="191" width="20" height="5" rx="2" fill="#4CAF50" />
        
        {/* Calendar dots */}
        <Circle cx="159" cy="200" r="1.5" fill="#4CAF50" />
        <Circle cx="165" cy="200" r="1.5" fill="#4CAF50" />
        <Circle cx="171" cy="200" r="1.5" fill="#4CAF50" />
        <Circle cx="159" cy="206" r="1.5" fill="#4CAF50" />
        <Circle cx="165" cy="206" r="1.5" fill="#FF5722" /> {/* Highlighted event */}
        <Circle cx="171" cy="206" r="1.5" fill="#4CAF50" />
        {/* Event count represented by highlighted calendar dots */}
      </G>
      
      {/* Floating Share Icon */}
      <G>
        <Circle cx="245" cy="120" r="20" fill="#6200EE" opacity="0.9" />
        <Path
          d="M 238 120 L 252 120 M 245 113 L 245 127 M 249 117 L 245 113 L 241 117"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </G>
      
      {/* Floating Feedback Icon */}
      <G>
        <Circle cx="30" cy="100" r="18" fill="#FF9800" opacity="0.9" />
        <Rect x="22" y="95" width="16" height="12" rx="2" fill="#FFFFFF" />
        <Line x1="25" y1="98" x2="35" y2="98" stroke="#FF9800" strokeWidth="1.5" />
        <Line x1="25" y1="102" x2="32" y2="102" stroke="#FF9800" strokeWidth="1.5" />
      </G>
      
      {/* Success Checkmarks */}
      <G>
        <Circle cx="35" cy="190" r="12" fill="#4CAF50" opacity="0.2" />
        <Path
          d="M 30 190 L 33 193 L 40 186"
          stroke="#4CAF50"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </G>
      
      {/* Decorative sparkles */}
      <Path d="M 250 70 L 252 75 L 257 77 L 252 79 L 250 84 L 248 79 L 243 77 L 248 75 Z" fill="#FFD700" opacity="0.7" />
      <Path d="M 25 145 L 27 150 L 32 152 L 27 154 L 25 159 L 23 154 L 18 152 L 23 150 Z" fill="#FFD700" opacity="0.6" />
      <Path d="M 235 210 L 236 213 L 239 214 L 236 215 L 235 218 L 234 215 L 231 214 L 234 213 Z" fill="#FFD700" opacity="0.5" />
      
      {/* Decorative circles */}
      <Circle cx="260" cy="180" r="8" fill="#E3F2FD" opacity="0.6" />
      <Circle cx="20" cy="70" r="10" fill="#FFF3E0" opacity="0.5" />
    </Svg>
  );
};

// Feature Badge Component
const FeatureBadge: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  delay: number;
}> = ({ icon, label, color, delay }) => {
  return (
    <Animatable.View
      animation="zoomIn"
      delay={delay}
      duration={600}
      style={styles.featureBadge}
    >
      <View style={[styles.badgeIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.badgeLabel}>{label}</Text>
    </Animatable.View>
  );
};

// Pagination Dots
const PaginationDots: React.FC<{ currentPage: number; totalPages: number }> = ({
  currentPage,
  totalPages,
}) => {
  return (
    <View style={styles.paginationContainer}>
      {[...Array(totalPages)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentPage ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
};

// Confetti Component (Simplified to avoid rendering issues)
const Confetti: React.FC = () => {
  const confettiColors = ['#FFD700', '#FF9800', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722'];
  
  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {Array.from({ length: 30 }, (_, index) => {
        const randomColor = confettiColors[index % confettiColors.length];
        const randomLeft = (index * 37) % width;
        const randomDelay = index * 50;
        
        return (
          <Animatable.View
            key={`confetti-${index}`}
            animation={{
              from: {
                translateY: -50,
                opacity: 1,
              },
              to: {
                translateY: height,
                opacity: 0,
              },
            }}
            duration={3000}
            delay={randomDelay}
            iterationCount="infinite"
            style={[
              styles.confettiPiece,
              {
                backgroundColor: randomColor,
                left: randomLeft,
                transform: [{ rotate: `${(index * 24) % 360}deg` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export const OnboardingScreen3: React.FC = () => {
  const navigation = useNavigation();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti after a delay - DISABLED for now
    const timer = setTimeout(() => {
      // setShowConfetti(true); // Disabled
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = async () => {
    try {
      // Set onboarding completion flag
      await AsyncStorage.setItem('onboardingComplete', 'true');
      
      // Navigate to Welcome screen
      navigation.navigate('WelcomeScreen' as never);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      // Still navigate even if AsyncStorage fails
      navigation.navigate('WelcomeScreen' as never);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Confetti Animation */}
      {showConfetti && <Confetti />}

      {/* Pagination Dots */}
      <PaginationDots currentPage={2} totalPages={3} />

      {/* Main Content */}
      <Animatable.View
        animation="fadeInRight"
        duration={800}
        style={styles.content}
      >
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <AnalyticsIllustration />
        </View>

        {/* Heading */}
        <Animatable.Text
          animation="fadeInUp"
          delay={400}
          duration={600}
          style={styles.heading}
        >
          Track & Share Feedback
        </Animatable.Text>

        {/* Description */}
        <Animatable.Text
          animation="fadeInUp"
          delay={600}
          duration={600}
          style={styles.description}
        >
          View your event history, rate experiences, and share feedback. Help make
          campus events better for everyone!
        </Animatable.Text>

        {/* Feature Badges */}
        <View style={styles.badgesContainer}>
          <FeatureBadge
            icon="star"
            label="Rate Events"
            color="#FFD700"
            delay={1000}
          />
          <FeatureBadge
            icon="calendar-outline"
            label="Track History"
            color="#4CAF50"
            delay={1200}
          />
          <FeatureBadge
            icon="analytics"
            label="View Stats"
            color="#2196F3"
            delay={1400}
          />
        </View>
      </Animatable.View>

      {/* Get Started Button */}
      <Animatable.View
        animation="fadeInUp"
        delay={1600}
        duration={600}
        style={styles.buttonContainer}
      >
        <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.8}>
          <LinearGradient
            colors={['#6200EE', '#3700B3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.getStartedButton}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
            <Ionicons name="rocket" size={22} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>

      {/* Decorative Background Elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#6200EE',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#E0E0E0',
    borderWidth: 1.5,
    borderColor: '#BDBDBD',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  illustrationContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
    maxWidth: 340,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  featureBadge: {
    alignItems: 'center',
    gap: 6,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeLabel: {
    fontSize: 11,
    color: '#757575',
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#6200EE',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Confetti styles
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 12,
    borderRadius: 2,
  },
  // Decorative background elements
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E8F5E9',
    opacity: 0.3,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF3E0',
    opacity: 0.4,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: '40%',
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    opacity: 0.35,
  },
});

export default OnboardingScreen3;
