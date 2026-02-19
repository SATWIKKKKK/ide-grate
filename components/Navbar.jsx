'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, User, LogOut, Code2 } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

export default function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-blue-500 bg-clip-text text-transparent">
              vs-integrate
            </span>
          </motion.div>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </motion.button>

          {/* User Menu or Sign In */}
          {session ? (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all duration-300 flex items-center gap-2"
              >
                {session.user.image ? (
                  <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{session.user.name}</span>
              </motion.button>

              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-border">
                    <p className="text-sm text-muted-foreground">{session.user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="block w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                  >
                    Dashboard
                  </Link>
                  <motion.button
                    whileHover={{ backgroundColor: 'var(--muted)' }}
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </motion.button>
                </motion.div>
              )}
            </div>
          ) : (
            <Link href="/auth/signin">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
              >
                Sign In
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
}