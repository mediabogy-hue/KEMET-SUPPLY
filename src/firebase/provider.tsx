'use client';

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

export interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

// Create a module-level variable to hold the initialized Firebase services.
// This ensures that Firebase is initialized only once across the entire client-side application lifecycle.
let firebaseContextValue: FirebaseContextState | undefined;

function initializeFirebaseServices(): FirebaseContextState {
  if (firebaseContextValue) {
    return firebaseContextValue;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  const services = {
    firebaseApp: app,
    firestore: getFirestore(app),
    auth: getAuth(app),
    storage: getStorage(app),
  };

  firebaseContextValue = services;
  return services;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  // The value is now initialized once and provided to the context.
  // This is simpler and more robust than using useState for initialization.
  const contextValue = initializeFirebaseServices();

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

// Define and export main hooks from here to avoid circular dependencies.
export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useStorage = (): FirebaseStorage => useFirebase().storage;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;
