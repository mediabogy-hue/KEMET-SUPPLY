
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now part of the admin dashboard.
// Dropshippers view their wallet in /reports
export default function WithdrawalsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the appropriate page based on user role.
    // For now, we'll just redirect to a safe default.
    // The RoleGuard will handle the final destination.
    router.replace('/admin/withdrawals');
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <p>جاري التوجيه...</p>
    </div>
  );
}
