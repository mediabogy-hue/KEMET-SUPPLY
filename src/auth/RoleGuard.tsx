'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useSession } from '@/auth/SessionProvider';
import { hasPermission, getDefaultPath } from '@/auth/permissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

const GuardLoadingSkeleton = () => (
  <div className="flex h-full w-full min-h-[calc(100vh-15rem)] items-center justify-center p-4">
    <div className="flex flex-col items-center gap-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-lg font-semibold">جاري التحقق من الصلاحيات...</p>
      <p className="text-sm text-muted-foreground">الرجاء الانتظار</p>
    </div>
  </div>
);

const GuardErrorState = ({ error }: { error: string }) => {
    const auth = useAuth();
    return (
        <div className="flex h-full w-full min-h-[calc(100vh-15rem)] items-center justify-center p-4">
             <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>خطأ في الحساب</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>فشل تحميل الملف الشخصي!</AlertTitle>
                        <AlertDescription>
                            {error}.
                             قد تكون هناك مشكلة في صلاحيات الوصول أو أن الحساب غير موجود. الرجاء تسجيل الخروج والمحاولة مرة أخرى.
                        </AlertDescription>
                    </Alert>
                    {auth && <Button variant="outline" className="mt-4 w-full" onClick={() => signOut(auth)}>تسجيل الخروج</Button>}
                </CardContent>
            </Card>
        </div>
    )
};


export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, role, isLoading, error } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // If the session is still loading, show a skeleton.
  if (isLoading) {
    return <GuardLoadingSkeleton />;
  }

  // If there's an authenticated user but their profile failed to load, show an explicit error.
  if (user && !profile) {
    return <GuardErrorState error={error || "لم يتم العثور على الملف الشخصي."} />;
  }
  
  const publicPaths = ['/', '/register', '/forgot-password'];
  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/product');

  // If there's no authenticated user, and they are not on a public path, redirect them to login.
  if (!user && !isPublicPath) {
    router.replace('/');
    return <GuardLoadingSkeleton />; // Show loader while redirecting
  }
  
  // If there IS a user and they are on a public-only path (e.g., /login), redirect them to their dashboard.
  if (user && role && isPublicPath && !pathname.startsWith('/product')) {
    const defaultPath = getDefaultPath(role);
    router.replace(defaultPath);
    return <GuardLoadingSkeleton />; // Show loader while redirecting
  }

  // If there IS a user and they lack permission for the current route, redirect to their dashboard.
  if (user && role && !hasPermission(role, pathname)) {
    const defaultPath = getDefaultPath(role);
    router.replace(defaultPath);
    return <GuardLoadingSkeleton />; // Show loader while redirecting
  }

  // If all checks pass, render the children.
  return <>{children}</>;
}
