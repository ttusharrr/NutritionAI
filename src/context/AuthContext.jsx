/**
 * Auth Context — Global authentication state management.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage and ping the server
  useEffect(() => {
    const initAuth = async () => {
      // Fire-and-forget background ping to warm up the backend server immediately on launch
      authApi.pingServer();

      const token = authApi.getToken();
      const storedUser = localStorage.getItem('nutriai_user');

      if (token && storedUser) {
        try {
          // Verify token is still valid
          const data = await authApi.getMe();
          setUser(data.user);
          setIsAuthenticated(true);
          localStorage.setItem('nutriai_user', JSON.stringify(data.user));
        } catch {
          // Token expired or invalid
          authApi.clearTokens();
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password, rememberMe) => {
    const data = await authApi.login(email, password, rememberMe);

    if (data.requires_verification) {
      return { requiresVerification: true, email: data.email };
    }

    setUser(data.user);
    setIsAuthenticated(true);
    return { success: true, user: data.user };
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    return {
      requiresVerification: true,
      email: data.email,
      emailSent: data.email_sent,
    };
  }, []);

  const verifyOTP = useCallback(async (email, otp) => {
    const data = await authApi.verifyOTP(email, otp);
    setUser(data.user);
    setIsAuthenticated(true);
    return { success: true, user: data.user };
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const data = await authApi.googleAuth(credential);
    setUser(data.user);
    setIsAuthenticated(true);
    return {
      success: true,
      user: data.user,
      isNewUser: data.is_new_user,
    };
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('nutriai_user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    verifyOTP,
    googleLogin,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;
