'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { CheckCircle2, Code2, Radio, Shield } from 'lucide-react'
import Logo from '@/components/Logo'

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function AuthShell({
  mode,
  title,
  subtitle,
  children,
}: {
  mode: 'login' | 'signup'
  title: string
  subtitle: string
  children: ReactNode
}) {
  const isSignup = mode === 'signup'
  const proof = isSignup
    ? [
        ['Install', 'download VSIX'],
        ['Connect', 'paste API key'],
        ['Track', 'code normally'],
      ]
    : [
        ['Sessions', 'resume signal'],
        ['Goals', 'check progress'],
        ['Privacy', 'review sharing'],
      ]

  return (
    <div className="page-shell min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl grid-cols-1 items-center gap-5 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.02fr_0.9fr]">
        <section className="hidden min-h-[40rem] flex-col justify-between overflow-hidden rounded-lg border border-border bg-foreground p-8 text-background shadow-2xl lg:flex" data-gsap="fade-up">
          <Link href="/" className="inline-flex rounded-md">
            <Logo size="md" tone="inverted" />
          </Link>
          <div>
            <p className="font-mono text-xs font-semibold text-[var(--color-accent-3)]">
              {isSignup ? 'create your signal ledger' : 'welcome back to the signal'}
            </p>
            <h1 className="mt-4 max-w-lg text-5xl text-background">
              {isSignup ? 'Turn coding hours into a useful record.' : 'Pick up the thread from your last session.'}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-background/68">
              {isSignup
                ? 'Connect VS Code once, then let sessions, streaks, languages, and goals fill in automatically.'
                : 'Sign in to inspect live session time, recent activity, goals, and privacy controls from one calm dashboard.'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3" data-gsap-stagger>
            {proof.map(([value, label]) => (
              <div key={value} className="rounded-md border border-background/15 bg-background/8 p-3" data-gsap-item>
                <p className="text-sm font-semibold text-background">{value}</p>
                <p className="mt-1 text-[11px] text-background/58">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full max-w-md mx-auto" data-gsap="fade-up">
          <Link href="/" className="mb-7 flex items-center justify-center lg:hidden">
            <Logo size="xl" />
          </Link>
          <div className="signal-panel overflow-hidden">
            <div className="border-b border-border p-6 text-center">
              <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-md bg-foreground text-background">
                {isSignup ? <Radio className="size-5" /> : <Code2 className="size-5" />}
              </div>
              <h1 className="font-display text-3xl">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
            {[
              { icon: Shield, label: 'No code access' },
              { icon: CheckCircle2, label: 'Private by default' },
              { icon: Radio, label: 'Live heartbeat' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center justify-center gap-1 rounded-md border border-border bg-background/65 p-2">
                  <Icon className="size-3 text-primary" />
                  <span className="truncate">{item.label}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
