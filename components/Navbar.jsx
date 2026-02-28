'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, Code2, Home, LayoutDashboard, Settings, ChevronDown, Menu, X } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();

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
              <Image
                src="/logo.png"
                alt="vs-integrate"
                width={300}
                height={300}
                className="h-16 w-auto object-contain -my-3"
                priority
              />
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
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
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
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </motion.button>

              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-800">
                    <p className="font-medium text-sm text-white">{session.user.name}</p>
                    <p className="text-xs text-gray-400">{session.user.email}</p>
                  </div>
                  
                  {/* Mobile Navigation */}
                  <div className="md:hidden border-b border-gray-800">
                    {filteredLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors text-gray-300"
                        >
                          <Icon className="w-4 h-4 text-gray-500" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                  
                  <Link
                    href="/onboarding"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors text-gray-300"
                  >
                    <Code2 className="w-4 h-4 text-gray-500" />
                    Setup Guide
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-800 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
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
    </motion.nav>
  );
}