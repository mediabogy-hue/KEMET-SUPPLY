import type { UserProfile } from '@/lib/types';

export type UserRole = UserProfile['role'];

// Define paths for each role. Admin has implicit access to everything starting with '/admin'
const PERMISSIONS: Record<UserRole, string[]> = {
  Admin: ['/admin'],
  OrdersManager: ['/admin/orders', '/admin/shipping', '/admin/dashboard'],
  FinanceManager: ['/admin/withdrawals', '/admin/payments', '/admin/dashboard'],
  Dropshipper: ['/dashboard', '/products', '/orders', '/reports', '/profile', '/policy'],
  Merchant: ['/merchant/dashboard', '/merchant/products', '/merchant/orders', '/merchant/inventory', '/profile'],
};

// Common paths accessible by any authenticated user
const COMMON_PATHS = ['/profile', '/policy'];

export function hasPermission(role: UserRole | null, path: string): boolean {
  if (!role) return false; // No role, no access to protected routes

  if (COMMON_PATHS.some(p => path.startsWith(p))) {
    return true;
  }
  
  if (role === 'Admin' && path.startsWith('/admin')) {
    return true;
  }
  
  // Handle /merchant path for merchants
  if (role === 'Merchant' && path.startsWith('/merchant')) {
    return true;
  }


  const allowedPaths = PERMISSIONS[role] || [];
  return allowedPaths.some(p => path.startsWith(p));
}

export function getDefaultPath(role: UserRole | null): string {
  if (role === 'Admin') return '/admin/dashboard';
  if (role === 'OrdersManager') return '/admin/orders';
  if (role === 'FinanceManager') return '/admin/withdrawals';
  if (role === 'Dropshipper') return '/dashboard';
  if (role === 'Merchant') return '/merchant/dashboard';
  
  // Default fallback for unhandled or null roles
  return '/login';
}
