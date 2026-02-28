'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code2, Key, Copy, RefreshCw, Check, User, Shield, Bell, Trash2,
  ExternalLink, AlertTriangle, Sun, Moon, Monitor, ChevronRight,
  CheckCircle2, XCircle, Loader2, Eye, EyeOff, Globe, Download
} from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface UserSettings {
  username: string | null
  bio: string | null
  profilePublic: boolean
  showHours: boolean
  showLanguages: boolean
  showStreak: boolean
  showHeatmap: boolean
  showProjects: boolean
  dailyDigest: boolean
  streakReminder: boolean
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDataDeleteConfirm, setShowDataDeleteConfirm] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [settings, setSettings] = useState<UserSettings>({
    username: null, bio: null, profilePublic: false,
    showHours: true, showLanguages: true, showStreak: true,
    showHeatmap: true, showProjects: false,
    dailyDigest: false, streakReminder: false,
  })
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteDataLoading, setDeleteDataLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchApiKey()
      fetchSettings()
    }
  }, [session])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setUsername(data.username || '')
        setBio(data.bio || '')
      }
    } catch { /* ignore */ }
    setSettingsLoading(false)
  }

  const saveSettings = async (updates: Partial<UserSettings>) => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data.user)
        setSaveMessage('Saved!')
      } else {
        const err = await res.json()
        setSaveMessage(err.error || 'Failed to save')
      }
    } catch {
      setSaveMessage('Failed to save')
    }
    setSaving(false)
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const toggleSetting = async (key: keyof UserSettings) => {
    const newVal = !settings[key]
    setSettings(prev => ({ ...prev, [key]: newVal }))
    await saveSettings({ [key]: newVal })
  }

  const fetchApiKey = async () => {
    try {
      const res = await fetch('/api/apikey')
      if (res.ok) {
        const data = await res.json()
        setApiKey(data.apiKey)
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
      }
    } catch { /* ignore */ }
    setApiKeyLoading(false)
  }

  const revokeApiKey = async () => {
    setApiKeyLoading(true)
    try {
      const res = await fetch('/api/apikey', { method: 'DELETE' })
      if (res.ok) setApiKey(null)
    } catch { /* ignore */ }
    setApiKeyLoading(false)
    setShowDeleteConfirm(false)
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
        setTestStatus(data.stats ? 'success' : 'error')
      } else setTestStatus('error')
    } catch { setTestStatus('error') }
    setTimeout(() => setTestStatus('idle'), 3000)
  }

  const exportData = async () => {
    setExportLoading(true)
    try {
      const res = await fetch('/api/privacy/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'vs-integrate-data.json'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch { /* ignore */ }
    setExportLoading(false)
  }

  const deleteData = async () => {
    setDeleteDataLoading(true)
    try {
      await fetch('/api/privacy/export', { method: 'DELETE' })
      setShowDataDeleteConfirm(false)
    } catch { /* ignore */ }
    setDeleteDataLoading(false)
  }

  if (status === 'loading' || settingsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account and preferences</p>
          </div>
          {saveMessage && (
            <span className={`text-sm px-3 py-1.5 rounded-lg ${saveMessage === 'Saved!' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>{saveMessage}</span>
          )}
        </motion.div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold flex items-center gap-2"><User className="w-5 h-5 text-blue-500" />Profile</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4 mb-4">
                {session.user?.image ? (
                  <img src={session.user.image} alt={session.user.name || ''} className="w-16 h-16 rounded-full" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
                    {session.user?.name?.[0] || session.user?.email?.[0] || '?'}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">{session.user?.name}</h3>
                  <p className="text-gray-400 text-sm">{session.user?.email}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Username</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <span className="px-3 text-gray-500 text-sm">/u/</span>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="my-username" className="flex-1 p-3 bg-transparent text-white text-sm outline-none" pattern="[a-zA-Z0-9_-]+" />
                  </div>
                  <button onClick={() => saveSettings({ username })} disabled={saving || !username} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">3-30 characters, letters, numbers, hyphens and underscores only</p>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Bio</label>
                <div className="flex gap-2">
                  <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." maxLength={200} rows={2} className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none outline-none" />
                  <button onClick={() => saveSettings({ bio })} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg text-sm transition-colors self-end">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>

              {settings.username && (
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Your public profile:</span>
                  <Link href={`/u/${settings.username}`} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                    /u/{settings.username}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Privacy Controls */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" />Public Profile & Privacy</h2>
              <p className="text-sm text-gray-500 mt-1">Control what others can see on your profile</p>
            </div>
            <div className="divide-y divide-gray-800">
              <ToggleRow label="Public Profile" description="Allow others to view your profile at /u/username" value={settings.profilePublic} onChange={() => toggleSetting('profilePublic')} />
              <ToggleRow label="Show Total Hours" description="Display your total coding hours" value={settings.showHours} onChange={() => toggleSetting('showHours')} disabled={!settings.profilePublic} />
              <ToggleRow label="Show Languages" description="Display your top programming languages" value={settings.showLanguages} onChange={() => toggleSetting('showLanguages')} disabled={!settings.profilePublic} />
              <ToggleRow label="Show Streak" description="Display your current and longest streak" value={settings.showStreak} onChange={() => toggleSetting('showStreak')} disabled={!settings.profilePublic} />
              <ToggleRow label="Show Heatmap" description="Display your contribution heatmap" value={settings.showHeatmap} onChange={() => toggleSetting('showHeatmap')} disabled={!settings.profilePublic} />
              <ToggleRow label="Show Projects" description="Display your project breakdown" value={settings.showProjects} onChange={() => toggleSetting('showProjects')} disabled={!settings.profilePublic} />
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Bell className="w-5 h-5 text-blue-500" />Notifications</h2>
            </div>
            <div className="divide-y divide-gray-800">
              <ToggleRow label="Daily Digest" description="Receive a daily summary of your coding activity" value={settings.dailyDigest} onChange={() => toggleSetting('dailyDigest')} />
              <ToggleRow label="Streak Reminder" description="Get notified when your streak is about to break" value={settings.streakReminder} onChange={() => toggleSetting('streakReminder')} />
            </div>
          </motion.div>

          {/* API Key Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Key className="w-5 h-5 text-blue-500" />API Key</h2>
              <p className="text-sm text-gray-400 mt-1">Use this key to connect VS Code extension to your account</p>
            </div>
            <div className="p-6 space-y-4">
              {apiKey ? (
                <>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-gray-800 rounded-lg text-sm font-mono break-all border border-gray-700 text-gray-300">{apiKey}</code>
                    <button onClick={copyApiKey} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700" title="Copy to clipboard">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={generateApiKey} disabled={apiKeyLoading} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm text-gray-300">
                      <RefreshCw className={`w-4 h-4 ${apiKeyLoading ? 'animate-spin' : ''}`} />Regenerate
                    </button>
                    <button onClick={testApiKey} disabled={testStatus === 'testing'} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm">
                      {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
                      {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      {testStatus === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
                      {testStatus === 'idle' ? 'Test Connection' : testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? 'Connected!' : 'No Activity'}
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center gap-2 text-sm">
                      <Trash2 className="w-4 h-4" />Revoke
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 mb-4">No API key generated yet</p>
                  <button onClick={generateApiKey} disabled={apiKeyLoading} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto">
                    {apiKeyLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                    Generate API Key
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold flex items-center gap-2"><ExternalLink className="w-5 h-5 text-blue-500" />Quick Links</h2>
            </div>
            <div className="divide-y divide-gray-800">
              <Link href="/onboarding" className="flex items-center justify-between p-4 hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3"><Code2 className="w-5 h-5 text-gray-400" /><span className="text-gray-300">VS Code Extension Setup</span></div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </Link>
              <a href="https://github.com/SATWIKKKKK/ide-grate" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3"><ExternalLink className="w-5 h-5 text-gray-400" /><span className="text-gray-300">View on GitHub</span></div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </a>
            </div>
          </motion.div>

          {/* Data Management */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5 text-blue-500" />Privacy & Data</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400" />Your privacy matters</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• We only track time and language usage</li>
                  <li>• No code content is ever stored or transmitted</li>
                  <li>• File names are not stored (only file types)</li>
                  <li>• You can export or delete your data anytime</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={exportData} disabled={exportLoading} className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm text-gray-300">
                  {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export My Data
                </button>
                <button onClick={() => setShowDataDeleteConfirm(true)} className="flex-1 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm text-red-400">
                  <Trash2 className="w-4 h-4" />
                  Delete All Data
                </button>
              </div>
            </div>
          </motion.div>

          {/* Sign Out */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full p-4 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 rounded-xl text-red-400 font-medium transition-colors">
              Sign Out
            </button>
          </motion.div>
        </div>
      </main>

      {/* Revoke API Key Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">Revoke API Key?</h3>
                <p className="text-gray-400 text-center text-sm mb-6">This will disconnect your VS Code extension. You&apos;ll need to generate a new key and reconfigure the extension.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300">Cancel</button>
                  <button onClick={revokeApiKey} disabled={apiKeyLoading} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                    {apiKeyLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Revoke Key
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Data Confirmation */}
      <AnimatePresence>
        {showDataDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">Delete All Data?</h3>
                <p className="text-gray-400 text-center text-sm mb-6">This will permanently delete all your activity data, achievements, goals, and stats. Your account will remain but all tracking data will be gone. This cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDataDeleteConfirm(false)} className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300">Cancel</button>
                  <button onClick={deleteData} disabled={deleteDataLoading} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                    {deleteDataLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Delete Everything
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ToggleRow({ label, description, value, onChange, disabled }: { label: string; description: string; value: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-4 sm:p-5 ${disabled ? 'opacity-40' : ''}`}>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button onClick={onChange} disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-700'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}
