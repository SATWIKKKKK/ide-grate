'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Github, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ContributionGraph from './ContributionGraph';

function HeroSignInButton({ provider, icon: Icon }) {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would redirect to OAuth provider
      const mockEmail = `user-${Math.random().toString(36).substr(2, 9)}@codeviz.app`;
      await signIn(mockEmail, provider);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const providerNames = {
    vscode: 'VS Code',
    microsoft: 'Microsoft',
    github: 'GitHub',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)' }}
      whileTap={{ scale: 0.95 }}
      onClick={handleSignIn}
      disabled={isLoading}
      className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className="w-5 h-5 group-hover:rotate-6 transition-transform" />
      Sign in with {providerNames[provider]}
    </motion.button>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Hero() {
  return (
    <section className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-black to-black pointer-events-none" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Content */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.h1
            variants={item}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-balance"
          >
            Track Your Real Coding.{' '}
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Not Just Commits.
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-xl text-gray-400 mb-8 max-w-lg leading-relaxed"
          >
            Visualize real VS Code activity with contribution graphs, streaks, and productivity insights — automatically.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 mb-12">
            <HeroSignInButton provider="vscode" icon={Code2} />
            <HeroSignInButton provider="microsoft" icon={Zap} />
            <HeroSignInButton provider="github" icon={Github} />
          </motion.div>

          {/* Secondary info */}
          <motion.p
            variants={item}
            className="text-sm text-gray-500"
          >
            No code access. No file names. Just your real activity.
          </motion.p>
        </motion.div>

        {/* Right Visual */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden lg:block"
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-transparent rounded-2xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-blue-900/40 shadow-2xl">
              <ContributionGraph />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
