
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useSession } from '@/auth/SessionProvider';
import { hasPermission, getDefaultPath } from '@/auth/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useEffect } from 'react';

const FullPageLoader = () => (
     <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg
            className="h-5 w-5 animate-spin text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>جاري التحميل...</span>
        </div>
      </div>
);


const AuthErrorState = ({ error }: { error: string }) => {
    const auth = useAuth();
    return (
        <div className="flex h-full w-full items-center justify-center p-4">
             <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>خطأ في الحساب</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>فشل تحميل بيانات الجلسة!</AlertTitle>
                        <AlertDescription>
                            {error}.
                             الرجاء تسجيل الخروج والمحاولة مرة أخرى. إذا استمرت المشكلة، تواصل مع الدعم.
                        </AlertDescription>
                    </Alert>
                    {auth && <Button variant="outline" className="mt-4 w-full" onClick={() => signOut(auth)}>تسجيل الخروج</Button>}
                </CardContent>
            </Card>
        </div>
    )
};


export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading, error } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const publicPaths = ['/', '/register', '/forgot-password'];
  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/product');

  useEffect(() => {
    if (isLoading) {
      return; 
    }

    if (!user && !isPublicPath) {
      router.replace('/');
      return;
    }

    if (user && role && isPublicPath && !pathname.startsWith('/product')) {
      const defaultPath = getDefaultPath(role);
      router.replace(defaultPath);
      return;
    }

    if (user && role && !hasPermission(role, pathname)) {
        const defaultPath = getDefaultPath(role);
        router.replace(defaultPath);
        return;
    }

  }, [isLoading, user, role, pathname, router, isPublicPath]);

  if (isLoading) {
    return <FullPageLoader />;
  }
  
  if (error) {
    return <AuthErrorState error={error} />;
  }

  // If we are still figuring out where to go, show a loader.
  // This prevents rendering children that are about to be unmounted by a redirect.
  if ((!user && !isPublicPath) || 
      (user && role && isPublicPath && !pathname.startsWith('/product')) || 
      (user && role && !hasPermission(role, pathname))) {
     return <FullPageLoader />;
  }

  return <>{children}</>;
}
