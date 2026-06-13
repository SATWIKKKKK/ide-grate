'use client';

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Code2,
  EyeOff,
  LayoutDashboard,
  Lock,
  Timer,
  Zap,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Logo from './Logo';
import ContributionGraph from './ContributionGraph';
import IdeIcon from './IdeIcon';
import { IDE_OPTIONS } from '@/lib/ide-config';

const featureCards = [
  { icon: Timer, title: 'Multi-IDE sessions', text: 'Track focused editor time from VS Code, Cursor, Antigravity, JetBrains, Zed, Neovim, and Sublime Text.' },
  { icon: BarChart3, title: 'Combined analytics', text: 'See one dashboard for the whole stack, then filter down to a single editor when you need detail.' },
  { icon: Zap, title: 'Setup path', text: 'Use the existing VSIX where it fits, native plugins where available, and a companion path for Zed.' },
  { icon: EyeOff, title: 'Privacy boundary', text: 'Cadence sends metadata only: time, language, platform, and anonymized project hash.' },
];

function LoggedInHero() {
  return (
    <section className="signal-container flex min-h-[calc(100vh-4rem)] items-center py-16">
      <div className="mx-auto max-w-2xl text-center" data-gsap="fade-up">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>
        <p className="signal-kicker justify-center">session active</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">Your signal is ready.</h1>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Open your dashboard, finish setup for your editors, or tune how your public profile shares your coding activity.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="signal-button">
            <LayoutDashboard className="size-4" />
            Dashboard
            <ArrowRight className="size-4" />
          </Link>
          <Link href="/dashboard/setup" className="signal-button signal-button-secondary">
            Setup guide
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Hero() {
  const { data: session } = useSession();

  if (session) return <LoggedInHero />;

  return (
    <div className="page-shell">
      <section className="signal-container grid min-h-[calc(100vh-4rem)] grid-cols-1 items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
        <header className="min-w-0" data-gsap="fade-up">
          <p className="signal-kicker">
            <Code2 className="size-4 text-[var(--color-live)]" />
            Cadence Feature Stack
          </p>
          <h1 className="mt-5 max-w-3xl text-[clamp(3.25rem,7.2vw,4.5rem)] leading-[0.96]">
            Track real coding activity across your editors.
          </h1>
          <p className="signal-copy mt-6 max-w-xl">
            Cadence turns editor heartbeats into sessions, focus time, streaks, language mix, and daily progress without reading your source code.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="signal-button px-6">
              Start tracking
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/dashboard/setup" className="signal-button signal-button-secondary px-6">
              See setup
            </Link>
          </div>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-2" data-gsap-stagger>
            {[
              ['7 IDEs', 'first-class targets'],
              ['No code', 'content collected'],
              ['Live', 'heartbeat status'],
            ].map(([value, label]) => (
              <div key={value} className="rounded-sm border border-border bg-card p-3" data-gsap-item>
                <p className="font-mono text-xs uppercase tracking-[0.05em] text-muted-foreground">{label}</p>
                <p className="mt-2 font-mono text-sm font-semibold text-[var(--color-live)]">{value}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="signal-panel min-w-0 p-6" data-gsap="fade-up" aria-label="Dashboard preview">
          <div className="mb-4 flex items-start justify-between border-b border-border pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">today&apos;s signal</p>
              <p className="font-mono text-xl font-bold text-foreground">editor heartbeats</p>
            </div>
            <div className="hidden max-w-52 flex-wrap justify-end gap-1.5 sm:flex">
              {IDE_OPTIONS.map((ide) => (
                <span key={ide.id} title={ide.shortName}>
                  <IdeIcon ide={ide.id} className="size-7" />
                </span>
              ))}
            </div>
          </div>
          <ContributionGraph />
        </section>
      </section>

      <section id="features" className="border-t border-border py-20">
        <div className="signal-container">
          <div className="mb-12 max-w-2xl" data-gsap="fade-up">
            <p className="signal-kicker">dashboard signals</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Built for people who work across more than one editor.</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-gsap-stagger>
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="app-card p-6" data-gsap-item>
                  <Icon className="mb-6 size-5 text-[var(--color-live)]" />
                  <h3 className="font-sans text-base font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="privacy" className="border-t border-border py-20">
        <div className="signal-container grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="app-card p-8" data-gsap="fade-up">
            <Lock className="mb-8 size-7 text-[var(--color-live)]" />
            <p className="signal-kicker">privacy boundary</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Analytics, not surveillance.</h2>
            <p className="mt-6 max-w-xl text-muted-foreground">
              Cadence tracks activity metadata only. It does not collect source code, file contents, keystrokes, file names, or repository paths.
            </p>
          </article>
          <article className="app-card p-8" data-gsap-stagger>
            <h3 className="text-3xl">Tracked signals</h3>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {['Session duration', 'Programming language', 'Platform', 'Anonymized project hash', 'Daily contribution totals', 'Goal progress'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground" data-gsap-item>
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--color-live)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="border-t border-border py-24 text-center">
        <div className="signal-container" data-gsap="fade-up">
          <p className="signal-kicker justify-center">ready when your editor stack is</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl sm:text-5xl">Let the dashboard tell the truth about your coding rhythm.</h2>
          <div className="mt-8 flex justify-center">
            <Link href="/signup" className="signal-button px-8">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-[var(--color-surface)] py-8">
        <div className="signal-container flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <Logo size="sm" />
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">Track real coding activity without exposing code.</p>
          </div>
          <nav className="flex flex-wrap gap-6 font-mono text-xs text-muted-foreground">
            <Link href="/signup" className="hover:text-foreground">Dashboard</Link>
            <Link href="/dashboard/setup" className="hover:text-foreground">Setup guide</Link>
            <Link href="/settings" className="hover:text-foreground">Settings</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
