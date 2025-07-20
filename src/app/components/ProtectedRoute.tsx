
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  fallback = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}: ProtectedRouteProps) {
  const { teacher, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !teacher) {
      router.push('/login');
    }
  }, [teacher, isLoading, router]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!teacher) {
    return null;
  }

  return <>{children}</>;
}