'use client';

import { useSession } from './SessionProvider';
import { hasPermission } from './permissions';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getDefaultPath } from './permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { role, isLoading } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const canAccess = hasPermission(role, pathname);

  useEffect(() => {
    if (!isLoading && !canAccess) {
      // Redirect to a safe default path if access is denied
      const defaultPath = getDefaultPath(role);
      router.replace(defaultPath);
    }
  }, [isLoading, canAccess, role, router]);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!canAccess) {
    // This part will be shown briefly before the redirect happens.
    // It can also be a fallback if the redirect fails for some reason.
    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>غير مصرح بالدخول</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>ليس لديك الصلاحية!</AlertTitle>
                        <AlertDescription>
                        عفواً، ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
  }

  return <>{children}</>;
}
