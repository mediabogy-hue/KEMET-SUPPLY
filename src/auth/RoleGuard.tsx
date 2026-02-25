
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

const FullPageLoader = ({ message }: { message: string}) => (
     <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>{message}</span>
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

  useEffect(() => {
    if (isLoading) {
      return; // Wait until session is loaded
    }

    // If no user is logged in, redirect to login page
    if (!user) {
      router.replace('/');
      return;
    }

    // If user has a role, check for permissions
    if (role) {
      if (!hasPermission(role, pathname)) {
        // If user doesn't have permission, redirect to their default page
        const defaultPath = getDefaultPath(role);
        router.replace(defaultPath);
      }
    }
    // If user is logged in but role is still loading, the isLoading flag will handle the loader
    
  }, [isLoading, user, role, pathname, router]);

  if (isLoading) {
    return <FullPageLoader message="جاري التحقق من الصلاحيات..." />;
  }
  
  if (error) {
    return <AuthErrorState error={error} />;
  }

  // If after loading there is still no user, it means the redirect is in progress.
  // Render loader to avoid flashing content.
  if (!user) {
    return <FullPageLoader message="جاري التوجيه..." />;
  }

  // If user is logged in but role is not yet determined OR user lacks permission and redirect is pending,
  // show loader.
  if (!role || !hasPermission(role, pathname)) {
     return <FullPageLoader message="جاري التحقق من الصلاحيات..." />;
  }

  // If all checks pass, render the protected children components
  return <>{children}</>;
}
