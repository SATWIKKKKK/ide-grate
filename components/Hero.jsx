'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Github, Zap, ArrowRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ContributionGraph from './ContributionGraph';

/* Inline Google "G" icon */
function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
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
  const { data: session } = useSession();

  return (
    <section className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Background gradient overlay for dark mode */}
      <div className="absolute inset-0 bg-linear-to-br bg-black  pointer-events-none dark:block hidden" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Content */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.h1
            variants={item}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-balance"
          >
            Track Your Real Coding.{' '}
            <span className="bg-linear-to-r from-foreground to-blue-800 bg-clip-text text-transparent">
              Not Just Commits.
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed"
          >
            Visualize real VS Code activity with contribution graphs, streaks, and productivity insights — automatically.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 mb-4">
            {session ? (
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-muted hover:bg-muted/80 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                  >
                    Sign In
                  </motion.button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Secondary info */}
          <motion.p
            variants={item}
            className="text-sm text-muted-foreground"
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
            <div className="relative bg-card p-6 rounded-2xl border border-border shadow-2xl">
              <ContributionGraph />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
