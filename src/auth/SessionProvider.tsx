'use client';

import React, { createContext, useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import type { UserRole } from './permissions';
import { User, signOut } from 'firebase/auth';

export interface SessionState {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  isOrdersManager: boolean;
  isFinanceManager: boolean;
  isProductManager: boolean;
  isStaff: boolean;
  isDropshipper: boolean;
  refreshSession: () => void;
}

export const SessionContext = createContext<SessionState | undefined>(undefined);


export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (user: User) => {
    if (!firestore || !auth) return;

    setIsLoading(true);
    setError(null);

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userProfile = docSnap.data() as UserProfile;
        
        if (!userProfile.role) {
            throw new Error("User profile is missing a 'role'.");
        }
        
        setProfile(userProfile);
        setRole(userProfile.role);
      } else {
        throw new Error("لم يتم العثور على ملفك الشخصي في قاعدة البيانات.");
      }
    } catch (e: any) {
      console.error("SessionProvider Error:", e.message);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [firestore, auth]);

  useEffect(() => {
    // If auth is still resolving, we are in a loading state.
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    // If no user is authenticated, session is resolved, not loading, and empty.
    if (!authUser) {
      setProfile(null);
      setRole(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // If we have an authenticated user, fetch their profile.
    fetchProfile(authUser);

  }, [authUser, isAuthLoading, fetchProfile]);
  
  const refreshSession = useCallback(() => {
    if (authUser) {
        fetchProfile(authUser);
    }
  }, [authUser, fetchProfile]);


  const sessionValue = useMemo(() => {
    const isAdmin = role === 'Admin';
    const isOrdersManager = role === 'OrdersManager';
    const isFinanceManager = role === 'FinanceManager';
    const isProductManager = role === 'ProductManager';
    
    return {
      user: authUser,
      profile,
      role,
      isLoading,
      error,
      isAdmin,
      isOrdersManager,
      isFinanceManager,
      isProductManager,
      isStaff: isAdmin || isOrdersManager || isFinanceManager || isProductManager,
      isDropshipper: role === 'Dropshipper',
      refreshSession,
    };
  }, [authUser, profile, role, isLoading, error, refreshSession]);

  return (
    <SessionContext.Provider value={sessionValue}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = (): SessionState => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
