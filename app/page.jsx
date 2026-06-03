'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Workbench Hero acts as the main content sequence */}
      <Hero />

      {/* Ft2: Inline-rule single line */}
      <footer className="mt-auto border-t border-border py-8 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>vs-integrate · Track Real Coding</p>
          <p>&copy; 2026 · MIT Licensed</p>
        </div>
      </footer>
    </main>
  );
}
