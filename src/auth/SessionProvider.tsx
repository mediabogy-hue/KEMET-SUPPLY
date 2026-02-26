
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import type { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import type { Storage } from 'firebase/storage';
import { app, auth, db, storage } from '@/lib/firebaseClient'; // Direct import of initialized services
import type { UserProfile } from '@/lib/types';
import { Rocket } from 'lucide-react';

export interface SessionContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: Storage;
  
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
}

const SessionContext = createContext<SessionContextState | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<{
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    user: auth.currentUser, // Initialize with current user if available on client
    profile: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let profileUnsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }

      if (authUser) {
        if (sessionState.user?.uid !== authUser.uid) {
             setSessionState(s => ({ ...s, isLoading: true, user: authUser, profile: null }));
        }

        const profileDocRef = doc(db, 'users', authUser.uid);
        profileUnsubscribe = onSnapshot(profileDocRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              setSessionState({ user: authUser, profile: docSnap.data() as UserProfile, isLoading: false, error: null });
            } else {
              setSessionState({ user: authUser, profile: null, isLoading: false, error: new Error('User profile not found.') });
            }
          },
          (profileError) => {
            console.error("Profile subscription error:", profileError);
            setSessionState({ user: authUser, profile: null, isLoading: false, error: profileError });
          }
        );
      } else {
        setSessionState({ user: null, profile: null, isLoading: false, error: null });
      }
    }, (authError) => {
      console.error("Auth state error:", authError);
      setSessionState({ user: null, profile: null, isLoading: false, error: authError });
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []); // Run only once

  const contextValue = useMemo((): SessionContextState => {
    const role = sessionState.profile?.role || null;
    return {
      ...sessionState,
      firebaseApp: app,
      firestore: db,
      auth: auth,
      storage: storage,
      role,
      isAdmin: role === 'Admin',
      isOrdersManager: role === 'OrdersManager' || role === 'Admin',
      isFinanceManager: role === 'FinanceManager' || role === 'Admin',
      isMerchant: role === 'Merchant',
      isStaff: ['Admin', 'OrdersManager', 'FinanceManager'].includes(role || ''),
      isDropshipper: role === 'Dropshipper',
    };
  }, [sessionState]);

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
    