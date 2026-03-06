
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { User, onAuthStateChanged, Unsubscribe } from 'firebase/auth';
import { doc, onSnapshot, DocumentData, FirestoreError } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // First, only handle authentication state changes.
    const authUnsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser); // This will trigger the second useEffect
      if (!authUser) {
        // If there's no user, we are done loading.
        setProfile(null);
        setIsLoading(false);
      }
    });
    return () => authUnsubscribe();
  }, [auth]);

  useEffect(() => {
    let profileUnsubscribe: Unsubscribe | undefined;

    if (user) {
      // If a user exists, start loading again until we fetch their profile.
      setIsLoading(true);
      const profileDocRef = doc(firestore, 'users', user.uid);
      
      profileUnsubscribe = onSnapshot(profileDocRef, 
        (docSnap: DocumentData) => {
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            setProfile(null);
          }
          // Whether profile exists or not, we are done loading for this user.
          setIsLoading(false);
          setError(null);
        }, 
        (profileError: FirestoreError) => {
          console.error("Error fetching user profile:", profileError);
          setProfile(null);
          setError(profileError);
          // Even on error, we are done loading.
          setIsLoading(false);
        }
      );
    }

    return () => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, [user, firestore]);

  const contextValue = useMemo((): SessionContextState => {
    const role = profile?.role || null;
    const isAdmin = role === 'Admin';
    const isStaff = ['Admin', 'OrdersManager', 'FinanceManager'].includes(role || '');

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
      isStaff: isStaff,
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
