'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import type { UserProfile } from '@/lib/types';

export interface SessionContextState {
  user: User | null;
  profile: UserProfile | null;
  role: UserProfile['role'] | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isOrdersManager: boolean;
  isFinanceManager: boolean;
  isMerchant: boolean;
  isStaff: boolean;
  isDropshipper: boolean;
  firestore: ReturnType<typeof useFirebase>['firestore']
}

const SessionContext = createContext<SessionContextState | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
          // If no user, we are done. Clear profile and stop loading.
          setProfile(null);
          setIsLoading(false);
      }
    }, (authError) => {
        // Handle listener errors
        console.error("Auth state listener error:", authError);
        setUser(null);
        setProfile(null);
        setError(authError);
        setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!user) {
        // If user object is null (logged out), we don't need to fetch a profile.
        // The isLoading state is handled by the auth-only useEffect.
        return;
    }

    // User is authenticated, now fetch their profile.
    // Set loading to true when we start fetching for a new user.
    setIsLoading(true);
    const profileDocRef = doc(firestore, 'users', user.uid);
    
    const unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
            setProfile(null);
            setError(new Error('User profile does not exist in Firestore.'));
        }
        // We are done loading once we have a profile (or know it doesn't exist)
        setIsLoading(false);
    }, (profileError) => {
        console.error("Profile listener error:", profileError);
        setProfile(null);
        setError(profileError);
        setIsLoading(false);
    });

    return () => unsubscribeProfile();

  }, [user, firestore]);

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
      firestore,
    };
  }, [user, profile, isLoading, error, firestore]);

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
