'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in (from localStorage or session)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('codeviz_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email, provider) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          provider,
          name: email.split('@')[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sign in');
      }

      const userData = await response.json();
      setUser({ ...userData, email });
      if (typeof window !== 'undefined') {
        localStorage.setItem('codeviz_user', JSON.stringify({ ...userData, email }));
      }
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('codeviz_user');
  };

  const logActivity = async (activity) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          userId: user._id,
          ...activity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log activity');
      }

      return await response.json();
    } catch (err) {
      console.error('Error logging activity:', err);
      throw err;
    }
  };

  const getAnalytics = async (days = 30) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(
        `/api/analytics?email=${user.email}&days=${days}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching analytics:', err);
      throw err;
    }
  };

  const getContributions = async (range = 'year') => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(
        `/api/contributions?email=${user.email}&range=${range}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching contributions:', err);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
    logActivity,
    getAnalytics,
    getContributions,
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
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
