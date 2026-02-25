'use client';

import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard } from "lucide-react";

// This component has been reset to show only a single, static link.
export function SidebarNav() {
  return (
    <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Dashboard">
            <LayoutDashboard />
            <span className="truncate">Dashboard</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
    </SidebarMenu>
  );
}
