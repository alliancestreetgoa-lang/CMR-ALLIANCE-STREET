import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export type UserRole = "super_admin" | "admin" | "employee";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("erp_token"));
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchMe = async (authToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        localStorage.removeItem("erp_token");
        setToken(null);
      }
    } catch {
      localStorage.removeItem("erp_token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Login Failed", description: err.message, variant: "destructive" });
        return false;
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("erp_token", data.token);
      
      queryClient.clear();
      
      toast({ title: `Welcome back, ${data.user.name}!`, description: `Logged in as ${data.user.role.replace("_", " ")}` });
      return true;
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchMe(token);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("erp_token");
    queryClient.clear();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function canManageClients(role?: string) {
  return role === "super_admin" || role === "admin";
}

export function canManageUsers(currentUserRole?: string, targetRole?: string) {
  if (!currentUserRole) return false;
  if (currentUserRole === "super_admin") return true;
  if (currentUserRole === "admin") return targetRole === "employee";
  return false;
}

export function canAssignTasks(role?: string) {
  return role === "super_admin" || role === "admin";
}
