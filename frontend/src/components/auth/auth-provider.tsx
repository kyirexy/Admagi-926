"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';

interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  createdAt: string
}

interface AuthContextType {
  user: User | null;
  session: any;
  isLoading: boolean;
  error: any;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: sessionData, isPending, error, refetch } = useSession()
  
  console.log('AuthProvider: sessionData:', sessionData)
  console.log('AuthProvider: isPending:', isPending)
  console.log('AuthProvider: error:', error)
  
  const user = sessionData?.user || null
  const session = sessionData?.session || null
  
  console.log('AuthProvider: user:', user)
  console.log('AuthProvider: session:', session)
  
  const value = {
    user,
    session,
    isLoading: isPending,
    error,
    refetch
  }
  
  console.log('AuthProvider: providing value:', value)
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
