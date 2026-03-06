
'use client';

import { useSession } from "@/auth/SessionProvider";
import { getDefaultPath } from "@/auth/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Rocket } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we are NOT loading, a user exists, AND they have a valid role.
    if (!isLoading && user && role) {
      const defaultPath = getDefaultPath(role);
      router.replace(defaultPath);
    }
  }, [isLoading, user, role, router]);

  // Show loading indicator while the session is loading OR if a valid user is found
  // (which means a redirect is about to happen).
  if (isLoading || (!isLoading && user && role)) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Rocket className="h-5 w-5 animate-pulse text-primary" />
            <span>جاري التحميل...</span>
          </div>
      </div>
    );
  }

  // If the session is loaded and there is NO user (or user has no role), show the children (login, register pages).
  // This prevents the redirect loop for users in a broken state (auth exists, but profile doesn't).
  return <>{children}</>;
}
