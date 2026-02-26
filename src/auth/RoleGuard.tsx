'use client';

import { useSession } from './SessionProvider';
import { hasPermission } from './permissions';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getDefaultPath } from './permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Rocket } from 'lucide-react';

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // User is not logged in, redirect to login page.
        router.replace('/login');
      } else if (!hasPermission(role, pathname)) {
        // User is logged in but doesn't have permission, redirect to their default page.
        const defaultPath = getDefaultPath(role);
        router.replace(defaultPath);
      }
    }
  }, [isLoading, user, role, pathname, router]);

  if (isLoading || !user) {
    // Show a loading screen while session is loading or before redirect happens.
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Rocket className="h-5 w-5 animate-pulse text-primary" />
            <span>جاري التحميل...</span>
          </div>
      </div>
    );
  }
  
  if (!hasPermission(role, pathname)) {
    // This is a fallback screen, shown briefly before redirect.
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
             <div className="flex items-center gap-2 text-muted-foreground">
                <Rocket className="h-5 w-5 animate-pulse text-primary" />
                <span>جاري التحميل...</span>
            </div>
        </div>
    );
  }

  return <>{children}</>;
}
