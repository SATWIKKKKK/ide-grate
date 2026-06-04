'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2, Download, Check, RefreshCw, Copy,
  ArrowRight, CheckCircle2, Loader2,
  Wifi
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const STEPS = [
  { num: 1, title: 'Install Extension', desc: 'Download & install the VSIX in VS Code' },
  { num: 2, title: 'Connect Account', desc: 'Generate API key & link your editor' },
  { num: 3, title: 'Verify Tracking', desc: 'Confirm live heartbeat tracking' },
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
      if (attempts >= 20) {
        setVerifyStartedAt(-1)
      }
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
      setConnecting(false)
    } catch {
      setError('Failed to generate key. Please try again.')
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="page-shell min-h-screen text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-7 lg:mb-8">
          <p className="text-sm font-semibold text-primary mb-2">Setup guide</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">Connect VS Code in 3 steps</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">Install the extension, add your API key, then verify that editor heartbeats are reaching your dashboard.</p>
        </motion.div>

        {/* Stepper + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-5 lg:gap-8">
          {/* Left: Vertical stepper */}
          <div className="app-surface rounded-xl p-4 lg:p-5">
          <div className="w-full flex lg:flex-col items-center lg:items-start justify-start gap-0 shrink-0 overflow-x-auto pb-2 lg:pb-0">
            {STEPS.map((s, i) => {
              const isCompleted = step > s.num
              const isActive = step === s.num
              return (
                <div key={s.num} className="flex lg:flex-col items-center">
                  <button
                    onClick={() => goToStep(s.num)}
                    className="flex items-center gap-3 group cursor-pointer"
                  >
                    <motion.div
                      animate={{
                        backgroundColor: isCompleted
                          ? 'var(--color-accent)'
                          : isActive
                          ? 'var(--color-accent)'
                          : 'var(--color-rule)',
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-shadow ${
                        isActive ? 'ring-4 ring-primary/30' : isCompleted ? 'ring-2 ring-primary/30' : ''
                      }`}
                    >
                      {isCompleted ? (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                          <Check className="w-5 h-5 text-primary-foreground" />
                        </motion.span>
                      ) : (
                        <span className={isActive ? 'text-primary-foreground' : 'text-muted-foreground'}>{s.num}</span>
                      )}
                    </motion.div>
                    <div className="hidden lg:block text-left">
                      <p className={`text-sm font-medium transition-colors ${
                        isActive ? 'text-foreground' : isCompleted ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      }`}>
                        {s.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="flex lg:ml-5 lg:my-0 my-0 mx-0">
                      <motion.div
                        animate={{ backgroundColor: step > s.num ? 'var(--color-accent)' : 'var(--color-rule)' }}
                        transition={{ duration: 0.4 }}
                        className="lg:hidden w-12 h-1 rounded-full"
                      />
                      <motion.div
                        animate={{ backgroundColor: step > s.num ? 'var(--color-accent)' : 'var(--color-rule)' }}
                        transition={{ duration: 0.4 }}
                        className="hidden lg:block w-1 h-16 rounded-full"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="hidden lg:block mt-5 pt-5 border-t border-border">
            <p className="text-sm font-semibold text-foreground">What gets tracked</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Session duration, language, platform, and anonymized project hash. Never source code.</p>
          </div>
          </div>

          {/* Right: Step content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* ─── STEP 1 ─── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="app-surface rounded-xl p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shrink-0">
                        <Download className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground">Install the Extension</h2>
                        <p className="text-sm text-muted-foreground">Download the VSIX and install it in VS Code</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">Step 1: Download the extension</p>
                      <button
                        onClick={downloadVSIX}
                        className="w-full py-3 bg-primary hover:bg-primary/90 rounded-xl text-primary-foreground font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download .vsix File
                      </button>
                      <p className="text-sm font-medium text-foreground mt-4">Step 2: Install in VS Code</p>
                      <div className="space-y-1.5">
                        {[
                          'Open VS Code → Extensions panel (Ctrl+Shift+X)',
                          'Click the ⋯ menu (three dots) at the top → "Install from VSIX..."',
                          'Select the downloaded .vsix file → click Install',
                          'You should see "VS Integrate" in your extensions list',
                        ].map((text, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-2 bg-secondary/50 rounded-lg">
                            <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-xs text-muted-foreground leading-relaxed">{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => goToStep(2)}
                      className="w-full mt-5 py-3.5 bg-primary hover:bg-primary/90 rounded-xl text-primary-foreground font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                      Continue to Connect
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ─── STEP 2 ─── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="app-surface rounded-xl p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shrink-0">
                        <Wifi className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground">Connect VS Code</h2>
                        <p className="text-sm text-muted-foreground">Make sure the extension is installed from Step 1 first</p>
                      </div>
                    </div>

                    {!apiKey ? (
                      <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl text-primary-foreground font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {connecting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating Key...
                          </>
                        ) : (
                          <>
                            <Code2 className="w-5 h-5" />
                            Generate API Key
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-secondary border border-border rounded-xl">
                          <p className="text-xs text-muted-foreground mb-2">Your API Key:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm text-primary font-mono break-all select-all min-w-0">{apiKey}</code>
                            <button
                              onClick={copyKey}
                              className="p-2 bg-secondary hover:bg-border rounded-lg transition-colors shrink-0"
                            >
                              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                            </button>
                          </div>
                        </div>
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
                          <p className="text-sm text-primary font-medium mb-2">Set the key in VS Code:</p>
                          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside overflow-wrap-anywhere">
                            <li>Open VS Code</li>
                            <li>Press <code className="px-1 bg-secondary rounded text-foreground">Ctrl+Shift+P</code> (or <code className="px-1 bg-secondary rounded text-foreground">Cmd+Shift+P</code> on Mac)</li>
                            <li>Type <code className="px-1 bg-secondary rounded text-foreground">VS Integrate: Set API Key</code></li>
                            <li>Paste your API key when prompted</li>
                            <li>When asked for the endpoint, enter: <code className="px-1 bg-secondary rounded text-primary break-all">https://vs-integrate.vercel.app/api/heartbeat</code></li>
                          </ol>
                          <button
                            onClick={openVSCode}
                            className="mt-3 px-3 py-2 bg-secondary hover:bg-border rounded-lg text-xs text-foreground transition-colors"
                          >
                            Open VS Code
                          </button>
                        </div>
                        <button
                          onClick={() => setStep(3)}
                          className="w-full py-3.5 bg-primary hover:bg-primary/90 rounded-xl text-primary-foreground font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <ArrowRight className="w-5 h-5" />
                          I&apos;ve set the API key — Verify Connection
                        </button>
                      </div>
                    )}

                    {error && <p className="text-sm text-destructive mt-3 text-center">{error}</p>}
                  </div>
                </motion.div>
              )}

              {/* ─── STEP 3 ─── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="app-surface rounded-xl p-5 sm:p-6">
                    {receivingData ? (
                      <div className="text-center py-4">
                        <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Tracking Active!</h2>
                        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                          Your coding activity is now being tracked live.
                        </p>
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors font-semibold"
                        >
                          Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : connected ? (
                      <div className="text-center py-4">
                        <Wifi className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Connected!</h2>
                        <p className="text-muted-foreground mb-2">VS Code is linked to your account.</p>
                        <p className="text-sm text-muted-foreground mb-6">
                          Open any file in VS Code and start coding. We&apos;ll detect your activity automatically.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-primary">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Waiting for coding activity...
                        </div>
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-2 px-8 py-3 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors font-semibold"
                        >
                          Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                          <Loader2 className={`w-8 h-8 text-primary ${verifyStartedAt === -1 ? '' : 'animate-spin'}`} />
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-foreground">
                          {verifyStartedAt === -1 ? 'Connection not detected yet' : 'Waiting for Connection...'}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-3">
                          Keep VS Code open with the extension enabled.
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          If the extension is not installed, go back to Step 1 and download the .vsix file. Then in VS Code: Extensions (Ctrl+Shift+X) → ⋯ → &quot;Install from VSIX...&quot;
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          <button
                            onClick={() => goToStep(2)}
                            className="w-full sm:w-auto px-4 py-2.5 bg-secondary hover:bg-border rounded-lg text-sm text-foreground transition-colors"
                          >
                            Back to Step 2
                          </button>
                          <button
                            onClick={openVSCode}
                            className="w-full sm:w-auto px-4 py-2.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-sm text-primary transition-colors"
                          >
                            Open VS Code
                          </button>
                          <button
                            onClick={() => {
                              setVerifyStartedAt(null)
                              setConnected(false)
                              setReceivingData(false)
                              setStep(2)
                              setTimeout(() => setStep(3), 0)
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 bg-secondary hover:bg-border rounded-lg text-sm text-foreground transition-colors"
                          >
                            <RefreshCw className="w-4 h-4 inline mr-2" />
                            Retry Check
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => { localStorage.setItem('onboarding_skipped', 'true'); window.location.href = '/dashboard' }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip to Dashboard →
          </button>
        </div>
      </main>
    </div>
  )
}
