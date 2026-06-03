'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LayoutDashboard, TerminalSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Logo from './Logo';
import ContributionGraph from './ContributionGraph';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export default function Hero() {
  const { data: session } = useSession();

  /* ── Authenticated view ── */
  if (session) {
    return (
      <section className="min-h-screen px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-background">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} className="mb-6 flex justify-center">
            <Logo size="lg" />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-2xl sm:text-3xl font-display font-medium mb-4 text-foreground"
          >
            You’re in.
          </motion.h1>

          <motion.p variants={fadeUp} className="text-base text-muted-foreground mb-8">
            Install the extension, connect your account, and confirm tracking.
          </motion.p>

          <motion.div variants={fadeUp} className="flex justify-center">
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium flex items-center gap-2 transition-colors outline-ring">
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  /* ── Unauthenticated view (Workbench Macrostructure) ── */
  return (
    <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-background relative selection:bg-accent/20">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-[1000px] mx-auto"
      >
        {/* Small, functional heading */}
        <motion.header variants={fadeUp} className="max-w-2xl mb-12 sm:mb-16">
          <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase mb-3 font-sans">
            vs-integrate
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-[clamp(2.75rem,5vw+1rem,5rem)] font-display text-foreground leading-[1.05] tracking-tight mb-6">
            Track real coding. <br className="hidden sm:block" />
            Not just commits.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            Visualize real VS Code activity with contribution graphs, streaks, and productivity insights. No code access required.
          </p>
        </motion.header>

        {/* The Workbench Frame (Minimal Hairline, no fake chrome) */}
        <motion.section variants={fadeUp} className="relative w-full rounded-xl bg-card border border-border shadow-[0_4px_24px_oklch(0%_0_0_/_0.04)] overflow-hidden mb-8">
          
          {/* Main Screenshot/Demo Area */}
          <div className="p-8 sm:p-12 bg-background flex justify-center items-center relative min-h-[300px]">
             {/* Subtle background pattern for depth */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="relative z-10 w-full max-w-3xl bg-card p-6 rounded-lg border border-border shadow-sm">
              <ContributionGraph />
              
              {/* Annotation Callout */}
              <div className="absolute -right-4 -bottom-6 sm:-right-12 sm:bottom-4 flex flex-col items-start gap-1">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-accent/60 -rotate-12 mb-1">
                  <path d="M5 35 Q 20 5 35 15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M28 12 L 36 15 L 32 23" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-medium text-foreground bg-card px-3 py-1.5 rounded-full border border-border shadow-sm">
                  Real keystrokes, logged automatically.
                </span>
              </div>
            </div>
          </div>
        </motion.section>
        
        {/* Inline Workbench steps */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-t border-border">
          <div className="flex flex-col gap-2">
            <TerminalSquare className="w-5 h-5 text-muted-foreground mb-2" />
            <h3 className="text-base font-medium text-foreground">1. Install</h3>
            <p className="text-sm text-muted-foreground">Add the extension to your VS Code editor.</p>
          </div>
          <div className="flex flex-col gap-2">
            <svg className="w-5 h-5 text-muted-foreground mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            <h3 className="text-base font-medium text-foreground">2. Connect</h3>
            <p className="text-sm text-muted-foreground">Sign in securely to link your activity stream.</p>
          </div>
          <div className="flex flex-col gap-2">
            <svg className="w-5 h-5 text-muted-foreground mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <h3 className="text-base font-medium text-foreground">3. Track</h3>
            <p className="text-sm text-muted-foreground">Write code. The graph builds itself instantly.</p>
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}
