'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2, Download, Check, RefreshCw,
  ArrowRight, CheckCircle2, Loader2,
  Wifi
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [receivingData, setReceivingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // Check if user already has an API key on load
  useEffect(() => {
    if (session?.user) {
      fetch('/api/apikey')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.apiKey) setApiKey(data.apiKey)
        })
        .catch(() => {})
    }
  }, [session])

  // Poll connection status when on step 3
  useEffect(() => {
    if (step < 3) return

    const poll = async () => {
      try {
        const res = await fetch('/api/connection-status')
        if (res.ok) {
          const data = await res.json()
          if (data.connected) {
            setConnected(true)
            if (data.hasActivity && data.totalSessions > 0) {
              setReceivingData(true)
            }
          }
        }
      } catch { /* ignore polling errors */ }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [step])

  // Auto-redirect to dashboard when receiving data
  useEffect(() => {
    if (receivingData) {
      const timeout = setTimeout(() => router.push('/dashboard'), 2500)
      return () => clearTimeout(timeout)
    }
  }, [receivingData, router])

  // Step 2: Generate API key (if needed) + open deep link — one click
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

      // Move to verification step after a brief delay
      setTimeout(() => {
        setStep(3)
        setConnecting(false)
      }, 1500)
    } catch {
      setError('Failed to connect. Please try again.')
      setConnecting(false)
    }
  }

  // Step 1: Download the VSIX file
  const downloadVSIX = () => {
    const a = document.createElement('a')
    a.href = '/downloads/extension.vsix'
    a.download = 'vs-integrate-extension.vsix'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
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
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="vs-integrate"
              width={300}
              height={300}
              className="h-14 w-auto object-contain -my-2"
              priority
            />
          </Link>
          <button
            onClick={() => { localStorage.setItem('onboarding_skipped', 'true'); window.location.href = '/dashboard' }}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Skip →
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        {/* Header + Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Setup in 3 clicks</h1>
          <p className="text-gray-400">Install → Connect → Code</p>

          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > i
                    ? 'bg-green-600 text-white'
                    : step === i
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400/50'
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {step > i ? <Check className="w-4 h-4" /> : i}
                </div>
                {i < 3 && (
                  <div className={`w-14 h-1 rounded-full ${step > i ? 'bg-green-600' : 'bg-gray-800'}`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ─── STEP 1: Install Extension ─── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Install the Extension</h2>
                    <p className="text-sm text-gray-400">Download and install in VS Code</p>
                  </div>
                </div>

                {/* Download button */}
                <button
                  onClick={downloadVSIX}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Extension
                </button>

                {/* Install instructions */}
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-medium text-gray-300">After downloading:</p>
                  <div className="space-y-2">
                    {[
                      'Open VS Code',
                      'Go to Extensions panel (Ctrl+Shift+X)',
                      'Click ··· menu → "Install from VSIX..."',
                      'Select the downloaded file',
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-800/50 rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-300">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm installed */}
                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-5 py-3.5 bg-green-600 hover:bg-green-500 rounded-xl text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  I&apos;ve Installed the Extension
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: Connect VS Code ─── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Connect VS Code</h2>
                    <p className="text-sm text-gray-400">One click to link your account</p>
                  </div>
                </div>

                {/* Single connect button */}
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

                {error && (
                  <p className="text-sm text-red-400 mt-3 text-center">{error}</p>
                )}

                <p className="text-xs text-gray-500 mt-4 text-center">
                  This generates your API key and opens VS Code to auto-configure it.
                  <br />Make sure VS Code is open and the extension is installed.
                </p>

                {/* Manual fallback */}
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

                <button
                  onClick={() => setStep(1)}
                  className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ← Back to Step 1
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: Verify Connection ─── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                {receivingData ? (
                  /* ── All done ── */
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">You&apos;re All Set!</h2>
                    <p className="text-gray-400 mb-6">
                      Your coding activity is being tracked. Redirecting to dashboard...
                    </p>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-semibold"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : connected ? (
                  /* ── Connected but no activity data yet ── */
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
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  /* ── Waiting for connection ── */
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Waiting for Connection...</h2>
                    <p className="text-sm text-gray-400 mb-4">
                      Make sure VS Code is open. The extension should connect automatically.
                    </p>
                    <button
                      onClick={handleConnect}
                      className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-2" />
                      Try Again
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      className="block mx-auto mt-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      ← Back
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
