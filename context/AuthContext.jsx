'use client';

import { createContext, useContext, useMemo } from 'react';
import { useSession, signIn as nextSignIn, signOut as nextSignOut } from 'next-auth/react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();

  const user = session?.user ?? null;
  const loading = status === 'loading';

  // Wrap NextAuth signIn/signOut to keep previous API surface
  const signIn = async (emailOrProvider, provider = 'credentials') => {
    // If using credentials/dev login, call NextAuth's signIn with provider id
    if (provider === 'dev' || provider === 'credentials') {
      // for dev login we expect emailOrProvider to be an object: { email, name }
      return nextSignIn('dev-login', {
        redirect: true,
        email: emailOrProvider?.email,
        name: emailOrProvider?.name || emailOrProvider?.email?.split('@')[0],
      });
    }

    // For OAuth providers, delegate to NextAuth
    return nextSignIn(provider);
  };

  const signOut = async (opts) => nextSignOut(opts);

  const logActivity = async (activity) => {
    if (!user?.email) throw new Error('User not authenticated');

    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, ...activity }),
    });

    if (!res.ok) throw new Error('Failed to log activity');
    return res.json();
  };

  const getAnalytics = async (days = 30) => {
    if (!user?.email) throw new Error('User not authenticated');
    const res = await fetch(`/api/analytics?email=${encodeURIComponent(user.email)}&days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  };

  const getContributions = async (range = 'year') => {
    if (!user?.email) throw new Error('User not authenticated');
    const res = await fetch(`/api/contributions?email=${encodeURIComponent(user.email)}&range=${range}`);
    if (!res.ok) throw new Error('Failed to fetch contributions');
    return res.json();
  };

  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signOut,
    logActivity,
    getAnalytics,
    getContributions,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
