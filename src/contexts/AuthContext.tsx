import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { authApi, userApi } from '../api';

type AuthUser = User | null;

type AuthContextValue = {
  user: AuthUser;
  accessToken: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (payload: { email: string; password: string }) => Promise<{ ok: true } | { ok: false; message: string }>;
  register: (payload: { username: string; email: string; password: string }) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
};

const ACCESS_TOKEN_KEY = 'accessToken';
const AUTH_USER_KEY = 'authUser';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(() => safeJsonParse<User>(localStorage.getItem(AUTH_USER_KEY)));
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('authToken'));
  const [initializing, setInitializing] = useState(true);

  const persistAuth = useCallback((next: { accessToken: string; user: User }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, next.accessToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next.user));
    localStorage.removeItem('authToken');
    setAccessToken(next.accessToken);
    setUser(next.user);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem('authToken');
    localStorage.removeItem(AUTH_USER_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      return;
    }

    const resp = await userApi.getCurrentUser();
    if (resp.code === 200) {
      const nextUser = resp.data;
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      return;
    }

    if (resp.code === 401) {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        if (accessToken && !user) {
          await refreshCurrentUser();
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshCurrentUser, user]);

  const login: AuthContextValue['login'] = useCallback(
    async (payload) => {
      const resp = await authApi.login(payload);
      if (resp.code === 200 && resp.data?.accessToken && resp.data?.user) {
        persistAuth(resp.data);
        return { ok: true };
      }
      return { ok: false, message: resp.message || '登录失败' };
    },
    [persistAuth]
  );

  const register: AuthContextValue['register'] = useCallback(
    async (payload) => {
      const resp = await authApi.register(payload);
      if (resp.code === 200 && resp.data?.accessToken && resp.data?.user) {
        persistAuth(resp.data);
        return { ok: true };
      }
      return { ok: false, message: resp.message || '注册失败' };
    },
    [persistAuth]
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      initializing,
      login,
      register,
      logout,
      refreshCurrentUser,
    };
  }, [accessToken, initializing, login, logout, refreshCurrentUser, register, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
