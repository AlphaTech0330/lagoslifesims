import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('game_jwt_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Authenticated fetch wrapper for API calls
  const fetchWithAuth = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  };

  // Check auth session on load
  useEffect(() => {
    const loadPlayerProfile = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchWithAuth('/auth/me');
        if (data.success) {
          setPlayer(data.player);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Session restoration failed:', error.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerProfile();
  }, [token]);

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem('game_jwt_token', data.token);
    setToken(data.token);
    setPlayer(data.player);
    return data;
  };

  const register = async (username, email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');

    localStorage.setItem('game_jwt_token', data.token);
    setToken(data.token);
    setPlayer(data.player);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('game_jwt_token');
    setToken(null);
    setPlayer(null);
  };

  return (
    <AuthContext.Provider
      value={{
        player,
        token,
        isLoading,
        login,
        register,
        logout,
        fetchWithAuth,
        isAuthenticated: !!token && !!player,
      }}
    >
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