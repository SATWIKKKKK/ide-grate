'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Code2, ArrowRight, Key, LayoutDashboard } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ContributionGraph from './ContributionGraph';

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

  /* ── Authenticated view ── */
  if (session) {
    return (
      <section className="min-h-screen px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-black pointer-events-none" />
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <motion.div variants={item} className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
              <Key className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
          >
            You&apos;re in.{' '}
            <span className="bg-linear-to-r from-white to-blue-400 bg-clip-text text-transparent">
              Now go get your API key.
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg text-gray-400 mb-10 leading-relaxed"
          >
            Head to your dashboard, generate an API key, and connect your VS Code extension to start tracking real activity.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg"
              >
                <LayoutDashboard className="w-5 h-5" />
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link href="/onboarding">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 text-white"
              >
                <Key className="w-5 h-5 text-gray-400" />
                Setup Guide
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  /* ── Unauthenticated view ── */
  return (
    <section className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-black pointer-events-none" />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Content */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.h1
            variants={item}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-balance"
          >
            Track Your Real Coding.{' '}
            <span className="bg-linear-to-r from-white to-blue-400 bg-clip-text text-transparent">
              Not Just Commits.
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg text-gray-400 mb-8 max-w-lg leading-relaxed"
          >
            Visualize real VS Code activity with contribution graphs, streaks, and productivity insights — automatically.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 mb-4">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 text-white"
              >
                Sign In
              </motion.button>
            </Link>
          </motion.div>

          {/* Secondary info */}
          <motion.p
            variants={item}
            className="text-sm text-gray-500"
          >
            No code access. No file names. Just your real activity.
          </motion.p>
        </motion.div>

        {/* Right Visual — contribution graph with glitter */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden lg:block"
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-linear-to-r from-blue-600/20 to-transparent rounded-2xl blur-3xl" />
            <div className="relative bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-2xl">
              <ContributionGraph />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

