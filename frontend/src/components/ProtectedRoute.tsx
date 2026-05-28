import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import type { ReactNode } from 'react';

export function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container py-20 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/account" replace />;
  }
  return <>{children}</>;
}
