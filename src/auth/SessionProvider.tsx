'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { User, onAuthStateChanged, Unsubscribe, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider'; // Corrected import path
import type { UserProfile } from '@/lib/types';

export interface SessionContextState {
  user: User | null;
  profile: UserProfile | null;
  role: 'Dropshipper' | 'Admin' | 'OrdersManager' | 'FinanceManager' | 'Merchant' | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isOrdersManager: boolean;
  isFinanceManager: boolean;
  isMerchant: boolean;
  isStaff: boolean;
  isDropshipper: boolean;
}

const SessionContext = createContext<SessionContextState | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true, set to false only when all checks are done.
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      // Clean up previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }
      
      setUser(authUser); // Update user state

      if (authUser) {
        // If there's an authenticated user, we are still loading until we get their profile.
        setIsLoading(true);
        const profileDocRef = doc(firestore, 'users', authUser.uid);
        
        unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
            setError(null);
          } else {
            // This is an invalid state (auth user without a profile).
            // Clear the profile and force a sign-out.
            setProfile(null);
            console.error(`User with UID ${authUser.uid} has no profile. Forcing sign out.`);
            signOut(auth); // This will re-trigger onAuthStateChanged to a clean, logged-out state.
          }
          setIsLoading(false); // Loading is complete.
        }, (profileError) => {
          console.error("Profile snapshot error:", profileError);
          setError(profileError);
          setIsLoading(false); // Loading is complete (with an error).
        });
      } else {
        // No authenticated user, so clear profile and finish loading.
        setProfile(null);
        setIsLoading(false);
      }
    }, (authError) => {
      console.error("Auth state error:", authError);
      setError(authError);
      setUser(null);
      setProfile(null);
      setIsLoading(false); // Finish loading (with an error).
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [auth, firestore]);

  const contextValue = useMemo((): SessionContextState => {
    const role = profile?.role || null;
    const isAdmin = role === 'Admin';

    return {
      user,
      profile,
      isLoading,
      error,
      role,
      isAdmin,
      isOrdersManager: role === 'OrdersManager' || isAdmin,
      isFinanceManager: role === 'FinanceManager' || isAdmin,
      isMerchant: role === 'Merchant',
      isStaff: ['Admin', 'OrdersManager', 'FinanceManager'].includes(role || ''),
      isDropshipper: role === 'Dropshipper',
    };
  }, [user, profile, isLoading, error]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = (): SessionContextState => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider.');
  }
  return context;
};
