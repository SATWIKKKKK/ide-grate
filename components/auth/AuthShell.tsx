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

  return (
    <div className="page-shell flex h-svh items-center justify-center overflow-hidden p-2 sm:p-3">
      <section className="mx-auto w-full max-w-[440px]" data-gsap="fade-up">
        <Link href="/" className="mb-2 flex items-center justify-center">
          <Logo size="md" />
        </Link>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-[var(--color-surface-bright)] p-4 text-center">
              <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                {isSignup ? <Radio className="size-4" /> : <Code2 className="size-4" />}
              </div>
              <h1 className="font-sans text-2xl font-semibold">{title}</h1>
              <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
          <div className={`${isSignup ? 'hidden' : 'mt-3 flex'} flex-wrap justify-center gap-2 text-[11px] text-muted-foreground`}>
            {[
              { icon: Shield, label: 'No code access' },
              { icon: CheckCircle2, label: 'Private by default' },
              { icon: Radio, label: 'Live heartbeat' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center justify-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 font-mono">
                  <Icon className="size-3 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
      </section>
    </div>
  )
}
