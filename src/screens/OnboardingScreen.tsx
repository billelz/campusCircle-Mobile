import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  ViewToken,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import { STORAGE_KEYS } from '../constants/config';
import { RootStackParamList, OnboardingSlide } from '../types';

const { width, height } = Dimensions.get('window');

// Onboarding images
const onboardingImages: { [key: number]: ImageSourcePropType } = {
  1: require('../../assets/onboarding1.png'),
  2: require('../../assets/onboarding2.png'),
  3: require('../../assets/onboarding3.png'),
};

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Discuss Freely:',
    description: 'Join academic and social channels without revealing your real name.',
    image: onboardingImages[1],
  },
  {
    id: 2,
    title: 'Stay Informed:',
    description: 'Explore trending topics and campus insights in real-time',
    image: onboardingImages[2],
  },
  {
    id: 3,
    title: 'Build Reputation:',
    description: 'Earn karma, badges, and trust as a helpful community member.',
    image: onboardingImages[3],
  },
];

interface OnboardingScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleSkip = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    navigation.replace('Login');
  };

  const handleSignUp = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    navigation.replace('Register');
  };

  const handleLogin = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    navigation.replace('Login');
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <Image
          source={item.image}
          style={styles.slideImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentIndex && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id.toString()}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {renderPagination()}

      {isLastSlide && (
        <View style={styles.buttonsContainer}>
          <Button
            title="Sign up"
            onPress={handleSignUp}
            variant="primary"
            fullWidth={false}
            style={styles.signUpButton}
          />
          <Button
            title="Log in"
            onPress={handleLogin}
            variant="outline"
            fullWidth={false}
            style={styles.loginButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  skipButton: {
    position: 'absolute',
    top: SPACING.xl,
    right: SPACING.xl,
    zIndex: 1,
  },
  skipText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  imageContainer: {
    width: width * 0.7,
    height: height * 0.35,
    marginBottom: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.xxl,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F4F8',
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  illustrationEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.base,
  },
  description: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray300,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  signUpButton: {
    flex: 1,
  },
  loginButton: {
    flex: 1,
  },
});

export default OnboardingScreen;
