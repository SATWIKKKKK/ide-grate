'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Github, Zap } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ContributionGraph from './ContributionGraph';

function HeroSignInButton({ provider, icon: Icon, label }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = async () => {
    if (session) {
      router.push('/dashboard');
      return;
    }
    setIsLoading(true);
    await signIn(provider, { callbackUrl: '/dashboard' });
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={isLoading}
      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Icon className="w-5 h-5 group-hover:rotate-6 transition-transform" />
      )}
      {label}
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
            <span className="bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
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
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 mb-12">
            <HeroSignInButton provider="github" icon={Github} label="Continue with GitHub" />
            <HeroSignInButton provider="azure-ad" icon={Zap} label="Continue with Microsoft" />
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
