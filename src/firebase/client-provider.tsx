
'use client';

import { FirebaseProvider } from '@/firebase/provider';
import { app, auth, db, storage } from '@/lib/firebaseClient';
import React from 'react';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider
        firebaseApp={app}
        auth={auth}
        firestore={db}
        storage={storage}
    >
      {children}
    </FirebaseProvider>
  );
}
