'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BookOpen, LayoutDashboard, LogOut, Menu, Settings, UserRound, X } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function Navbar(props) {
  const { toolbarSlot = null } = props || {};
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) setShowMobileMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [pathname]);

  const navLinks = session
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/dashboard/setup', label: 'Setup' },
        { href: '/settings', label: 'Settings' },
      ]
    : [
        { href: '/#features', label: 'Features' },
        { href: '/#how-it-works', label: 'How it works' },
      ];

  const isActive = (href) => !href.startsWith('/#') && pathname === href;

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-border bg-[var(--color-paper-glass)] backdrop-blur-xl">
      <div className="signal-container">
        <div className="relative flex h-16 items-center justify-between gap-3">
          <Link href={session ? '/dashboard' : '/'} className="inline-flex shrink-0 rounded-md">
            <Logo size="sm" />
          </Link>

          <div className={`${session ? 'hidden h-full items-end gap-8 md:flex' : 'absolute left-1/2 top-0 hidden h-full -translate-x-1/2 items-end gap-8 md:flex'}`}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex h-full items-end border-b-2 px-1 pb-4 font-mono text-sm font-medium transition-colors whitespace-nowrap hover:no-underline ${
                  isActive(link.href)
                    ? 'border-transparent text-primary hover:border-primary'
                    : 'border-transparent text-muted-foreground hover:border-primary hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {toolbarSlot && <div className="hidden sm:block">{toolbarSlot}</div>}
            <ThemeToggle />
            <button
              onClick={() => setShowMobileMenu((v) => !v)}
              className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-background/70 text-muted-foreground transition-colors hover:text-foreground md:hidden"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            {session ? (
              <>
              <button
                className="hidden size-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 font-mono text-sm font-medium text-foreground transition-colors hover:border-primary"
                  aria-label="Open account menu"
                >
                  {session.user?.image ? (
                    <img src={session.user.image} alt="" className="size-7 rounded-full border border-border object-cover" />
                  ) : (
                    <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-background">
                      {session.user?.name?.[0] || session.user?.email?.[0] || '?'}
                    </span>
                  )}
                  <span className="hidden max-w-32 truncate sm:block">{session.user?.name || 'Account'}</span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 mt-2 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-popover shadow-xl"
                    >
                      <div className="border-b border-border p-3">
                        <p className="truncate text-sm font-semibold text-foreground">{session.user?.name || 'Signed in'}</p>
                        <p className="truncate text-xs text-muted-foreground">{session.user?.email}</p>
                      </div>
                      <div className="p-1">
                        {[
                          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                          { href: '/settings', label: 'Settings', icon: Settings },
                          { href: '/dashboard/setup', label: 'Setup guide', icon: BookOpen },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
                            >
                              <Icon className="size-4 text-muted-foreground" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                      <div className="border-t border-border p-1">
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-[var(--color-danger-soft)]"
                        >
                          <LogOut className="size-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link href="/login" className="signal-button signal-button-secondary min-h-10 px-3 text-sm">
                  Sign in
                </Link>
                <Link href="/signup" className="signal-button min-h-10 px-3 text-sm">
                  Start tracking
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="border-t border-border bg-popover md:hidden"
          >
            <div className="space-y-1 p-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-md px-3 py-2 text-sm font-semibold ${
                    isActive(link.href) ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!session ? (
                <>
                  <Link href="/login" className="block rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground">
                    Sign in
                  </Link>
                  <Link href="/signup" className="mt-2 flex rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background">
                    Start tracking
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-destructive hover:bg-[var(--color-danger-soft)]"
                >
                  <UserRound className="size-4" />
                  Sign out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
