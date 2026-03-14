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
import Logo from '@/components/Logo'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
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
    const poll = async () => {
      try {
        const res = await fetch('/api/connection-status')
        if (res.ok) {
          const data = await res.json()
          if (data.connected) {
            setConnected(true)
            if (data.hasActivity && data.totalSessions > 0) setReceivingData(true)
          }
        }
      } catch { /* ignore */ }
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [step])

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      let key = apiKey
      if (!key) {
        const res = await fetch('/api/apikey', { method: 'POST' })
        if (!res.ok) throw new Error('Failed to generate API key')
        const data = await res.json()
        key = data.apiKey
        setApiKey(key)
      }
      const endpoint = `${window.location.origin}/api/heartbeat`
      const deepLink = `vscode://vsintegrate.vs-integrate-tracker/auth?key=${encodeURIComponent(key!)}&endpoint=${encodeURIComponent(endpoint)}`
      window.location.href = deepLink
      setTimeout(() => { setStep(3); setConnecting(false) }, 1500)
    } catch {
      setError('Failed to connect. Please try again.')
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
    setStep(target)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-gray-800 shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => { localStorage.setItem('onboarding_skipped', 'true'); window.location.href = '/dashboard' }}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Skip →
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Connect VS Code in 3 Steps</h1>
          <p className="text-gray-400 text-sm sm:text-base">Install → Connect → Verify</p>
        </motion.div>

        {/* Stepper (left) + Content (right) layout */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Left: Vertical stepper */}
          <div className="flex md:flex-col items-center md:items-start gap-0 md:pt-2 shrink-0">
            {STEPS.map((s, i) => {
              const isCompleted = step > s.num
              const isActive = step === s.num
              return (
                <div key={s.num} className="flex md:flex-col items-center">
                  {/* Step circle + label */}
                  <button
                    onClick={() => goToStep(s.num)}
                    className="flex items-center gap-3 group cursor-pointer"
                  >
                    <motion.div
                      animate={{
                        backgroundColor: isCompleted ? '#16a34a' : isActive ? '#2563eb' : '#1f2937',
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-shadow ${
                        isActive ? 'ring-4 ring-blue-500/30' : isCompleted ? 'ring-2 ring-green-500/30' : ''
                      }`}
                    >
                      {isCompleted ? (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                          <Check className="w-5 h-5 text-white" />
                        </motion.span>
                      ) : (
                        <span className={isActive ? 'text-white' : 'text-gray-500'}>{s.num}</span>
                      )}
                    </motion.div>
                    <div className="hidden md:block text-left">
                      <p className={`text-sm font-medium transition-colors ${
                        isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-500 group-hover:text-gray-300'
                      }`}>
                        {s.title}
                      </p>
                      <p className="text-xs text-gray-600">{s.desc}</p>
                    </div>
                  </button>
                  {/* Connector bar */}
                  {i < STEPS.length - 1 && (
                    <div className="flex md:ml-5 md:my-0 my-0 mx-0">
                      {/* Horizontal bar (mobile) */}
                      <motion.div
                        animate={{ backgroundColor: step > s.num ? '#16a34a' : '#1f2937' }}
                        transition={{ duration: 0.4 }}
                        className="md:hidden w-12 h-1 rounded-full"
                      />
                      {/* Vertical bar (desktop) */}
                      <motion.div
                        animate={{ backgroundColor: step > s.num ? '#16a34a' : '#1f2937' }}
                        transition={{ duration: 0.4 }}
                        className="hidden md:block w-1 h-16 rounded-full"
                      />
                    </div>
                  )}
                </div>
              )
            })}
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
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Install the Extension</h2>
                        <p className="text-sm text-gray-400">Download the VSIX and install it in VS Code</p>
                      </div>
                    </div>

                    {/* CLI Install */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-300">Option 1: One-liner install (recommended)</p>
                      <div className="space-y-2">
                        <div className="relative">
                          <p className="text-[11px] text-gray-500 mb-1">macOS / Linux:</p>
                          <pre className="bg-gray-800 border border-gray-700 rounded-lg p-3 pr-10 overflow-x-auto text-xs">
                            <code className="text-emerald-300">{`curl -fsSL ${typeof window !== 'undefined' ? window.location.origin : ''}/api/download/vsix -o vs-integrate.vsix && code --install-extension vs-integrate.vsix && rm vs-integrate.vsix`}</code>
                          </pre>
                          <button
                            onClick={() => navigator.clipboard.writeText(`curl -fsSL ${window.location.origin}/api/download/vsix -o vs-integrate.vsix && code --install-extension vs-integrate.vsix && rm vs-integrate.vsix`)}
                            className="absolute top-6 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                        <div className="relative">
                          <p className="text-[11px] text-gray-500 mb-1">Windows PowerShell:</p>
                          <pre className="bg-gray-800 border border-gray-700 rounded-lg p-3 pr-10 overflow-x-auto text-xs">
                            <code className="text-emerald-300">{`Invoke-WebRequest -Uri "${typeof window !== 'undefined' ? window.location.origin : ''}/api/download/vsix" -OutFile "vs-integrate.vsix"; code --install-extension vs-integrate.vsix; Remove-Item vs-integrate.vsix`}</code>
                          </pre>
                          <button
                            onClick={() => navigator.clipboard.writeText(`Invoke-WebRequest -Uri "${window.location.origin}/api/download/vsix" -OutFile "vs-integrate.vsix"; code --install-extension vs-integrate.vsix; Remove-Item vs-integrate.vsix`)}
                            className="absolute top-6 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-center my-4">
                      <div className="flex-1 border-t border-gray-700" />
                      <span className="px-3 text-xs text-gray-500">or</span>
                      <div className="flex-1 border-t border-gray-700" />
                    </div>

                    {/* Manual download */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-300">Option 2: Download manually</p>
                      <button
                        onClick={downloadVSIX}
                        className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download .vsix File
                      </button>
                      <div className="space-y-1.5">
                        {[
                          'Open VS Code → Extensions panel (Ctrl+Shift+X)',
                          'Click the ⋯ menu → "Install from VSIX..."',
                          'Select the downloaded file',
                        ].map((text, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-2 bg-gray-800/50 rounded-lg">
                            <span className="w-5 h-5 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-xs text-gray-400">{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => goToStep(2)}
                      className="w-full mt-5 py-3.5 bg-green-600 hover:bg-green-500 rounded-xl text-white font-semibold transition-colors flex items-center justify-center gap-2"
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
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Connect VS Code</h2>
                        <p className="text-sm text-gray-400">Generate key & open deep-link automatically</p>
                      </div>
                    </div>

                    <button
                      onClick={handleConnect}
                      disabled={connecting}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded-xl text-white font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Opening VS Code...
                        </>
                      ) : (
                        <>
                          <Code2 className="w-5 h-5" />
                          Connect VS Code
                        </>
                      )}
                    </button>

                    {error && <p className="text-sm text-red-400 mt-3 text-center">{error}</p>}

                    <p className="text-xs text-gray-500 mt-4 text-center">
                      This generates your account API key and opens VS Code to auto-configure tracking.
                      <br />Make sure VS Code is open and the extension is installed.
                    </p>

                    <details className="mt-4 text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-300 transition-colors">
                        Manual setup (if auto-connect doesn&apos;t work)
                      </summary>
                      <div className="mt-2 p-3 bg-gray-800 rounded-lg space-y-2 text-gray-400">
                        <p>1. Open VS Code Command Palette: <code className="px-1 bg-gray-700 rounded text-white">Ctrl+Shift+P</code></p>
                        <p>2. Type: <code className="px-1 bg-gray-700 rounded text-white">VS Integrate: Set API Key</code></p>
                        <p>3. Paste your API key when prompted</p>
                        {apiKey && (
                          <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
                            <p className="text-xs text-gray-500 mb-1">Your API Key:</p>
                            <code className="text-xs text-gray-300 break-all">{apiKey}</code>
                          </div>
                        )}
                      </div>
                    </details>
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
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    {receivingData ? (
                      <div className="text-center py-4">
                        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Tracking Active!</h2>
                        <p className="text-gray-400 mb-6 text-sm sm:text-base">
                          Your coding activity is now being tracked live.
                        </p>
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-semibold"
                        >
                          Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : connected ? (
                      <div className="text-center py-4">
                        <Wifi className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Connected!</h2>
                        <p className="text-gray-400 mb-2">VS Code is linked to your account.</p>
                        <p className="text-sm text-gray-500 mb-6">
                          Open any file in VS Code and start coding. We&apos;ll detect your activity automatically.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Waiting for coding activity...
                        </div>
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-2 px-8 py-3 mt-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-semibold"
                        >
                          Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Waiting for Connection...</h2>
                        <p className="text-sm text-gray-400 mb-4">
                          Keep VS Code open with the extension enabled.
                        </p>
                        <button
                          onClick={handleConnect}
                          className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 inline mr-2" />
                          Try Again
                        </button>
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
            className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
          >
            Skip to Dashboard →
          </button>
        </div>
      </main>
    </div>
  )
}
