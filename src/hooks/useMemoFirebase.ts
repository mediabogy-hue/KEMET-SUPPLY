'use client';

import { useMemo, type DependencyList } from 'react';

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);

  if (typeof memoized === 'object' && memoized !== null) {
    // It's safe to cast here as we're adding a property for internal checks.
    (memoized as MemoFirebase<T>).__memo = true;
  }

  return memoized;
}
