'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import GetStarted from '@/components/GetStarted';
import FinalCTA from '@/components/FinalCTA';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <main className="min-h-screen overflow-hidden">
      <Navbar />
      <Hero />
      <GetStarted />
      <FinalCTA />
    </main>
  );
}
