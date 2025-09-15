import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, LoginCredentials, User } from '@/types/user';
import { mockUsers } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Check if Supabase is properly configured
  const supabaseConfigured = isSupabaseConfigured();
  
  // Use Supabase auth if configured, otherwise fall back to mock auth
  const supabaseAuth = supabaseConfigured ? useSupabaseAuth() : null;
  
  // Mock auth fallback
  const [mockUser, setMockUser] = useState<AuthUser | null>(null);
  const [mockIsLoading, setMockIsLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      // Check for stored auth session on mount
      const storedUser = localStorage.getItem('cyptrix_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as AuthUser;
          setMockUser(parsedUser);
        } catch (error) {
          localStorage.removeItem('cyptrix_user');
        }
      }
      setMockIsLoading(false);
    }
  }, [supabaseConfigured]);

  const mockLogin = async (credentials: LoginCredentials): Promise<boolean> => {
    setMockIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in mock data
      const foundUser = mockUsers.find(u => 
        u.email === credentials.email && 
        u.metadata?.password === credentials.password
      );

      if (!foundUser) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        return false;
      }

      if (!foundUser.active) {
        toast({
          title: "Account Disabled",
          description: "Your account has been disabled. Contact administrator.",
          variant: "destructive",
        });
        return false;
      }

      const authUser: AuthUser = {
        ...foundUser,
        token: `mock_token_${foundUser.userId}`,
        lastLogin: new Date().toISOString(),
      };

      setMockUser(authUser);
      localStorage.setItem('cyptrix_user', JSON.stringify(authUser));
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${foundUser.name}!`,
      });

      return true;
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setMockIsLoading(false);
    }
  };

  const mockLogout = () => {
    setMockUser(null);
    localStorage.removeItem('cyptrix_user');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  // Use Supabase auth if configured, otherwise use mock auth
  const user = supabaseConfigured ? supabaseAuth?.user || null : mockUser;
  const login = supabaseConfigured && supabaseAuth?.login ? supabaseAuth.login : mockLogin;
  const logout = supabaseConfigured && supabaseAuth?.logout ? supabaseAuth.logout : mockLogout;
  const isLoading = supabaseConfigured ? supabaseAuth?.isLoading || false : mockIsLoading;

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};