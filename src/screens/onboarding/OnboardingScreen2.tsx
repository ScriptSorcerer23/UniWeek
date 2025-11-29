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
import Svg, { Path, Circle, Rect, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Animated Smartphone Illustration with One-Tap Magic
const SmartphoneIllustration = () => {
  return (
    <Svg width={280} height={280} viewBox="0 0 280 280">
      {/* Phone outline */}
      <G>
        <Rect
          x="80"
          y="40"
          width="120"
          height="200"
          rx="16"
          fill="#FAFAFA"
          stroke="#E0E0E0"
          strokeWidth="3"
        />
        
        {/* Phone screen */}
        <Rect
          x="87"
          y="55"
          width="106"
          height="170"
          rx="8"
          fill="#FFFFFF"
        />
        
        {/* Notch */}
        <Rect
          x="115"
          y="40"
          width="50"
          height="15"
          rx="8"
          fill="#E0E0E0"
        />
        
        {/* Event Card on Screen */}
        <G>
          <Rect
            x="95"
            y="70"
            width="90"
            height="75"
            rx="8"
            fill="#6200EE"
            opacity="0.95"
          />
          
          {/* Event icon */}
          <Circle cx="108" cy="85" r="6" fill="#FFFFFF" opacity="0.9" />
          
          {/* Event title lines */}
          <Rect x="118" y="82" width="55" height="6" rx="3" fill="#FFFFFF" opacity="0.9" />
          <Rect x="118" y="93" width="45" height="4" rx="2" fill="#FFFFFF" opacity="0.7" />
          <Rect x="118" y="100" width="38" height="4" rx="2" fill="#FFFFFF" opacity="0.7" />
          
          {/* Register Button Highlight */}
          <Rect
            x="102"
            y="115"
            width="70"
            height="22"
            rx="11"
            fill="#FFD700"
          />
          {/* Register text indicator - represented by golden button */}
          <Circle cx="137" cy="124" r="2" fill="#6200EE" />
        </G>
        
        {/* Confirmation badge */}
        <G>
          <Circle cx="165" cy="155" r="18" fill="#4CAF50" />
          <Path
            d="M 158 155 L 163 160 L 172 150"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </G>
      
      {/* Floating Feature Icons with Pulse Animation */}
      {/* Bell Icon - Notifications */}
      <G>
        <Circle cx="230" cy="90" r="22" fill="#E3F2FD" />
        <Path
          d="M 230 80 Q 226 80, 226 85 L 226 92 Q 226 95, 222 98 L 238 98 Q 234 95, 234 92 L 234 85 Q 234 80, 230 80 Z"
          fill="#2196F3"
        />
        <Circle cx="230" cy="100" r="2.5" fill="#2196F3" />
        {/* Notification badge */}
        <Circle cx="237" cy="83" r="5" fill="#FF5252" />
      </G>
      
      {/* Calendar Icon - Instant Add */}
      <G>
        <Circle cx="50" cy="130" r="22" fill="#FFF3E0" />
        <Rect
          x="42"
          y="124"
          width="16"
          height="14"
          rx="2"
          fill="#FF9800"
        />
        <Rect x="42" y="122" width="16" height="4" rx="2" fill="#FF9800" />
        <Circle cx="46" cy="133" r="1.5" fill="#FFFFFF" />
        <Circle cx="50" cy="133" r="1.5" fill="#FFFFFF" />
        <Circle cx="54" cy="133" r="1.5" fill="#FFFFFF" />
      </G>
      
      {/* Checkmark Icon - Confirmed */}
      <G>
        <Circle cx="225" cy="190" r="22" fill="#E8F5E9" />
        <Circle cx="225" cy="190" r="12" fill="#4CAF50" />
        <Path
          d="M 220 190 L 223 193 L 230 186"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </G>
      
      {/* Magic Sparkles */}
      <G>
        <Path d="M 60 80 L 62 85 L 67 87 L 62 89 L 60 94 L 58 89 L 53 87 L 58 85 Z" fill="#FFD700" opacity="0.8" />
        <Path d="M 210 210 L 212 215 L 217 217 L 212 219 L 210 224 L 208 219 L 203 217 L 208 215 Z" fill="#FFD700" opacity="0.8" />
        <Path d="M 45 195 L 46 198 L 49 199 L 46 200 L 45 203 L 44 200 L 41 199 L 44 198 Z" fill="#FFD700" opacity="0.6" />
      </G>
      
      {/* Decorative circles */}
      <Circle cx="240" cy="240" r="10" fill="#E3F2FD" opacity="0.5" />
      <Circle cx="30" cy="60" r="8" fill="#FFF3E0" opacity="0.6" />
      <Circle cx="250" cy="140" r="7" fill="#E8F5E9" opacity="0.5" />
    </Svg>
  );
};

// Feature Icon Component with Pulse
const FeatureIcon: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  delay: number;
}> = ({ icon, label, color, delay }) => {
  return (
    <Animatable.View
      animation="bounceIn"
      delay={delay}
      duration={800}
      style={styles.featureItem}
    >
      <View style={[styles.featureIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
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

export const OnboardingScreen2: React.FC = () => {
  const navigation = useNavigation();

  const handleSkip = () => {
    navigation.navigate('Signup' as never);
  };

  const handleNext = () => {
    navigation.navigate('OnboardingScreen3' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Skip Button */}
      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Pagination Dots */}
      <PaginationDots currentPage={1} totalPages={3} />

      {/* Main Content */}
      <Animatable.View
        animation="fadeInRight"
        duration={800}
        style={styles.content}
      >
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <SmartphoneIllustration />
        </View>

        {/* Heading */}
        <Animatable.Text
          animation="fadeInUp"
          delay={400}
          duration={600}
          style={styles.heading}
        >
          One-Tap Registration
        </Animatable.Text>

        {/* Description */}
        <Animatable.Text
          animation="fadeInUp"
          delay={600}
          duration={600}
          style={styles.description}
        >
          Register for events instantly with a single tap. Get immediate confirmation
          and automatic calendar sync!
        </Animatable.Text>

        {/* Feature Icons */}
        <View style={styles.featuresContainer}>
          <FeatureIcon
            icon="notifications"
            label="Instant Alerts"
            color="#2196F3"
            delay={1000}
          />
          <FeatureIcon
            icon="calendar"
            label="Auto Calendar"
            color="#FF9800"
            delay={1200}
          />
          <FeatureIcon
            icon="checkmark-circle"
            label="Confirmed"
            color="#4CAF50"
            delay={1400}
          />
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
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 8,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  featureLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
    textAlign: 'center',
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
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E3F2FD',
    opacity: 0.3,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    opacity: 0.4,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: '40%',
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    opacity: 0.35,
  },
});

export default OnboardingScreen2;
