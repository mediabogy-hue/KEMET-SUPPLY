'use client';

import { useSession } from '@/auth/SessionProvider';
import type { UserRole } from '@/auth/permissions';

/**
 * A simple hook to get the current user's role.
 * This is a convenience wrapper around `useSession`.
 * @returns The user's role, or null if not logged in or loading.
 */
export function useRole(): UserRole | null {
  const { role } = useSession();
  return role;
}
