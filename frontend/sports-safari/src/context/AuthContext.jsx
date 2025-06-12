import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    role: null
  });

  const login = useCallback((token, role, user) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(user));
      setAuth({
        isAuthenticated: true,
        user,
        role
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error; // Re-throw to handle in components
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      setAuth({
        isAuthenticated: false,
        user: null,
        role: null
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        const role = localStorage.getItem('role');

        // Safely handle user parsing
        let user = null;
        if (userString && userString !== 'undefined' && userString !== 'null') {
          try {
            user = JSON.parse(userString);
          } catch (parseError) {
            console.error("Error parsing user data:", parseError);
            logout(); // Clear invalid data
            return;
          }
        }

        if (token && user) {
          setAuth({
            isAuthenticated: true,
            user,
            role: role || 'user' // Default role
          });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        logout(); // Clear any corrupted data
      }
    };

    initializeAuth();
  }, [logout]); // Add logout as dependency

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: auth.isAuthenticated,
      user: auth.user,
      role: auth.role,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};