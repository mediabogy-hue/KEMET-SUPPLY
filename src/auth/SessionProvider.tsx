
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
  const [session, setSession] = useState<{
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const profileDocRef = doc(firestore, 'users', authUser.uid);
          const docSnap = await getDoc(profileDocRef);
          
          if (docSnap.exists()) {
            setSession({
              user: authUser,
              profile: { id: docSnap.id, ...docSnap.data() } as UserProfile,
              isLoading: false,
              error: null,
            });
          } else {
            setSession({
              user: authUser,
              profile: null,
              isLoading: false,
              error: new Error('User profile does not exist.'),
            });
          }
        } catch (e: any) {
          setSession({
            user: authUser,
            profile: null,
            isLoading: false,
            error: e,
          });
        }
      } else {
        setSession({
          user: null,
          profile: null,
          isLoading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const contextValue = useMemo((): SessionContextState => {
    const { user, profile, isLoading, error } = session;
    const role = profile?.role || null;
    const isAdmin = role === 'Admin';
    return {
      user,
      profile,
      isLoading,
      error,
      role,
      isAdmin: isAdmin,
      isOrdersManager: role === 'OrdersManager' || isAdmin,
      isFinanceManager: role === 'FinanceManager' || isAdmin,
      isMerchant: role === 'Merchant',
      isStaff: ['Admin', 'OrdersManager', 'FinanceManager'].includes(role || ''),
      isDropshipper: role === 'Dropshipper',
      firestore,
    };
  }, [session, firestore]);

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
