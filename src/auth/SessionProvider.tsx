
'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { doc, onSnapshot, Unsubscribe, DocumentData, FirestoreError, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { User } from 'firebase/auth';

type SessionContextType = {
  user: User | null;
  profile: UserProfile | null;
  role: UserProfile['role'] | null;
  isLoading: boolean; // A single, reliable loading state
  error: string | null;
  isAdmin: boolean;
  isOrdersManager: boolean;
  isFinanceManager: boolean;
  isMerchant: boolean;
  isStaff: boolean;
  isDropshipper: boolean;
  refreshSession: () => void;
};

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // 1. Get auth state from the primary Firebase provider
  const { user, isUserLoading, auth, firestore } = useFirebase();

  // 2. Manage profile fetching state separately
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // 3. Effect to subscribe to the user's profile document in Firestore
  useEffect(() => {
    // If auth is still loading, or there's no user, we don't need to do anything.
    if (isUserLoading || !user || !firestore) {
      setProfile(null);
      // We are not "profile loading" if there's no user to load a profile for.
      setIsProfileLoading(false); 
      return;
    }

    setIsProfileLoading(true);
    const userDocRef = doc(firestore, 'users', user.uid);

    const unsubscribe = onSnapshot(userDocRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const userProfile = docSnap.data() as UserProfile;
          // Self-healing: Ensure role exists. If not, default to Dropshipper and update the document.
          if (!userProfile.role) {
            userProfile.role = 'Dropshipper';
            console.warn(`User ${user.uid} is missing a role. Defaulting to Dropshipper and updating profile.`);
            updateDoc(userDocRef, { role: 'Dropshipper', updatedAt: serverTimestamp() }).catch(console.error);
          }
          setProfile(userProfile);
        } else {
          setProfile(null);
          setProfileError("User profile document not found in Firestore.");
          console.warn(`User profile not found for UID: ${user.uid}`);
        }
        setIsProfileLoading(false);
      }, 
      (error: FirestoreError) => {
        console.error("Error fetching user profile:", error);
        setProfile(null);
        setProfileError(error.message);
        setIsProfileLoading(false);
      }
    );

    // Cleanup subscription on user change or unmount
    return () => unsubscribe();
  }, [user, isUserLoading, firestore]);

  const refreshSession = useCallback(() => {
      // This is now tricky. A real-time listener is already in place.
      // A hard refresh might not be necessary unless we want to force re-fetch from server.
      // For now, let's make it a no-op, as the onSnapshot should keep things in sync.
      console.log("Session refresh requested. Real-time listener is active.");
  }, []);

  const role = profile?.role || null;

  const contextValue = useMemo(() => {
    const finalIsLoading = isUserLoading || isProfileLoading;
    return {
      user,
      profile,
      role,
      isLoading: finalIsLoading,
      error: profileError,
      isAdmin: role === 'Admin',
      isOrdersManager: role === 'OrdersManager' || role === 'Admin',
      isFinanceManager: role === 'FinanceManager' || role === 'Admin',
      isMerchant: role === 'Merchant',
      isStaff: ['Admin', 'OrdersManager', 'FinanceManager'].includes(role || ''),
      isDropshipper: role === 'Dropshipper',
      refreshSession,
    };
  }, [user, profile, role, isUserLoading, isProfileLoading, profileError, refreshSession]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
