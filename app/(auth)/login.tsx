// app/(auth)/login.tsx
// Login screen with Email/Password, Google, and Apple sign-in

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, Platform, TextInput, KeyboardAvoidingView, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button } from '../../src/components/common';
import { useAuthStore } from '../../src/stores';
import { colors, spacing, typography, radius } from '../../src/constants';

// Password validation requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
};

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    name: false,
  });

  // Email validation
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Password strength validation
  const passwordValidation = useMemo(() => {
    return {
      minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
      hasUppercase: PASSWORD_REQUIREMENTS.hasUppercase.test(password),
      hasLowercase: PASSWORD_REQUIREMENTS.hasLowercase.test(password),
      hasNumber: PASSWORD_REQUIREMENTS.hasNumber.test(password),
      hasSpecial: PASSWORD_REQUIREMENTS.hasSpecial.test(password),
    };
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return (
      passwordValidation.minLength &&
      passwordValidation.hasUppercase &&
      passwordValidation.hasLowercase &&
      passwordValidation.hasNumber
    );
  }, [passwordValidation]);

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Email error
  const emailError = useMemo(() => {
    if (!touched.email) return null;
    if (!email.trim()) return 'Email is required';
    if (!validateEmail(email)) return 'Please enter a valid email';
    return null;
  }, [email, touched.email]);

  // Name error
  const nameError = useMemo(() => {
    if (!touched.name || isLogin) return null;
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return null;
  }, [name, touched.name, isLogin]);

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleEmailAuth = async () => {
    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      confirmPassword: !isLogin,
      name: !isLogin,
    });

    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (!isLogin) {
      // Registration validation
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      if (!isPasswordValid) {
        Alert.alert(
          'Weak Password',
          'Password must be at least 8 characters and contain uppercase, lowercase, and a number.'
        );
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    } else {
      // Login - just check minimum length
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);
    try {
      // Firebase Auth
      const { registerWithEmail, signInWithEmail } = await import(
        '../../src/services/firebase/auth'
      );

      let user;
      if (isLogin) {
        // Sign in
        user = await signInWithEmail(email.trim(), password);
      } else {
        // Register
        user = await registerWithEmail(email.trim(), password, name.trim());
      }

      if (user) {
        useAuthStore.setState({
          user,
          isLoading: false,
          isInitialized: true,
        });
      }

      // Navigate to role selection
      router.replace('/(auth)/role-selection');
    } catch (err: any) {
      console.error('Auth error:', err);
      Alert.alert('Error', err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Coming Soon',
        'Google Sign-In on web will be available soon. Please use Email/Password for now.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Google Sign-In',
        'Google Sign-In requires a development build.\n\nPlease use Email/Password or Demo Mode.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAppleSignIn = () => {
    Alert.alert(
      'Apple Sign-In',
      'Apple Sign-In requires a development build.\n\nPlease use Email/Password or Demo Mode.',
      [{ text: 'OK' }]
    );
  };

  const handleDemoSignIn = () => {
    demoSignIn();
    router.replace('/(auth)/role-selection');
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setPassword('');
    setConfirmPassword('');
    setTouched({
      email: false,
      password: false,
      confirmPassword: false,
      name: false,
    });
  };

  // Password requirement item component
  const PasswordRequirement = ({
    met,
    text,
  }: {
    met: boolean;
    text: string;
  }) => (
    <View style={styles.requirementRow}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={met ? colors.success.main : colors.text.tertiary}
      />
      <Text style={[styles.requirementText, met && styles.requirementMet]}>
        {text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Ionicons name="heart" size={48} color={colors.primary[500]} />
            </View>
            <Text style={styles.appName}>ElderCare</Text>
            <Text style={styles.tagline}>
              Stay connected with your loved ones
            </Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>

            {/* Name field (register only) */}
            {!isLogin && (
              <View>
                <View
                  style={[
                    styles.inputContainer,
                    nameError && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={nameError ? colors.danger.main : colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={colors.text.tertiary}
                    value={name}
                    onChangeText={setName}
                    onBlur={() => handleBlur('name')}
                    autoCapitalize="words"
                  />
                </View>
                {nameError && <Text style={styles.errorText}>{nameError}</Text>}
              </View>
            )}

            {/* Email field */}
            <View>
              <View
                style={[
                  styles.inputContainer,
                  emailError && styles.inputError,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={emailError ? colors.danger.main : colors.text.tertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => handleBlur('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                {touched.email && validateEmail(email) && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.success.main}
                  />
                )}
              </View>
              {emailError && <Text style={styles.errorText}>{emailError}</Text>}
            </View>

            {/* Password field */}
            <View>
              <View
                style={[
                  styles.inputContainer,
                  touched.password && !isLogin && !isPasswordValid && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.text.tertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => handleBlur('password')}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* Password requirements (register only) */}
              {!isLogin && password.length > 0 && (
                <View style={styles.requirementsContainer}>
                  <PasswordRequirement
                    met={passwordValidation.minLength}
                    text="At least 8 characters"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasUppercase}
                    text="One uppercase letter"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasLowercase}
                    text="One lowercase letter"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasNumber}
                    text="One number"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasSpecial}
                    text="One special character (optional)"
                  />
                </View>
              )}
            </View>

            {/* Confirm Password field (register only) */}
            {!isLogin && (
              <View>
                <View
                  style={[
                    styles.inputContainer,
                    touched.confirmPassword &&
                      confirmPassword.length > 0 &&
                      !passwordsMatch &&
                      styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor={colors.text.tertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onBlur={() => handleBlur('confirmPassword')}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  {confirmPassword.length > 0 && (
                    <Ionicons
                      name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={passwordsMatch ? colors.success.main : colors.danger.main}
                    />
                  )}
                </View>
                {touched.confirmPassword &&
                  confirmPassword.length > 0 &&
                  !passwordsMatch && (
                    <Text style={styles.errorText}>Passwords do not match</Text>
                  )}
              </View>
            )}

            {/* Submit Button */}
            <Button
              title={isLogin ? 'Sign In' : 'Create Account'}
              onPress={handleEmailAuth}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
              style={{ marginTop: spacing[2] }}
            />

            {/* Toggle Auth Mode */}
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.toggleLink} onPress={toggleAuthMode}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Auth Buttons */}
          <View style={styles.socialButtons}>
            <Button
              title="Google"
              onPress={handleGoogleSignIn}
              variant="outline"
              size="md"
              icon={
                <Ionicons
                  name="logo-google"
                  size={20}
                  color={colors.primary[500]}
                />
              }
              style={styles.socialButton}
            />

            {Platform.OS === 'ios' && (
              <Button
                title="Apple"
                onPress={handleAppleSignIn}
                variant="outline"
                size="md"
                icon={
                  <Ionicons
                    name="logo-apple"
                    size={20}
                    color={colors.text.primary}
                  />
                }
                style={styles.socialButton}
              />
            )}
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing[6],
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  appName: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 32,
    color: colors.primary[500],
    marginBottom: spacing[1],
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: spacing[4],
  },
  formTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[3],
  },
  inputError: {
    borderColor: colors.danger.main,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.danger.main,
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  requirementsContainer: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  requirementText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  requirementMet: {
    color: colors.success.main,
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  toggleLink: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[300],
  },
  dividerText: {
    paddingHorizontal: spacing[3],
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  socialButton: {
    flex: 1,
    maxWidth: 150,
  },
  terms: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing[4],
  },
  link: {
    color: colors.primary[500],
  },
});
