'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Code2,
  Download,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  Lock,
  TerminalSquare,
  Zap,
} from 'lucide-react';
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
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export default function Hero() {
  const { data: session } = useSession();

  if (session) {
    return (
      <section className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-background">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} className="mb-6 flex justify-center">
            <Logo size="lg" />
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl font-display font-normal mb-4 text-foreground">
            You are in.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-base text-muted-foreground mb-8">
            Open your dashboard, finish setup, or adjust how your profile is shared.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-full font-medium transition-colors">
              Setup guide
            </Link>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  const footerLinks = [
    { href: '/signup', label: 'Dashboard' },
    { href: '/signup', label: 'Setup guide' },
    { href: '/signup', label: 'Settings' },
    { href: '/login', label: 'Sign in' },
  ];

  const features = [
    { icon: Clock, title: 'Session timeline', text: 'See today’s sessions, live timer state, and tracked duration in one place.' },
    { icon: BarChart3, title: 'Contribution graph', text: 'Build a GitHub-style activity map from actual editor time instead of commit frequency.' },
    { icon: Zap, title: 'Productivity score', text: 'Track consistency, focus, session quality, and daily progress without manual logs.' },
    { icon: Code2, title: 'Language mix', text: 'Understand where your coding hours go across TypeScript, Python, CSS, and more.' },
    { icon: KeyRound, title: 'API-key setup', text: 'Use a per-account key so VS Code can send heartbeats securely to your profile.' },
    { icon: EyeOff, title: 'No code access', text: 'The extension sends metadata such as time, language, platform, and anonymized project hash.' },
  ];

  return (
    <div className="page-shell relative selection:bg-accent/20">
      <section className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto min-h-[calc(100vh-5.5rem)] grid grid-cols-1 lg:grid-cols-[0.86fr_1.14fr] gap-5 lg:gap-8 items-center"
        >
          <motion.header variants={fadeUp} className="text-left">
            
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-normal text-foreground leading-tight tracking-normal mb-5">
              Track real coding activity.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              vs-integrate turns editor heartbeats into sessions, focus time, streaks, language mix, and daily progress without reading your source code.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium transition-colors">
                Start tracking <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-full font-medium transition-colors">
                See setup
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3 max-w-lg">
              {[
                ['0 code', 'content read'],
                ['VSIX', 'install flow'],
                ['Live', 'session timer'],
              ].map(([value, label]) => (
                <div key={value} className="muted-panel rounded-lg p-3">
                  <p className="text-lg font-medium text-primary leading-none">{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </motion.header>

          <motion.section variants={fadeUp} className="relative w-full min-w-0 rounded-xl app-surface overflow-hidden">
            <div className="p-3 sm:p-4 lg:p-5 relative">
              <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              <div className="relative z-10 w-full bg-card/80 p-3 sm:p-4 rounded-lg border border-border">
                <ContributionGraph />
                <div className="hidden md:flex absolute right-4 bottom-4 flex-col items-start gap-1">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-primary/60 -rotate-12 mb-1">
                    <path d="M5 35 Q 20 5 35 15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M28 12 L 36 15 L 32 23" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm font-medium text-foreground bg-card px-3 py-1.5 rounded-lg border border-border shadow-sm whitespace-nowrap">
                    Live editor heartbeats.
                  </span>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </section>

      <section id="features" className="scroll-mt-24 px-4 sm:px-6 lg:px-8 py-14 border-t border-border bg-background/70">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-normal mb-3">What you get after connecting VS Code</h2>
            <p className="text-muted-foreground">The dashboard focuses on behavior you can act on: how long you stayed focused, what you worked in, and whether your routine is improving.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="app-card p-5">
                  <Icon className="w-5 h-5 text-primary mb-4" />
                  <h3 className="text-base font-medium mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 px-4 sm:px-6 lg:px-8 py-14 bg-secondary/35 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-12 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-normal mb-3">Set up once, then code normally.</h2>
              <p className="text-muted-foreground leading-relaxed">
                The onboarding flow downloads the extension, generates your API key, and verifies that heartbeats are arriving. After that, your dashboard updates as you work.
              </p>
              <Link href="/signup" className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors">
                Create account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Download, title: 'Install', text: 'Download the VSIX and install it from the VS Code Extensions menu.' },
                { icon: TerminalSquare, title: 'Connect', text: 'Paste your API key through the VS Integrate command palette action.' },
                { icon: CheckCircle2, title: 'Verify', text: 'Open the dashboard and confirm live tracking, sessions, and daily totals.' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="app-card p-5">
                    <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-medium text-sm mb-4">{index + 1}</span>
                    <Icon className="w-5 h-5 text-primary mb-3" />
                    <h3 className="font-medium mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" className="scroll-mt-24 px-4 sm:px-6 lg:px-8 py-14 border-t border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="app-card p-6">
            <Lock className="w-5 h-5 text-primary mb-4" />
            <h2 className="text-2xl font-normal mb-3">Private by default</h2>
            <p className="text-muted-foreground leading-relaxed">
              vs-integrate is built for activity analytics, not surveillance. It does not collect file contents, keystroke text, file names, repository paths, or source code.
            </p>
          </div>
          <div className="app-card p-6">
            <h3 className="font-medium mb-4">Tracked signals</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              {['Session duration', 'Programming language', 'Platform', 'Anonymized project hash', 'Daily contribution totals', 'Goal progress'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-14 bg-secondary/40 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-normal mb-3">Ready when your editor is.</h2>
          <p className="text-muted-foreground mb-6">Create an account, connect the extension, and let the dashboard tell the truth about your coding rhythm.</p>
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors">
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-4 sm:px-6 lg:px-8 py-8 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground mt-2">Track real coding activity without exposing code.</p>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-5 text-sm">
            {footerLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
