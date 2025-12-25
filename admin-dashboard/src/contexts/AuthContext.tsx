'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthToken, AuthState } from '@/types/models';
import { tokenStorage } from '@/api';
import config from '@/config';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Initialize auth state from storage
    if (config.features.enableAuth) {
      initializeAuth();
    } else {
      // Auth disabled - set mock user
      setAuthState({
        user: {
          id: 'mock-user',
          email: 'admin@volcanion.local',
          name: 'Admin User',
          role: 'Admin',
        },
        token: null,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  }, []);

  const initializeAuth = async () => {
    const token = tokenStorage.getToken();
    if (token) {
      try {
        // TODO: Validate token and fetch user info
        // const user = await validateToken(token);
        // setAuthState({ user, token: { accessToken: token }, isAuthenticated: true, isLoading: false });
      } catch (error) {
        tokenStorage.clearTokens();
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    // TODO: Implement actual login API call
    // const response = await authApi.login({ email, password });
    // tokenStorage.setToken(response.accessToken);
    // setAuthState({ user: response.user, token: response.token, isAuthenticated: true, isLoading: false });
    
    throw new Error('Authentication is not enabled');
  };

  const logout = () => {
    tokenStorage.clearTokens();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshToken = async () => {
    // TODO: Implement token refresh
    throw new Error('Token refresh not implemented');
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
