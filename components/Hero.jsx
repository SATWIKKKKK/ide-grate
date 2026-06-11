'use client';

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Code2,
  Download,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  Lock,
  Radio,
  TerminalSquare,
  Timer,
  Zap,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Logo from './Logo';
import ContributionGraph from './ContributionGraph';

const featureCards = [
  { icon: Timer, title: 'Session ledger', text: 'Track focused editor time, live sessions, pauses, and daily totals without manual logging.' },
  { icon: BarChart3, title: 'Coding signal', text: 'See activity heatmaps, language mix, project distribution, and weekly rhythm from real heartbeats.' },
  { icon: Zap, title: 'Goals and momentum', text: 'Set daily or weekly goals, watch progress fill in, and keep streaks tied to actual work.' },
  { icon: EyeOff, title: 'Private telemetry', text: 'The extension sends metadata only: time, language, platform, and anonymized project hash.' },
];

const setupSteps = [
  { icon: Download, title: 'Install', text: 'Download the VSIX and install it from the VS Code Extensions menu.' },
  { icon: KeyRound, title: 'Connect', text: 'Generate your account API key and paste it into the command palette action.' },
  { icon: Radio, title: 'Verify', text: 'Open the dashboard and confirm live heartbeats, sessions, and daily totals.' },
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
          Open your dashboard, finish the extension setup, or tune how your public profile shares your coding activity.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="signal-button">
            <LayoutDashboard className="size-4" />
            Dashboard
            <ArrowRight className="size-4" />
          </Link>
          <Link href="/onboarding" className="signal-button signal-button-secondary">
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
    <div className="page-shell selection:bg-accent/40">
      <section className="signal-container grid min-h-[calc(100vh-4rem)] grid-cols-1 items-center gap-8 py-10 lg:grid-cols-[0.88fr_1.12fr] lg:py-14">
        <header className="min-w-0" data-gsap="fade-up">
          <p className="signal-kicker">
            <Code2 className="size-4 text-primary" />
            VS Code activity, not commit theatre
          </p>
          <h1 className="mt-5 max-w-3xl text-[clamp(3rem,8vw,6.9rem)] leading-[0.88]">
            Track real coding activity.
          </h1>
          <p className="signal-copy mt-6 max-w-xl">
            vs-integrate turns editor heartbeats into sessions, focus time, streaks, language mix, and daily progress without reading your source code.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="signal-button">
              Start tracking
              <ArrowRight className="size-4" />
            </Link>
            <Link href="#how-it-works" className="signal-button signal-button-secondary">
              See setup
            </Link>
          </div>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-2" data-gsap-stagger>
            {[
              ['No code', 'content collected'],
              ['VSIX', 'install flow'],
              ['Live', 'heartbeat status'],
            ].map(([value, label]) => (
              <div key={value} className="muted-panel p-3" data-gsap-item>
                <p className="font-mono text-sm font-semibold text-primary">{value}</p>
                <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="signal-panel relative min-w-0 overflow-hidden p-3 sm:p-4" data-gsap="fade-up" aria-label="Dashboard preview">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2),var(--color-accent-3))]" />
          <div className="grid gap-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">today's signal</p>
                <p className="font-mono text-2xl font-semibold text-foreground">editor heartbeats</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-accent px-2.5 py-1 text-xs font-semibold text-foreground">
                <span className="size-2 rounded-full bg-primary" />
                live-ready
              </span>
            </div>
            <ContributionGraph />
          </div>
        </section>
      </section>

      <section id="features" className="border-t border-border bg-background/65 py-16 sm:py-20">
        <div className="signal-container">
          <div className="mb-8 max-w-2xl" data-gsap="fade-up">
            <p className="signal-kicker">dashboard signals</p>
            <h2 className="mt-3 text-3xl sm:text-5xl">Built for people who actually work in the editor.</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" data-gsap-stagger>
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="app-card p-5" data-gsap-item>
                  <Icon className="mb-6 size-5 text-primary" />
                  <h3 className="font-sans text-base font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border py-16 sm:py-20">
        <div className="signal-container grid grid-cols-1 gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div data-gsap="fade-up">
            <p className="signal-kicker">setup flow</p>
            <h2 className="mt-3 text-3xl sm:text-5xl">Set up once. Code normally.</h2>
            <p className="mt-5 text-muted-foreground">
              The onboarding flow downloads the extension, generates your API key, and verifies that heartbeats are arriving.
            </p>
            <Link href="/signup" className="signal-button mt-7">
              Create account
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" data-gsap-stagger>
            {setupSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="app-card p-5" data-gsap-item>
                  <span className="mb-5 inline-flex size-8 items-center justify-center rounded-md bg-foreground font-mono text-sm font-semibold text-background">
                    {index + 1}
                  </span>
                  <Icon className="mb-4 size-5 text-primary" />
                  <h3 className="font-sans font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="privacy" className="border-t border-border bg-background/70 py-16 sm:py-20">
        <div className="signal-container grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="signal-panel p-6 sm:p-8" data-gsap="fade-up">
            <Lock className="mb-6 size-6 text-primary" />
            <p className="signal-kicker">privacy boundary</p>
            <h2 className="mt-3 text-3xl sm:text-5xl">Analytics, not surveillance.</h2>
            <p className="mt-5 text-muted-foreground">
              vs-integrate tracks activity metadata only. It does not collect source code, file contents, keystrokes, file names, or repository paths.
            </p>
          </article>
          <article className="signal-panel p-6 sm:p-8" data-gsap-stagger>
            <h3 className="font-sans text-lg font-semibold">Tracked signals</h3>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {['Session duration', 'Programming language', 'Platform', 'Anonymized project hash', 'Daily contribution totals', 'Goal progress'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground" data-gsap-item>
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <div className="signal-container text-center" data-gsap="fade-up">
          <p className="signal-kicker justify-center">ready when your editor is</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl sm:text-5xl">Let the dashboard tell the truth about your coding rhythm.</h2>
          <div className="mt-8 flex justify-center">
            <Link href="/signup" className="signal-button">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-8">
        <div className="signal-container flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <Logo size="sm" />
            <p className="mt-2 text-sm text-muted-foreground">Track real coding activity without exposing code.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-muted-foreground">
            <Link href="/signup" className="hover:text-foreground">Dashboard</Link>
            <Link href="/signup" className="hover:text-foreground">Setup guide</Link>
            <Link href="/signup" className="hover:text-foreground">Settings</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

