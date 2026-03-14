'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Home, LayoutDashboard, BookOpen, ChevronDown, Menu, X, Settings } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

export default function Navbar() {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
    { href: '/settings', label: 'Settings', icon: Settings, requiresAuth: true },
  ];

  const filteredLinks = navLinks.filter(link => !link.requiresAuth || session);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/80 border-b border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
        {/* Logo (left) */}
        <div className="flex items-center gap-2">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center cursor-pointer"
            >
              <Logo size="sm" />
            </motion.div>
          </Link>
        </div>

        {/* Centered Navigation Links (md+) */}
        <div className="flex-1 flex justify-center">
          <div className="hidden md:flex items-center gap-1">
            {filteredLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </motion.span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* User Menu or Sign In */}
          {session ? (
            <div className="relative" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
              >
                {session.user.image ? (
                  <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                    {session.user.name?.[0] || session.user.email?.[0] || '?'}
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium">{session.user.name}</span>
                <motion.span
                  animate={{ rotate: showUserMenu ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-60 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
                  >
                    {/* User info */}
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-center gap-3">
                        {session.user.image ? (
                          <img src={session.user.image} alt="" className="w-9 h-9 rounded-full ring-2 ring-blue-500/30" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-blue-500/30">
                            {session.user.name?.[0] || '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-white truncate">{session.user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation items */}
                    <div className="py-1">
                      {[
                        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                        { href: '/settings', label: 'Settings', icon: Settings },
                        { href: '/onboarding', label: 'Setup Guide', icon: BookOpen },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${
                              isActive
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            <Icon className="w-4 h-4 opacity-70" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-gray-800 py-1">
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: '/' });
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-3 text-sm transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Sign In
                </motion.button>
              </Link>
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-all"
                >
                  Sign Up
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-800 bg-black/95 backdrop-blur-md">
          <div className="px-4 py-3 flex flex-col gap-1">
            {filteredLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`px-3 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium ${
                    isActive ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </motion.nav>
  );
}
