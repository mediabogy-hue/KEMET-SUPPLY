'use client';

import { useSession } from "@/auth/SessionProvider";
import { getDefaultPath } from "@/auth/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Rocket } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useSession();
  const router = useRouter();

  // Determine if the user is logged in (after loading)
  const isLoggedIn = !isLoading && user && role;

  useEffect(() => {
    if (isLoading) return; // Wait until session is loaded

    if (user && role) {
      router.replace(getDefaultPath(role));
    }
  }, [isLoading, user, role, router]);

  // Show spinner while loading or if user is logged in (and will be redirected)
  if (isLoading || isLoggedIn) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Rocket className="h-5 w-5 animate-pulse text-primary" />
              <span>جاري التحميل...</span>
            </div>
        </div>
      );
  }

  // Render login/register page only when loading is done and user is not logged in
  return <>{children}</>;
}
