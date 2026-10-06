import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Citizen } from '../types';
import { apiRequest, setAuthToken, clearAuthToken, getAuthToken } from '../api/client';

interface AuthResponse {
  token: string;
  user: User;
  role: 'citizen' | 'officer' | 'admin';
  department?: string | null;
  citizen?: Citizen | null;
}

interface AuthContextType {
  user: User | null;
  role: 'citizen' | 'officer' | 'admin' | null;
  citizen: Citizen | null;
  department: string | null;
  loading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  register: (data: Record<string, any>) => Promise<void>;
  logout: () => void;
  switchDemoUser: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'citizen' | 'officer' | 'admin' | null>(null);
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load session from storage or initialize default demo citizen (Rahul Sharma)
  useEffect(() => {
    async function initAuth() {
      const savedUser = localStorage.getItem('setuseva_user_data');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed.user);
          setRole(parsed.role);
          setCitizen(parsed.citizen || null);
          setDepartment(parsed.department || null);
          setLoading(false);
          return;
        } catch (e) {
          console.error(e);
        }
      }

      // Default to citizen_rahul for instant smooth student demonstration
      try {
        await switchDemoUser('citizen_rahul');
      } catch (err) {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const saveSession = (data: AuthResponse) => {
    setAuthToken(data.token);
    setUser(data.user);
    setRole(data.role);
    setCitizen(data.citizen || null);
    setDepartment(data.department || null);
    localStorage.setItem('setuseva_user_data', JSON.stringify(data));
  };

  const login = async (username: string, password = 'citizen123') => {
    setLoading(true);
    try {
      const data = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      saveSession(data);
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData: Record<string, any>) => {
    setLoading(true);
    try {
      const data = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      saveSession(data);
    } finally {
      setLoading(false);
    }
  };

  const switchDemoUser = async (username: string) => {
    setLoading(true);
    try {
      const data = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password: 'password' }),
      });
      saveSession(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    localStorage.removeItem('setuseva_user_data');
    setUser(null);
    setRole(null);
    setCitizen(null);
    setDepartment(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        citizen,
        department,
        loading,
        login,
        register,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
