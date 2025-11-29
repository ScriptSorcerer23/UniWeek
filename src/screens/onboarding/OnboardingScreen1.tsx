import React from 'react';
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
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Animated Calendar Illustration
const CalendarIllustration = () => {
  return (
    <Svg width={280} height={280} viewBox="0 0 280 280">
      {/* Calendar base */}
      <Rect
        x="40"
        y="60"
        width="200"
        height="180"
        rx="16"
        fill="#F5F5F5"
        stroke="#E0E0E0"
        strokeWidth="2"
      />
      
      {/* Calendar header */}
      <Rect
        x="40"
        y="60"
        width="200"
        height="50"
        rx="16"
        fill="#6200EE"
      />
      <Rect
        x="40"
        y="85"
        width="200"
        height="25"
        fill="#6200EE"
      />
      
      {/* Month indicator */}
      <Rect x="70" y="75" width="60" height="20" rx="10" fill="#FFFFFF" opacity="0.3" />
      
      {/* Event Cards */}
      {/* ACM Event - Blue */}
      <G>
        <Rect
          x="55"
          y="125"
          width="80"
          height="45"
          rx="8"
          fill="#2196F3"
        />
        <Circle cx="65" cy="140" r="3" fill="#FFFFFF" />
        <Rect x="72" y="137" width="40" height="6" rx="3" fill="#FFFFFF" opacity="0.9" />
        <Rect x="72" y="148" width="55" height="4" rx="2" fill="#FFFFFF" opacity="0.6" />
        <Rect x="72" y="155" width="30" height="4" rx="2" fill="#FFFFFF" opacity="0.6" />
      </G>
      
      {/* CLS Event - Green */}
      <G>
        <Rect
          x="145"
          y="125"
          width="80"
          height="45"
          rx="8"
          fill="#4CAF50"
        />
        <Circle cx="155" cy="140" r="3" fill="#FFFFFF" />
        <Rect x="162" y="137" width="40" height="6" rx="3" fill="#FFFFFF" opacity="0.9" />
        <Rect x="162" y="148" width="50" height="4" rx="2" fill="#FFFFFF" opacity="0.6" />
        <Rect x="162" y="155" width="35" height="4" rx="2" fill="#FFFFFF" opacity="0.6" />
      </G>
      
      {/* CSS Event - Orange */}
      <G>
        <Rect
          x="55"
          y="180"
          width="80"
          height="45"
          rx="8"
          fill="#FF9800"
        />
        <Circle cx="65" cy="195" r="3" fill="#FFFFFF" />
        <Rect x="72" y="192" width="45" height="6" rx="3" fill="#FFFFFF" opacity="0.9" />
        <Rect x="72" y="203" width="50" height="4" rx="2" fill="#FFFFFF" opacity="0.6" />
        <Rect x="72" y="210" width="40" height="4" rx="2" fill="#FFFFFF" opacity="0.6" />
      </G>
      
      {/* Students browsing icon */}
      <Circle cx="195" cy="200" r="25" fill="#E3F2FD" />
      <Path
        d="M 195 185 Q 185 190, 185 200 Q 185 210, 195 215 Q 205 210, 205 200 Q 205 190, 195 185 Z"
        fill="#6200EE"
      />
      <Circle cx="190" cy="195" r="2" fill="#FFFFFF" />
      <Circle cx="200" cy="195" r="2" fill="#FFFFFF" />
      
      {/* Decorative elements */}
      <Circle cx="250" cy="80" r="8" fill="#FFD54F" opacity="0.6" />
      <Circle cx="260" cy="120" r="6" fill="#FF9800" opacity="0.5" />
      <Circle cx="30" cy="140" r="10" fill="#4CAF50" opacity="0.4" />
      <Circle cx="20" cy="200" r="7" fill="#2196F3" opacity="0.5" />
    </Svg>
  );
};

// Society Badge Component
const SocietyBadge: React.FC<{
  name: string;
  color: string;
  delay: number;
}> = ({ name, color, delay }) => {
  return (
    <Animatable.View
      animation="bounceIn"
      delay={delay}
      duration={800}
      style={[styles.badge, { backgroundColor: color }]}
    >
      <Text style={styles.badgeText}>{name}</Text>
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

export const OnboardingScreen1: React.FC = () => {
  const navigation = useNavigation();

  const handleSkip = () => {
    navigation.navigate('Signup' as never);
  };

  const handleNext = () => {
    navigation.navigate('OnboardingScreen2' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Skip Button */}
      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Pagination Dots */}
      <PaginationDots currentPage={0} totalPages={3} />

      {/* Main Content */}
      <Animatable.View
        animation="fadeInRight"
        duration={800}
        style={styles.content}
      >
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <CalendarIllustration />
        </View>

        {/* Heading */}
        <Animatable.Text
          animation="fadeInUp"
          delay={400}
          duration={600}
          style={styles.heading}
        >
          Discover Campus Events
        </Animatable.Text>

        {/* Description */}
        <Animatable.Text
          animation="fadeInUp"
          delay={600}
          duration={600}
          style={styles.description}
        >
          Browse events from ACM, CLS, and CSS societies all in one place. Never
          miss what's happening on campus!
        </Animatable.Text>

        {/* Society Badges */}
        <View style={styles.badgesContainer}>
          <SocietyBadge name="ACM" color="#2196F3" delay={1000} />
          <SocietyBadge name="CLS" color="#4CAF50" delay={1200} />
          <SocietyBadge name="CSS" color="#FF9800" delay={1400} />
        </View>
      </Animatable.View>

      {/* Next Button */}
      <Animatable.View
        animation="fadeInUp"
        delay={1600}
        duration={600}
        style={styles.buttonContainer}
      >
        <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
          <LinearGradient
            colors={['#6200EE', '#3700B3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
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
    gap: 12,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  nextButton: {
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
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Decorative background elements
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E3F2FD',
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
    backgroundColor: '#E8F5E9',
    opacity: 0.35,
  },
});

export default OnboardingScreen1;