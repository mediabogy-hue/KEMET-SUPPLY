'use client';
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The 'lastSeen' update effect has been removed to improve performance and stability.
  // The RoleGuard has been moved to the root layout (src/app/layout.tsx)
  // to centralize auth logic and protect all routes consistently.

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={cn(
        "flex min-h-screen bg-gradient-to-br from-background to-background/80"
      )}>
        <Sidebar side="right" collapsible="icon" className="border-s bg-sidebar text-sidebar-foreground no-print">
            <SidebarHeader>
                <Logo />
            </SidebarHeader>
            <SidebarContent className="p-2">
                <SidebarNav />
            </SidebarContent>
            <SidebarFooter>
                {/* Footer content if any */}
            </SidebarFooter>
        </Sidebar>
        <main className="flex flex-1 flex-col">
          <Header />
          <div className="flex-1 p-6 sm:p-8 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
