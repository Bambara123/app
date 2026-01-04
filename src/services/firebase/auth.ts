// src/services/firebase/auth.ts
// Authentication service

import {
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { auth } from './config';
import { userService } from './firestore';
import { User } from '../../types';

// Register with email and password
export const registerWithEmail = async (
  email: string,
  password: string,
  name: string
): Promise<User | null> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(result.user, { displayName: name });
    
    // Create user profile in Firestore
    const user = await userService.getOrCreateUser({
      id: result.user.uid,
      email: result.user.email || email,
      name: name,
      profileImageUrl: null,
    });
    
    return user;
  } catch (error: any) {
    console.error('Email registration error:', error);
    // Provide user-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use a stronger password.');
    }
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Get or create user profile
    const user = await userService.getOrCreateUser({
      id: result.user.uid,
      email: result.user.email || email,
      name: result.user.displayName || email.split('@')[0],
      profileImageUrl: result.user.photoURL,
    });
    
    return user;
  } catch (error: any) {
    console.error('Email sign in error:', error);
    // Provide user-friendly error messages
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please register first.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password. Please check and try again.');
    }
    throw error;
  }
};

// Sign in with Google credential (from expo-auth-session)
export const signInWithGoogle = async (idToken: string): Promise<User | null> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    
    // Create or get user profile
    const user = await userService.getOrCreateUser({
      id: result.user.uid,
      email: result.user.email || '',
      name: result.user.displayName || 'User',
      profileImageUrl: result.user.photoURL,
    });
    
    return user;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

// Sign in with Apple credential (from expo-apple-authentication)
export const signInWithApple = async (
  identityToken: string,
  nonce: string
): Promise<User | null> => {
  try {
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({
      idToken: identityToken,
      rawNonce: nonce,
    });
    
    const result = await signInWithCredential(auth, credential);
    
    // Create or get user profile
    const user = await userService.getOrCreateUser({
      id: result.user.uid,
      email: result.user.email || '',
      name: result.user.displayName || 'User',
      profileImageUrl: result.user.photoURL,
    });
    
    return user;
  } catch (error) {
    console.error('Apple sign in error:', error);
    throw error;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Get current user ID
export const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

