
'use client';

// Re-export hooks and utilities from other files
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

// Re-define and export hooks based on the new unified SessionProvider
import { useSession } from '@/auth/SessionProvider';
import type { Auth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Storage } from 'firebase/storage';
import { useMemo, type DependencyList } from 'react';


export const useFirebase = useSession;
export const useAuth = (): Auth => useSession().auth;
export const useFirestore = (): Firestore => useSession().firestore;
export const useStorage = (): Storage => useSession().storage;
export const useFirebaseApp = (): FirebaseApp => useSession().firebaseApp;

export const useUser = () => {
    const { user, isLoading, error } = useSession();
    return { user, isUserLoading: isLoading, userError: error };
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}
    