'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  Loader2,
  RefreshCw,
  Shield,
  TerminalSquare,
  Wifi,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const STEPS = [
  { num: 1, title: 'Install extension', desc: 'Download and install the VSIX in VS Code', icon: Download },
  { num: 2, title: 'Connect account', desc: 'Generate an API key and link your editor', icon: KeyRound },
  { num: 3, title: 'Verify tracking', desc: 'Confirm live heartbeat tracking', icon: Wifi },
]

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [receivingData, setReceivingData] = useState(false)
  const [verifyStartedAt, setVerifyStartedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signup')
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetch('/api/apikey')
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.apiKey) setApiKey(data.apiKey) })
        .catch(() => {})
    }
  }, [session])

  useEffect(() => {
    if (step < 3) return
    const startedAt = Date.now()
    let attempts = 0
    const poll = async () => {
      try {
        const res = await fetch('/api/connection-status')
        if (res.ok) {
          const data = await res.json()
          if (data.connected) {
            const lastAt = data.lastActivityAt ? new Date(data.lastActivityAt).getTime() : 0
            if (lastAt > startedAt - 10000) {
              setConnected(true)
              if (data.hasActivity && data.totalSessions > 0) setReceivingData(true)
              return
            }
          }
        }
      } catch { /* ignore */ }
      attempts++
      if (attempts >= 20) setVerifyStartedAt(-1)
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [step])

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/apikey', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate API key')
      const data = await res.json()
      setApiKey(data.apiKey)
    } catch {
      setError('Failed to generate key. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  const downloadVSIX = () => {
    const a = document.createElement('a')
    a.href = '/downloads/extension.vsix'
    a.download = 'vs-integrate-extension.vsix'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const goToStep = (target: number) => {
    if (target !== 3) setVerifyStartedAt(null)
    setConnected(false)
    setReceivingData(false)
    setStep(target)
  }

  const openVSCode = () => {
    window.location.href = 'vscode://file'
  }

  const copyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (status === 'loading') {
    return <div className="page-shell flex min-h-screen items-center justify-center"><div className="size-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" /></div>
  }

  if (!session) return null

  return (
    <div className="page-shell min-h-screen text-foreground">
      <Navbar />

      <main className="signal-container py-8 sm:py-12">
        <header className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto]" data-gsap="fade-up">
          <div>
            <p className="signal-kicker">setup workbench</p>
            <h1 className="mt-3 text-4xl sm:text-6xl">Connect VS Code in three steps.</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Install the extension, attach your API key, then verify that live editor heartbeats reach your dashboard.
            </p>
          </div>
          <div className="signal-panel flex items-center gap-3 p-4">
            <Shield className="size-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Privacy boundary</p>
              <p className="text-xs text-muted-foreground">No code, file names, or keystrokes are collected.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="signal-panel p-4 lg:p-5" data-gsap="fade-up">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {STEPS.map((s) => {
                const Icon = s.icon
                const isCompleted = step > s.num
                const isActive = step === s.num
                return (
                  <button
                    key={s.num}
                    onClick={() => goToStep(s.num)}
                    className={`flex min-w-[14rem] items-center gap-3 rounded-md border p-3 text-left transition-all lg:min-w-0 ${
                      isActive
                        ? 'border-primary bg-accent text-foreground'
                        : isCompleted
                        ? 'border-primary/30 bg-background text-foreground'
                        : 'border-border bg-background/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${isActive || isCompleted ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'}`}>
                      {isCompleted ? <Check className="size-4" /> : <Icon className="size-4" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{s.title}</span>
                      <span className="block text-xs leading-relaxed">{s.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="mt-5 hidden border-t border-border pt-5 lg:block">
              <p className="text-sm font-semibold">Endpoint</p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">https://vs-integrate.vercel.app/api/heartbeat</p>
            </div>
          </aside>

          <section className="min-w-0" data-gsap="fade-up">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <StepCard key="install" icon={<Download className="size-5" />} title="Install the extension" subtitle="Download the VSIX and install it from VS Code.">
                  <button onClick={downloadVSIX} className="signal-button w-full">
                    <Download className="size-4" />
                    Download .vsix file
                  </button>
                  <InstructionList
                    items={[
                      'Open VS Code and go to the Extensions panel.',
                      'Open the more actions menu and choose Install from VSIX.',
                      'Select the downloaded .vsix file and install it.',
                      'Confirm VS Integrate appears in your extensions list.',
                    ]}
                  />
                  <button onClick={() => goToStep(2)} className="signal-button w-full">
                    Continue to connect
                    <ArrowRight className="size-4" />
                  </button>
                </StepCard>
              )}

              {step === 2 && (
                <StepCard key="connect" icon={<KeyRound className="size-5" />} title="Connect your editor" subtitle="Generate an API key and save it through the VS Code command palette.">
                  {!apiKey ? (
                    <button onClick={handleConnect} disabled={connecting} className="signal-button w-full">
                      {connecting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                      Generate API key
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border border-border bg-background/80 p-4">
                        <p className="mb-2 text-xs font-semibold text-muted-foreground">Your API key</p>
                        <div className="flex items-center gap-2">
                          <code className="min-w-0 flex-1 break-all font-mono text-sm text-primary">{apiKey}</code>
                          <button onClick={copyKey} className="rounded-md border border-border bg-secondary p-2 hover:border-primary" aria-label="Copy API key">
                            {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4 text-muted-foreground" />}
                          </button>
                        </div>
                      </div>
                      <InstructionList
                        items={[
                          'Open VS Code.',
                          'Press Ctrl+Shift+P or Cmd+Shift+P on Mac.',
                          'Run VS Integrate: Set API Key.',
                          'Paste your API key, then use the heartbeat endpoint when prompted.',
                        ]}
                      />
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button onClick={openVSCode} className="signal-button signal-button-secondary flex-1">
                          <TerminalSquare className="size-4" />
                          Open VS Code
                        </button>
                        <button onClick={() => goToStep(3)} className="signal-button flex-1">
                          Verify connection
                          <ArrowRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </StepCard>
              )}

              {step === 3 && (
                <StepCard key="verify" icon={<Wifi className="size-5" />} title="Verify live tracking" subtitle="Keep VS Code open while the dashboard checks for fresh heartbeats.">
                  {receivingData ? (
                    <ResultState icon={<CheckCircle2 className="size-12 text-primary" />} title="Tracking active" text="Your coding activity is now being tracked live.">
                      <Link href="/dashboard" className="signal-button">
                        Go to dashboard
                        <ArrowRight className="size-4" />
                      </Link>
                    </ResultState>
                  ) : connected ? (
                    <ResultState icon={<Wifi className="size-12 text-primary" />} title="Connected" text="VS Code is linked. Open any file and start coding while we wait for activity.">
                      <Link href="/dashboard" className="signal-button signal-button-secondary">
                        Open dashboard
                      </Link>
                    </ResultState>
                  ) : (
                    <ResultState
                      icon={<Loader2 className={`size-12 text-primary ${verifyStartedAt === -1 ? '' : 'animate-spin'}`} />}
                      title={verifyStartedAt === -1 ? 'Connection not detected yet' : 'Waiting for connection'}
                      text="If the extension is not installed, return to Step 1. If it is installed, retry after setting the API key."
                    >
                      <div className="flex flex-col justify-center gap-2 sm:flex-row">
                        <button onClick={() => goToStep(2)} className="signal-button signal-button-secondary">Back to Step 2</button>
                        <button onClick={openVSCode} className="signal-button signal-button-secondary">Open VS Code</button>
                        <button
                          onClick={() => {
                            setVerifyStartedAt(null)
                            setConnected(false)
                            setReceivingData(false)
                            setStep(2)
                            setTimeout(() => setStep(3), 0)
                          }}
                          className="signal-button"
                        >
                          <RefreshCw className="size-4" />
                          Retry
                        </button>
                      </div>
                    </ResultState>
                  )}
                </StepCard>
              )}
            </AnimatePresence>
          </section>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => { localStorage.setItem('onboarding_skipped', 'true'); window.location.href = '/dashboard' }}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Skip to dashboard
          </button>
        </div>
      </main>
    </div>
  )
}

function StepCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.24 }}
      className="signal-panel p-5 sm:p-7"
    >
      <div className="mb-6 flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-foreground text-background">{icon}</div>
        <div>
          <h2 className="font-sans text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </motion.div>
  )
}

function InstructionList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2" data-gsap-stagger>
      {items.map((text, index) => (
        <div key={text} className="flex items-start gap-3 rounded-md border border-border bg-background/65 p-3" data-gsap-item>
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent font-mono text-xs font-semibold text-foreground">{index + 1}</span>
          <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
        </div>
      ))}
    </div>
  )
}

function ResultState({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-lg border border-border bg-background">{icon}</div>
      <h3 className="font-display text-3xl">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{text}</p>
      <div className="mt-6 flex justify-center">{children}</div>
    </div>
  )
}

