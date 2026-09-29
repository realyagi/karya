'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

export interface KaryaUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  googleConnected?: boolean;
}

interface AuthContextType {
  isSignedIn: boolean;
  user: KaryaUser | null;
  signIn: () => void;
  signUp: () => void;
  signOut: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalMode: 'sign-in' | 'sign-up';
  setAuthModalMode: (mode: 'sign-in' | 'sign-up') => void;
}

const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  user: null,
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
  showAuthModal: false,
  setShowAuthModal: () => {},
  authModalMode: 'sign-in',
  setAuthModalMode: () => {},
});

export const KaryaAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded, isSignedIn: isClerkSignedIn } = useUser();
  const { openSignIn, openSignUp, signOut: clerkSignOut } = useClerk();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  const user: KaryaUser | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: clerkUser.fullName || clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
    avatarUrl: clerkUser.imageUrl,
    googleConnected: clerkUser.externalAccounts.some(acc => acc.provider === 'google')
  } : null;

  const signIn = () => {
    openSignIn();
  };

  const signUp = () => {
    openSignUp();
  };

  const signOut = () => {
    clerkSignOut();
  };

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: !!isClerkSignedIn,
        user,
        signIn,
        signUp,
        signOut,
        showAuthModal,
        setShowAuthModal,
        authModalMode,
        setAuthModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useKaryaAuth = () => useContext(AuthContext);
