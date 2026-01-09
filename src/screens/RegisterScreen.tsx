import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, TextInput } from '../components';
import { useAuth } from '../context';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';
import { VALIDATION } from '../constants/config';
import { RootStackParamList } from '../types';

interface RegisterScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < VALIDATION.USERNAME_MIN_LENGTH) {
      newErrors.username = `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!VALIDATION.EMAIL_REGEX.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({
        username,
        email,
        password,
        realName: `${firstName} ${lastName}`.trim(),
      });
      // Navigation is handled automatically by AppNavigator when auth state changes
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || 'Could not create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with gradient */}
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientMiddle, COLORS.gradientEnd]}
            style={styles.header}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>


            <Text style={styles.title}>Register</Text>
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <TextInput
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="billel"
                  autoCapitalize="words"
                  error={errors.firstName}
                />
              </View>
              <View style={styles.nameField}>
                <TextInput
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="zemmel"
                  autoCapitalize="words"
                  error={errors.lastName}
                />
              </View>
            </View>

            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="billelz"
              autoCapitalize="none"
              error={errors.username}
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="billelz@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <TextInput
              label="Set Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              isPassword
              error={errors.password}
            />

            <Button
              title="Register"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xxxl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoImage: {
    width: 20,
    height: 20,
    borderRadius: 40,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  loginLink: {
    marginTop: SPACING.xs,
  },
  loginLinkText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  loginLinkBold: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  nameRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  nameField: {
    flex: 1,
  },
  registerButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
});

export default RegisterScreen;
