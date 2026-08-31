"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, getStoredUser, setAuthSession, clearAuthSession, parseJwt } from "@/lib/auth";
import { apiClient } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const resp = await apiClient<{
        access: string;
        refresh: string;
        user: {
          id: string;
          email: string;
          first_name?: string;
          last_name?: string;
          role: string;
          phone_number?: string;
        };
      }>("/api/v1/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const decoded = parseJwt(resp.access);
      const userRole = (resp.user?.role || decoded?.role || "agent") as AuthUser["role"];
      const firstName = resp.user?.first_name || "";
      const lastName = resp.user?.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim() || resp.user?.email || "User";

      const authUser: AuthUser = {
        id: resp.user?.id || decoded?.user_id || "",
        email: resp.user?.email || email,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        role: userRole,
        phone_number: resp.user?.phone_number || "",
      };

      setAuthSession({ access: resp.access, refresh: resp.refresh }, authUser);
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
