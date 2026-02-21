'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Code2,
  Key,
  Copy,
  RefreshCw,
  Check,
  User,
  Shield,
  Bell,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchApiKey()
    }
  }, [session])

  const fetchApiKey = async () => {
    try {
      const res = await fetch('/api/apikey')
      if (res.ok) {
        const data = await res.json()
        setApiKey(data.apiKey)
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error)
    }
  }

  const generateApiKey = async () => {
    setApiKeyLoading(true)
    try {
      const res = await fetch('/api/apikey', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setApiKey(data.apiKey)
      }
    } catch (error) {
      console.error('Failed to generate API key:', error)
    } finally {
      setApiKeyLoading(false)
    }
  }

  const revokeApiKey = async () => {
    setApiKeyLoading(true)
    try {
      const res = await fetch('/api/apikey', { method: 'DELETE' })
      if (res.ok) {
        setApiKey(null)
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error)
    } finally {
      setApiKeyLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const testApiKey = async () => {
    setTestStatus('testing')
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) {
        const data = await res.json()
        if (data.stats) {
          setTestStatus('success')
        } else {
          setTestStatus('error')
        }
      } else {
        setTestStatus('error')
      }
    } catch {
      setTestStatus('error')
    }
    // Reset after 3 seconds
    setTimeout(() => setTestStatus('idle'), 3000)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-400 mt-1">
            Manage your account and preferences
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Profile
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || ''}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
                    {session.user?.name?.[0] || session.user?.email?.[0] || '?'}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">{session.user?.name}</h3>
                  <p className="text-gray-400">{session.user?.email}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* API Key Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-500" />
                API Key
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Use this key to connect VS Code extension to your account
              </p>
            </div>
            <div className="p-6 space-y-4">
              {apiKey ? (
                <>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-gray-800 rounded-lg text-sm font-mono break-all border border-gray-700 text-gray-300">
                      {apiKey}
                    </code>
                    <button
                      onClick={copyApiKey}
                      className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={generateApiKey}
                      disabled={apiKeyLoading}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm text-gray-300"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Regenerate
                    </button>
                    <button
                      onClick={testApiKey}
                      disabled={testStatus === 'testing'}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
                      {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      {testStatus === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
                      {testStatus === 'idle' && 'Test Connection'}
                      {testStatus === 'testing' && 'Testing...'}
                      {testStatus === 'success' && 'Connected!'}
                      {testStatus === 'error' && 'No Activity'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Revoke
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 mb-4">No API key generated yet</p>
                  <button
                    onClick={generateApiKey}
                    disabled={apiKeyLoading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    {apiKeyLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Key className="w-5 h-5" />
                    )}
                    Generate API Key
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Theme Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sun className="w-5 h-5 text-blue-500" />
                Appearance
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3">
                {themes.map((t) => {
                  const Icon = t.icon
                  const isActive = false
                  return (
                    <button
                      key={t.id}
                      className={`p-4 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                        t.id === 'dark'
                          ? 'border-blue-500 bg-blue-600/10'
                          : 'border-gray-700 hover:border-gray-600 opacity-50 cursor-not-allowed'
                      }`}
                      disabled={t.id !== 'dark'}
                    >
                      <Icon className={`w-6 h-6 ${t.id === 'dark' ? 'text-blue-500' : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${t.id === 'dark' ? 'text-blue-500' : 'text-gray-500'}`}>
                        {t.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-blue-500" />
                Quick Links
              </h2>
            </div>
            <div className="divide-y divide-gray-800">
              <Link
                href="/onboarding"
                className="flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Code2 className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">VS Code Extension Setup</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </Link>
              <a
                href="https://github.com/SATWIKKKKK/ide-grate"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">View on GitHub</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </a>
            </div>
          </motion.div>

          {/* Privacy Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Privacy & Data
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Your privacy matters
                </h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• We only track time and language usage</li>
                  <li>• No code content is ever stored or transmitted</li>
                  <li>• File names are not stored (only file types)</li>
                  <li>• You can revoke access anytime</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Sign Out */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full p-4 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 rounded-xl text-red-400 font-medium transition-colors"
            >
              Sign Out
            </button>
          </motion.div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Revoke API Key?</h3>
              <p className="text-gray-400 text-center text-sm mb-6">
                This will disconnect your VS Code extension. You'll need to generate a new key and reconfigure the extension.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={revokeApiKey}
                  disabled={apiKeyLoading}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {apiKeyLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Revoke Key
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
