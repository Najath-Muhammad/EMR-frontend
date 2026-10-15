import React, { useEffect, useState, useCallback } from 'react';
import type { User, LoginCredentials, AuthContextType } from '../types/auth.types';
import { loginApi, logoutApi, refreshApi } from '../api/auth.api';
import { tokenManager } from '../api/tokenManager';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session via HttpOnly cookie refresh on initial mount
  useEffect(() => {
    let isMounted = true;

    async function initSession(): Promise<void> {
      try {
        const response = await refreshApi();
        if (isMounted && response.success && response.data) {
          tokenManager.setToken(response.data.accessToken);
          setUser(response.data.user);
        }
      } catch {
        if (isMounted) {
          tokenManager.clearToken();
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initSession();

    // Listen for session expiration events from Axios interceptor
    const handleSessionExpired = (): void => {
      tokenManager.clearToken();
      setUser(null);
    };

    window.addEventListener('emr:auth:session-expired', handleSessionExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('emr:auth:session-expired', handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    const response = await loginApi(credentials);
    tokenManager.setToken(response.data.accessToken);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutApi();
    } catch {
      // Proceed with client-side cleanup regardless
    } finally {
      tokenManager.clearToken();
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
