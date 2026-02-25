'use client';

// This component has been reset. It now simply renders its children.
// All routing and permission logic has been removed for a clean start.
export function RoleGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
