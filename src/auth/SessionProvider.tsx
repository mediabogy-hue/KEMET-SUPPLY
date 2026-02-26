

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { getDefaultPath, hasPermission } from './permissions';

type SessionContextType = {
  user: User | null;
  profile: UserProfile | null;
  role: UserProfile['role'] | null;
  isLoading: boolean;
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

const loadSessionData = async (firestore: any, user: User): Promise<{ profile: UserProfile | null, role: UserProfile['role'] | null }> => {
    if (!firestore || !user) {
        return { profile: null, role: null };
    }
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    let profile: UserProfile | null = null;
    let role: UserProfile['role'] | null = null;

    if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserProfile;
        profile = data;
        // Trust the role in the user document if it exists.
        if (data.role) {
            role = data.role;
        }
    }

    // If the user's role is still not 'Admin' (or not determined),
    // check the dedicated role collections as a potential override or fallback.
    // This makes the system resilient to incorrect `role` fields in the user doc.
    const roleChecks: Array<{ roleName: UserProfile['role'], path: string }> = [
        { roleName: 'Admin', path: `roles_admin/${user.uid}` },
        { roleName: 'Merchant', path: `roles_merchant/${user.uid}` },
        { roleName: 'OrdersManager', path: `roles_orders_manager/${user.uid}` },
        { roleName: 'FinanceManager', path: `roles_finance_manager/${user.uid}` },
    ];

    for (const check of roleChecks) {
        try {
            const roleDocSnap = await getDoc(doc(firestore, check.path));
            if (roleDocSnap.exists()) {
                // If a specific role doc exists, it takes precedence.
                role = check.roleName;
                break;
            }
        } catch (e) {
            console.warn(`Could not check role at path: ${check.path}`);
        }
    }
    
    // If after all checks there is still no role, and a profile was loaded,
    // it implies a dropshipper account (as they don't have a separate role doc).
    if (!role && profile) {
        role = 'Dropshipper';
    }

    // If profile was not loaded but a role was found via role collections, create a minimal profile.
    if (!profile && role) {
         profile = { 
            id: user.uid,
            email: user.email!, 
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ')[1] || '',
            role: role 
        } as UserProfile;
    }
    
    // Final check: if we have a profile, make sure its role matches the determined role.
    if (profile && role) {
        profile.role = role;
    }

    return { profile, role };
};


export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserProfile['role'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    if (auth?.currentUser && firestore) {
      setIsLoading(true);
      const { profile: refreshedProfile, role: refreshedRole } = await loadSessionData(firestore, auth.currentUser);
      setProfile(refreshedProfile);
      setRole(refreshedRole);
      setIsLoading(false);
    }
  }, [auth, firestore]);
  
  useEffect(() => {
    if (!auth || !firestore) {
      setIsLoading(false);
      return;
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
            setUser(firebaseUser);
            const { profile: loadedProfile, role: loadedRole } = await loadSessionData(firestore, firebaseUser);
            setProfile(loadedProfile);
            setRole(loadedRole);
            
            if (!loadedProfile) {
                setError("User profile not found in database.");
            }

        } catch (e: any) {
            console.error("Failed to load session data:", e);
            setError("Failed to load user session. Please try again.");
            // Gracefully clear session data on error instead of crashing
            setUser(null);
            setProfile(null);
            setRole(null);
        }

      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);
  
  const contextValue = useMemo(() => {
      const currentRole = role;
      return {
        user,
        profile,
        role: currentRole,
        isLoading,
        error,
        isAdmin: currentRole === 'Admin',
        isOrdersManager: currentRole === 'OrdersManager' || currentRole === 'Admin',
        isFinanceManager: currentRole === 'FinanceManager' || currentRole === 'Admin',
        isMerchant: currentRole === 'Merchant',
        isStaff: ['Admin', 'OrdersManager', 'FinanceManager'].includes(currentRole || ''),
        isDropshipper: currentRole === 'Dropshipper',
        refreshSession,
      }
  }, [user, profile, role, isLoading, error, refreshSession]);


  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
