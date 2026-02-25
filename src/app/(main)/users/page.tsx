
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page has been moved to /admin/users
export default function UsersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/users');
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <p>جاري التوجيه إلى صفحة إدارة المستخدمين...</p>
    </div>
  );
}
