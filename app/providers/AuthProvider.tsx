"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://localhost:5000";

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

// Simplified axios interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh") &&
      !originalRequest.url?.includes("/api/auth/login") &&
      !originalRequest.url?.includes("/api/auth/verify") // Don't intercept verify calls
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axios(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post("/api/auth/refresh");
        processQueue(null);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ["/login", "/register", "/register-branch", "/register/admin-check", "/register-branch/admin-check"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  const checkAuthentication = async (): Promise<boolean> => {
    try {
      // First try to refresh token (silent fail if no refresh token)
      await axios.post("/api/auth/refresh");
    } catch {
      // Ignore refresh errors - might not have refresh token
    }

    try {
      // Now verify the access token
      const response = await axios.get("/api/auth/verify");
      return response.status === 200;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await checkAuthentication();
      setIsAuthenticated(authenticated);

      if (authenticated && isPublicPath) {
        router.replace("/");
      } else if (!authenticated && !isPublicPath) {
        router.replace("/login");
      }

      setIsLoading(false);
    };

    verifyAuth();
  }, [pathname, router, isPublicPath]);

  const login = () => {
    setIsAuthenticated(true);
    router.replace("/");
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setIsAuthenticated(false);
      router.replace("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isPublicPath) return null;
  if (isAuthenticated && isPublicPath) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}