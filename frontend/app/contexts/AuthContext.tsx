"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getToken, setToken, clearToken, parseJwt } from "../lib/auth";
import { authService } from "../services/authService";
import { User } from "../types/models";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getToken();
    const decoded = token ? parseJwt(token) : null;
    if (!decoded) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    authService
      .me()
      .then((me) => {
        setUser(me);
        setIsAuthenticated(true);
      })
      .catch(() => {
        clearToken();
        setIsAuthenticated(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await authService.login(username, password);
      setToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
      router.replace("/");
    },
    [router],
  );

  const logout = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
    setUser(null);
    router.replace("/connexion");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.me();
      setUser(me);
    } catch {
      clearToken();
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  }
  return ctx;
}