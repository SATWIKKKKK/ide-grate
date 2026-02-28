'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2, Key, Download, Check, Copy, RefreshCw,
  ArrowRight, CheckCircle2, Loader2, ExternalLink,
  Wifi, WifiOff, Radio
} from 'lucide-react'
import Link from 'next/link'

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'receiving_data'>('disconnected')
  const [vsixDownloaded, setVsixDownloaded] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session?.user) fetchApiKey()
  }, [session])

  // Poll connection status every 3 seconds during onboarding
  useEffect(() => {
    if (!apiKey || connectionStatus === 'receiving_data') return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/connection-status')
        if (res.ok) {
          const data = await res.json()
          if (data.hasActivity && data.totalSessions > 0) {
            setConnectionStatus('receiving_data')
          } else if (data.connected) {
            setConnectionStatus('connected')
          } else if (data.hasApiKey) {
            // Has API key but no activity yet — extension might be connected but hasn't sent data
            setConnectionStatus(connectionStatus === 'disconnected' ? 'disconnected' : 'connecting')
          }
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [apiKey, connectionStatus])

  const fetchApiKey = async () => {
    try {
      const res = await fetch('/api/apikey')
      if (res.ok) {
        const data = await res.json()
        if (data.apiKey) {
          setApiKey(data.apiKey)
          setConnectionStatus('connected')
        }
      }
    } catch { /* ignore */ }
  }

  const generateApiKey = async () => {
    setApiKeyLoading(true)
    try {
      const res = await fetch('/api/apikey', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setApiKey(data.apiKey)
        setConnectionStatus('connected')
      }
    } catch { /* ignore */ }
    setApiKeyLoading(false)
  }

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openInVSCode = () => {
    if (!apiKey) return
    const endpoint = typeof window !== 'undefined'
      ? `${window.location.origin}/api/heartbeat`
      : 'http://localhost:3000/api/heartbeat'
    const deepLink = `vscode://vs-integrate-tracker/auth?key=${encodeURIComponent(apiKey)}&endpoint=${encodeURIComponent(endpoint)}`
    window.location.href = deepLink
  }

  const downloadVSIX = () => {
    setVsixDownloaded(true)
    // Use env var for direct VSIX download, fallback to GitHub releases page
    const vsixUrl = process.env.NEXT_PUBLIC_VSIX_URL || 'https://github.com/SATWIKKKKK/ide-grate/releases/latest'
    window.open(vsixUrl, '_blank')
  }

  const testConnection = async () => {
    setConnectionStatus('connecting')
    try {
      const res = await fetch('/api/connection-status')
      if (res.ok) {
        const data = await res.json()
        if (data.hasActivity && data.totalSessions > 0) {
          setConnectionStatus('receiving_data')
        } else if (data.connected) {
          setConnectionStatus('connected')
        } else {
          setConnectionStatus('disconnected')
        }
      }
    } catch {
      setConnectionStatus('disconnected')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const isStep1Done = !!apiKey
  const isStep2Done = connectionStatus === 'connected' || connectionStatus === 'receiving_data'
  const isStep3Done = connectionStatus === 'receiving_data'
  const completedSteps = [isStep1Done, isStep2Done, isStep3Done].filter(Boolean).length

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-gray-800 shrink-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">vs-integrate</span>
          </Link>
          <Link href="/dashboard" className="text-xs text-gray-500 hover:text-white transition-colors">
            Skip to Dashboard →
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">
            Get started in 3 simple steps
          </h1>
          <p className="text-gray-400">
            Connect your VS Code in under a minute
          </p>
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  (i === 1 && isStep1Done) || (i === 2 && isStep2Done) || (i === 3 && isStep3Done)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {((i === 1 && isStep1Done) || (i === 2 && isStep2Done) || (i === 3 && isStep3Done))
                    ? <Check className="w-4 h-4" />
                    : i
                  }
                </div>
                {i < 3 && <div className={`w-12 h-1 rounded ${completedSteps >= i ? 'bg-green-600' : 'bg-gray-800'}`} />}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-4">
          {/* Step 1: Get Extension + API Key */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${isStep1Done ? 'border-green-600/30' : 'border-gray-800'}`}
          >
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isStep1Done ? 'bg-green-600' : 'bg-blue-600'}`}>
                  {isStep1Done ? <Check className="w-5 h-5 text-white" /> : <Download className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Step 1: Download & Generate Key</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Get the extension and your personal API key</p>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={downloadVSIX}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3 text-sm"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Download VS Integrate Extension (.vsix)</span>
                  {vsixDownloaded && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />}
                </button>
                <p className="text-xs text-gray-500 ml-1">
                  Then: Extensions panel → ··· → Install from VSIX
                </p>
                {apiKey ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2.5 bg-gray-800 rounded-lg text-xs font-mono break-all border border-gray-700 text-gray-300">
                        {apiKey}
                      </code>
                      <button onClick={copyApiKey} className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700" title="Copy">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> API key ready
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={generateApiKey}
                    disabled={apiKeyLoading}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {apiKeyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    Generate API Key
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Step 2: Connect to VS Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${isStep2Done ? 'border-green-600/30' : 'border-gray-800'} ${!isStep1Done ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isStep2Done ? 'bg-green-600' : 'bg-blue-600'}`}>
                  {isStep2Done ? <Check className="w-5 h-5 text-white" /> : <Code2 className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Step 2: Connect to Your Account</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Auto-configure your API key in VS Code</p>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={openInVSCode}
                  disabled={!apiKey}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open VS Code & Auto-Connect
                </button>
                <p className="text-xs text-gray-500 text-center">
                  This will open VS Code and automatically configure your API key
                </p>
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-300 transition-colors">
                    Manual setup (if auto-connect doesn't work)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-800 rounded-lg space-y-2 text-gray-400">
                    <p>1. Open VS Code Command Palette: <code className="px-1 bg-gray-700 rounded text-white">Ctrl+Shift+P</code></p>
                    <p>2. Type: <code className="px-1 bg-gray-700 rounded text-white">VS Integrate: Set API Key</code></p>
                    <p>3. Paste your API key when prompted</p>
                  </div>
                </details>
              </div>
            </div>
          </motion.div>

          {/* Step 3: Start Coding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${isStep3Done ? 'border-green-600/30' : 'border-gray-800'} ${!isStep1Done ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isStep3Done ? 'bg-green-600' : 'bg-blue-600'}`}>
                  {isStep3Done ? <Check className="w-5 h-5 text-white" /> : <Radio className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Step 3: Start Coding</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Open any file in VS Code and code for 30 seconds</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg flex items-center gap-3 ${
                  connectionStatus === 'receiving_data'
                    ? 'bg-green-900/20 border border-green-600/30'
                    : connectionStatus === 'connecting'
                    ? 'bg-blue-900/20 border border-blue-600/30'
                    : 'bg-gray-800 border border-gray-700'
                }`}>
                  {connectionStatus === 'receiving_data' ? (
                    <>
                      <Wifi className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-green-400">Receiving data!</p>
                        <p className="text-xs text-green-400/60">Your coding activity is being tracked</p>
                      </div>
                    </>
                  ) : connectionStatus === 'connecting' ? (
                    <>
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      <div>
                        <p className="text-sm font-medium text-blue-400">Checking connection...</p>
                        <p className="text-xs text-blue-400/60">Looking for activity data</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-400">Waiting for activity...</p>
                        <p className="text-xs text-gray-500">Start coding in VS Code to see data here</p>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={testConnection}
                  disabled={connectionStatus === 'connecting'}
                  className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm text-gray-300"
                >
                  <RefreshCw className={`w-4 h-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Success State */}
        <AnimatePresence>
          {isStep3Done && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center"
            >
              <div className="p-6 bg-green-900/20 border border-green-600/30 rounded-xl">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-1">You&apos;re all set!</h3>
                <p className="text-sm text-gray-400 mb-4">Your coding activity is being tracked. Head to your dashboard to see it.</p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isStep3Done && (
          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition-colors">
              Skip to Dashboard →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
