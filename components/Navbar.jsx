'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, BookOpen, ChevronDown, Menu, Settings } from 'lucide-react';
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

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinks = session
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/settings', label: 'Settings' },
      ]
    : [
        { href: '/features', label: 'Features' },
        { href: '/pricing', label: 'Pricing' },
      ];

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-6 px-4 py-2 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-[0_8px_24px_-12px_oklch(0%_0_0_/_0.18)]">
      {/* Wordmark / Logo */}
      <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2 group outline-ring rounded-full px-2">
        <Logo size="sm" />
        <span className="font-display text-lg font-medium tracking-tight text-foreground group-hover:text-foreground/80 transition-colors">vs-integrate</span>
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors outline-ring ${
              isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Auth / CTA */}
      <div className="flex items-center gap-2 ml-2">
        {session ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-1 py-1 rounded-full outline-ring hover:bg-secondary/50 transition-colors"
            >
              {session.user?.image ? (
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full border border-border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {session.user?.name?.[0] || session.user?.email?.[0] || '?'}
                </div>
              )}
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-3 w-56 bg-popover border border-border rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="p-3 border-b border-border">
                    <p className="font-medium text-sm text-foreground truncate">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                  </div>
                  <div className="py-1">
                    {[
                      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                      { href: '/settings', label: 'Settings', icon: Settings },
                      { href: '/onboarding', label: 'Setup Guide', icon: BookOpen },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors outline-ring"
                        >
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                  <div className="border-t border-border py-1">
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: '/' });
                        setShowUserMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-destructive hover:bg-destructive/10 flex items-center gap-3 text-sm transition-colors outline-ring"
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
            <Link href="/login" className="hidden md:inline-flex px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-ring rounded-full">
              Sign In
            </Link>
            <Link href="/signup" className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors outline-ring">
              Get Started &rarr;
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
