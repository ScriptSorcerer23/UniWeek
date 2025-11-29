import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
}

const onboardingData: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Welcome to UniWeek',
    subtitle: 'Your University Event Hub',
    description: 'Discover, join, and manage university events across ACM, CLS, and CSS societies with ease.',
    icon: 'school-outline',
    color: '#6200EE',
  },
  {
    id: 2,
    title: 'Smart Event Discovery',
    subtitle: 'AI-Powered Recommendations',
    description: 'Get personalized event suggestions based on your interests and past participation.',
    icon: 'bulb-outline',
    color: '#03DAC6',
  },
  {
    id: 3,
    title: 'Seamless Registration',
    subtitle: 'One-Click Registration',
    description: 'Register for events instantly with capacity management and calendar integration.',
    icon: 'checkmark-circle-outline',
    color: '#FF6B6B',
  },
  {
    id: 4,
    title: 'Real-time Updates',
    subtitle: 'Never Miss Out',
    description: 'Receive instant notifications for event updates, reminders, and exclusive announcements.',
    icon: 'notifications-outline',
    color: '#4ECDC4',
  },
];

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<ScrollView>(null);

  const slideAnimation = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate slide entrance
    Animated.spring(slideAnimation, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  const nextSlide = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      flatListRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      navigation.navigate('WelcomeScreen' as never);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      flatListRef.current?.scrollTo({
        x: (currentIndex - 1) * width,
        animated: true,
      });
    }
  };

  const skip = () => {
    navigation.navigate('WelcomeScreen' as never);
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderSlide = (item: OnboardingSlide, index: number) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.slide,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <View style={styles.slideContent}>
          {/* Icon Container */}
          <Animatable.View
            animation="bounceIn"
            duration={1000}
            delay={index === currentIndex ? 300 : 0}
            style={[styles.iconContainer, { backgroundColor: item.color }]}
          >
            <Ionicons name={item.icon as any} size={60} color="white" />
          </Animatable.View>

          {/* Title */}
          <Animatable.Text
            animation="fadeInUp"
            duration={800}
            delay={index === currentIndex ? 500 : 0}
            style={styles.slideTitle}
          >
            {item.title}
          </Animatable.Text>

          {/* Subtitle */}
          <Animatable.Text
            animation="fadeInUp"
            duration={800}
            delay={index === currentIndex ? 600 : 0}
            style={[styles.slideSubtitle, { color: item.color }]}
          >
            {item.subtitle}
          </Animatable.Text>

          {/* Description */}
          <Animatable.Text
            animation="fadeInUp"
            duration={800}
            delay={index === currentIndex ? 700 : 0}
            style={styles.slideDescription}
          >
            {item.description}
          </Animatable.Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6200EE" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#6200EE', '#3700B3', '#03DAC6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={skip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides Container */}
      <View style={styles.slidesContainer}>
        <Animated.ScrollView
          ref={flatListRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false, listener: handleScroll }
          )}
          scrollEventThrottle={16}
        >
          {onboardingData.map((item, index) => renderSlide(item, index))}
        </Animated.ScrollView>
      </View>

      {/* Page Indicators */}
      <View style={styles.indicatorContainer}>
        {onboardingData.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 20, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.indicator,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        {/* Previous Button */}
        {currentIndex > 0 && (
          <Animatable.View animation="fadeInLeft" duration={300}>
            <TouchableOpacity onPress={prevSlide} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color="#6200EE" />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}

        <View style={styles.spacer} />

        {/* Next/Get Started Button */}
        <Animatable.View animation="fadeInRight" duration={300}>
          <TouchableOpacity
            onPress={() => {
              animateButton();
              nextSlide();
            }}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.nextButton,
                {
                  transform: [{ scale: buttonScale }],
                  backgroundColor: onboardingData[currentIndex]?.color || '#6200EE',
                },
              ]}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons
                name={currentIndex === onboardingData.length - 1 ? 'rocket' : 'chevron-forward'}
                size={20}
                color="white"
                style={styles.buttonIcon}
              />
            </Animated.View>
          </TouchableOpacity>
        </Animatable.View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: scrollX.interpolate({
                  inputRange: [0, (onboardingData.length - 1) * width],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
                backgroundColor: onboardingData[currentIndex]?.color || '#6200EE',
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  slideSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  slideDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '300',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  indicator: {
    height: 8,
    backgroundColor: 'white',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  progressBackground: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
  },
});

export default OnboardingScreen;