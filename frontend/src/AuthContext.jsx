import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from './services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    return authService.getCurrentUser();
  });

  useEffect(() => {
    if (auth) {
      localStorage.setItem('auth', JSON.stringify(auth));
    } else {
      localStorage.removeItem('auth');
      localStorage.removeItem('token');
    }
  }, [auth]);

  const signIn = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        setAuth({ email: result.data.email });
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error || 'Login failed'
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const signOut = () => {
    authService.logout();
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 