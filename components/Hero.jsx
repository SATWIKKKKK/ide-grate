'use client';

import {
  ArrowRight,
  BarChart3,
  EyeOff,
  LayoutDashboard,
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
  { icon: Zap, title: 'One API key', text: 'Use one Cadence key across the VS Code-family package, native plugins, and the Zed companion path.' },
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
      <section className="signal-container grid min-h-[calc(100vh-4rem)] grid-cols-1 items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-20">
        <header className="min-w-0" data-gsap="fade-up">
          <h1 className="font-display max-w-3xl text-4xl font-normal leading-[1.04] sm:text-5xl lg:text-5xl">
            Track real coding activity across your editors.
          </h1>
          <p className="signal-copy mt-6 max-w-xl">
            Cadence turns editor activity into sessions, focus time, streaks, language mix, and daily progress without reading your source code.
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
          <div className="mt-8 flex max-w-full flex-wrap items-center gap-2" aria-label="Supported editors">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">works with -</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {IDE_OPTIONS.map((ide) => (
                <span key={ide.id} className="group relative inline-flex" title={ide.shortName} aria-label={ide.shortName}>
                  <span className="flex size-8 items-center justify-center transition-transform hover:scale-110">
                    <IdeIcon ide={ide.id} bare className="size-6" />
                  </span>
                  <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 font-mono text-[10px] text-popover-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {ide.shortName}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </header>

        <section className="signal-panel min-w-0 p-6" data-gsap="fade-up" aria-label="Dashboard preview">
          <div className="mb-4 border-b border-border pb-4">
            <p className="font-mono text-sm font-semibold uppercase tracking-[0.12em] text-foreground">YOUR CODE. YOUR CONTRIBUTIONS.</p>
          </div>
          <ContributionGraph />
        </section>
      </section>

      <section id="features" className="border-t border-border py-20">
        <div className="signal-container">
          <div className="mb-12 max-w-2xl" data-gsap="fade-up">
            <p className="signal-kicker">FEATURES</p>
            <h2 className="mt-3 font-display text-3xl font-normal sm:text-4xl">Built for people who work across more than one editor.</h2>
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

      <section id="how-it-works" className="border-t border-border py-20">
        <div className="signal-container">
          <div className="mb-12 max-w-2xl" data-gsap="fade-up">
            <p className="signal-kicker">how it works</p>
            <h2 className="mt-3 font-display text-3xl font-normal sm:text-4xl">From editor event to dashboard signal.</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" data-gsap-stagger>
            {[
              ['01', 'Choose your editor', 'Pick VS Code, Cursor, Antigravity, JetBrains, Zed, Neovim, or Sublime from setup. Cadence keeps that selection on refresh.'],
              ['02', 'Install the matching integration', 'Use the VS Code-family package, the JetBrains/Sublime/Neovim plugin path, or the Zed companion process shown for that editor.'],
              ['03', 'Add your Cadence key', 'Generate one key, paste it into the editor integration, and keep the heartbeat endpoint pointed at your Cadence site.'],
              ['04', 'Run the connection test', 'Each setup path includes the exact test command or menu action. The dashboard waits for a real heartbeat before showing connected.'],
              ['05', 'Code normally', 'Cadence receives time, language, platform, and anonymous project metadata. It does not read file contents or source paths.'],
              ['06', 'Review your limits', 'Your dashboard rolls those heartbeats into today total, contribution density, language mix, streaks, goals, and per-IDE activity.'],
            ].map(([step, title, text]) => (
              <article key={step} className="app-card p-6" data-gsap-item>
                <p className="font-mono text-xs font-semibold text-[var(--color-live)]">{step}</p>
                <h3 className="mt-5 font-sans text-base font-semibold leading-snug">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-24 text-center">
        <div className="signal-container" data-gsap="fade-up">
          <h2 className="mx-auto max-w-3xl font-display text-3xl font-normal sm:text-5xl">Let the dashboard tell the truth about your coding rhythm.</h2>
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
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
