
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Teacher {
  id: number;
  fullName: string;
  email: string;
  profileImage?: string;
}

interface AuthContextType {
  teacher: Teacher | null;
  isLoading: boolean;
  login: (teacher: Teacher) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    console.log('🔍 AuthContext: checkAuth() called');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log(`✅ AuthContext: Authentication successful for: ${data.user.email}`);
          setTeacher({
            id: data.user.id,
            fullName: data.user.fullName,
            email: data.user.email,
            profileImage: data.user.profileImage
          });
        } else {
          setTeacher(null);
        }
      } else {
        setTeacher(null);
      }
    } catch (error) {
      console.log('🚨 AuthContext: Auth check error:', error);
      setTeacher(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (teacherData: Teacher) => {
    console.log(`🔥 AuthContext: login() called for:`, teacherData.email);
    setTeacher(teacherData);
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      setTeacher(null);
      router.push('/login');
    }
  };

  const refreshAuth = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ teacher, isLoading, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}