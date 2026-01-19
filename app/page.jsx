'use client';

import { useState, useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Insights from '@/components/Insights';
import Privacy from '@/components/Privacy';
import Stats from '@/components/Stats';
import FinalCTA from '@/components/FinalCTA';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <AuthProvider>
      <main className="bg-black text-white overflow-hidden">
        <Navbar />
        <Hero />
        <Features />
        <Insights />
        <Privacy />
        <Stats />
        <FinalCTA />
      </main>
    </AuthProvider>
  );
}
