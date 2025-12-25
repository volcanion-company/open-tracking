'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';

interface RequireAuthProps {
  children: React.ReactNode;
  roles?: string[];
}

export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check role-based access
  if (roles && user && !roles.includes(user.role)) {
    return (
      <Box sx={{ p: 3 }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </Box>
    );
  }

  return <>{children}</>;
}

interface RequirePermissionProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

export function RequirePermission({ children, permission, fallback }: RequirePermissionProps) {
  const { user } = useAuth();

  // TODO: Implement actual permission checking
  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    // Simple role-based permission for now
    switch (user.role) {
      case 'Admin':
        return true;
      case 'PartnerAdmin':
        return !permission.includes('delete') && !permission.includes('admin');
      case 'Viewer':
        return permission.includes('view') || permission.includes('read');
      default:
        return false;
    }
  };

  if (!hasPermission(permission)) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}
