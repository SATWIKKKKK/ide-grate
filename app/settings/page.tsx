'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2, Key, Copy, RefreshCw, Check, User, Shield, Bell, Trash2,
  ExternalLink, AlertTriangle, ChevronRight, CheckCircle2, XCircle,
  Loader2, Eye, EyeOff, Globe, Download, Clock, Flame, Zap,
  Terminal, Info, Wifi, WifiOff, Calendar, LayoutDashboard, LogOut,
  ArrowRight,
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

interface StatsOverview {
  totalHours: number
  currentStreak: number
  longestStreak: number
  totalSessions: number
  activeDays: number
  uniqueLanguages: number
}

interface ConnectionStatus {
  connected: boolean
  hasApiKey: boolean
  hasActivity: boolean
  lastActivityAt: string | null
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // API key
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  // Settings
  const [settings, setSettings] = useState<UserSettings>({
    username: null, bio: null, profilePublic: false,
    showHours: true, showLanguages: true, showStreak: true,
    showHeatmap: true, showProjects: false,
    dailyDigest: false, streakReminder: false,
  })
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

  // Stats & connection
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [connection, setConnection] = useState<ConnectionStatus | null>(null)
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null)

  // Data management
  const [showDataDeleteConfirm, setShowDataDeleteConfirm] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteDataLoading, setDeleteDataLoading] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteStep, setDeleteStep] = useState(1)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchAll = useCallback(async () => {
    const [settingsRes, keyRes, statsRes, connRes, userRes] = await Promise.all([
      fetch('/api/settings'),
      fetch('/api/apikey'),
      fetch('/api/stats/overview'),
      fetch('/api/connection-status'),
      fetch('/api/users'),
    ])

    if (settingsRes.ok) {
      const d = await settingsRes.json()
      setSettings(d)
      setUsername(d.username || '')
      setBio(d.bio || '')
    }
    if (keyRes.ok) {
      const d = await keyRes.json()
      setApiKey(d.apiKey)
    }
    if (statsRes.ok) {
      const d = await statsRes.json()
      setStats({
        totalHours: d.totalHours || 0,
        currentStreak: d.currentStreak || 0,
        longestStreak: d.longestStreak || 0,
        totalSessions: d.totalSessions || 0,
        activeDays: d.activeDays || 0,
        uniqueLanguages: d.uniqueLanguages || 0,
      })
    }
    if (connRes.ok) setConnection(await connRes.json())
    if (userRes.ok) {
      const d = await userRes.json()
      setAccountCreatedAt(d.createdAt || null)
    }
    setSettingsLoading(false)
  }, [])

  useEffect(() => {
    if (session?.user) fetchAll()
  }, [session, fetchAll])

  // ── Save helpers ────────────────────────────────────────────────────────────
  const saveSettings = async (updates: Partial<UserSettings>) => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const data = await res.json()
        // API returns the flat settings object directly (not { user: ... })
        setSettings(data)
        setSaveMsg({ text: 'Saved!', ok: true })
      } else {
        const err = await res.json()
        setSaveMsg({ text: err.error || 'Failed to save', ok: false })
      }
    } catch {
      setSaveMsg({ text: 'Network error', ok: false })
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(null), 3000)
  }

  const toggleSetting = async (key: keyof UserSettings) => {
    const newVal = !settings[key]
    setSettings(prev => ({ ...prev, [key]: newVal }))
    await saveSettings({ [key]: newVal })
  }

  // ── API key helpers ─────────────────────────────────────────────────────────
  const generateApiKey = async () => {
    setApiKeyLoading(true)
    try {
      const res = await fetch('/api/apikey', { method: 'POST' })
      if (res.ok) {
        const d = await res.json()
        setApiKey(d.apiKey)
        setShowKey(true)
      }
    } catch { /* ignore */ }
    setApiKeyLoading(false)
  }

  const revokeApiKey = async () => {
    setApiKeyLoading(true)
    try {
      const res = await fetch('/api/apikey', { method: 'DELETE' })
      if (res.ok) {
        setApiKey(null)
        setConnection(prev => prev ? { ...prev, connected: false, hasApiKey: false } : null)
      }
    } catch { /* ignore */ }
    setApiKeyLoading(false)
    setShowRevokeConfirm(false)
  }

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const testConnection = async () => {
    setTestStatus('testing')
    try {
      const res = await fetch('/api/connection-status')
      if (res.ok) {
        const d = await res.json()
        setConnection(d)
        setTestStatus(d.connected ? 'success' : 'error')
      } else setTestStatus('error')
    } catch { setTestStatus('error') }
    setTimeout(() => setTestStatus('idle'), 4000)
  }

  // ── Data management ─────────────────────────────────────────────────────────
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
      setStats(null)
    } catch { /* ignore */ }
    setDeleteDataLoading(false)
  }

  const formatHours = (h: number) => {
    if (!h) return '0h'
    if (h < 1) return `${Math.round(h * 60)}m`
    if (h < 100) return `${h.toFixed(1)}h`
    return `${Math.round(h)}h`
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (status === 'loading' || settingsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading settings…</p>
        </div>
      </div>
    )
  }
  if (!session) return null

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-4 flex-1">
            {session.user?.image ? (
              <img src={session.user.image} alt="" className="w-14 h-14 rounded-full ring-2 ring-blue-500/30 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {session.user?.name?.[0] || session.user?.email?.[0] || '?'}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{session.user?.name || 'Settings'}</h1>
              <p className="text-gray-500 text-sm">{session.user?.email}</p>
              {accountCreatedAt && (
                <p className="text-gray-600 text-xs mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Member since {new Date(accountCreatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          {saveMsg && (
            <motion.span
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                saveMsg.ok
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                  : 'bg-red-600/20 text-red-400 border border-red-600/30'
              }`}
            >
              {saveMsg.ok && <Check className="w-3 h-3" />}
              {saveMsg.text}
            </motion.span>
          )}
        </motion.div>

        {/* Stats Overview from DB */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
          >
            {[
              { label: 'Total Hours', value: formatHours(stats.totalHours), icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Current Streak', value: `${stats.currentStreak}d`, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Best Streak', value: `${stats.longestStreak}d`, icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Total Sessions', value: stats.totalSessions.toLocaleString(), icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Active Days', value: stats.activeDays.toString(), icon: Calendar, color: 'text-violet-400', bg: 'bg-violet-500/10' },
              { label: 'Languages', value: stats.uniqueLanguages.toString(), icon: Code2, color: 'text-pink-400', bg: 'bg-pink-500/10' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 + i * 0.04 }}
                className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 sm:p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                  </div>
                  <span className="text-xs text-gray-500 leading-tight">{s.label}</span>
                </div>
                <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="space-y-5">
          {/* Profile */}
          <Section title="Profile" icon={<User className="w-4 h-4 text-blue-400" />} delay={0.1}>
            <div className="p-5 sm:p-6 space-y-4">
              {/* Username */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Username</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden focus-within:border-blue-500/50 transition-colors">
                    <span className="px-3 text-gray-500 text-sm shrink-0">/u/</span>
                    <input
                      type="text" value={username}
                      onChange={e => setUsername(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveSettings({ username })}
                      placeholder="my-username"
                      className="flex-1 p-2.5 bg-transparent text-white text-sm outline-none"
                    />
                  </div>
                  <button
                    onClick={() => saveSettings({ username })}
                    disabled={saving || !username || username === (settings.username || '')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">3–30 chars · letters, numbers, - and _ only</p>
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Bio <span className="text-gray-600">{bio.length}/200</span></label>
                <div className="flex gap-2">
                  <textarea
                    value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Tell others about yourself…"
                    maxLength={200} rows={2}
                    className="flex-1 p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none outline-none focus:border-blue-500/50 transition-colors"
                  />
                  <button
                    onClick={() => saveSettings({ bio })}
                    disabled={saving || bio === (settings.bio || '')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm transition-colors self-end flex items-center gap-1.5 shrink-0"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
              </div>

              {/* Public profile link */}
              {settings.username && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Your public profile</p>
                    <p className="text-sm text-blue-400">/u/{settings.username}</p>
                  </div>
                  <Link href={`/u/${settings.username}`} target="_blank" className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                  </Link>
                </div>
              )}
            </div>
          </Section>

          {/* VS Code Connection */}
          <Section title="VS Code Connection" icon={<Code2 className="w-4 h-4 text-emerald-400" />} delay={0.15}>
            <div className="p-5 sm:p-6 space-y-4">
              {/* Live connection badge */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border ${
                connection?.connected
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : connection?.hasApiKey
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-gray-800/40 border-gray-700'
              }`}>
                <div className="flex items-center gap-3">
                  {connection?.connected
                    ? <Wifi className="w-5 h-5 text-emerald-400 shrink-0" />
                    : <WifiOff className="w-5 h-5 text-gray-500 shrink-0" />}
                  <div>
                    <p className={`text-sm font-medium ${connection?.connected ? 'text-emerald-400' : connection?.hasApiKey ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {connection?.connected
                        ? 'VS Code Connected & Tracking'
                        : connection?.hasApiKey
                          ? 'API Key Set — Open VS Code to start'
                          : 'Not Connected'}
                    </p>
                    {connection?.lastActivityAt && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Last heartbeat: {new Date(connection.lastActivityAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={testConnection}
                  disabled={testStatus === 'testing'}
                  className="shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors flex items-center gap-1.5"
                >
                  {testStatus === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
                  {testStatus === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {testStatus === 'error' && <XCircle className="w-3 h-3 text-red-400" />}
                  {testStatus === 'idle' ? 'Refresh Status' : testStatus === 'testing' ? 'Checking…' : testStatus === 'success' ? 'Active!' : 'Inactive'}
                </button>
              </div>

              {/* API Key display */}
              {apiKey ? (
                <div className="space-y-3">
                  <label className="text-sm text-gray-400 block">Your API Key</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm break-all min-w-0 overflow-hidden">
                      {showKey
                        ? <span className="text-blue-300 select-all">{apiKey}</span>
                        : <span className="text-gray-600">{'•'.repeat(Math.min(apiKey.length, 48))}</span>}
                    </div>
                    <button onClick={() => setShowKey(v => !v)} className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors shrink-0">
                      {showKey ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={copyApiKey} className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors shrink-0">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={generateApiKey} disabled={apiKeyLoading}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors flex items-center gap-1.5">
                      <RefreshCw className={`w-3 h-3 ${apiKeyLoading ? 'animate-spin' : ''}`} /> Regenerate
                    </button>
                    <button onClick={() => setShowRevokeConfirm(true)}
                      className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg text-xs transition-colors flex items-center gap-1.5">
                      <Trash2 className="w-3 h-3" /> Revoke Key
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-3">No API key generated yet</p>
                  <button onClick={generateApiKey} disabled={apiKeyLoading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors flex items-center gap-2 mx-auto">
                    {apiKeyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    Generate API Key
                  </button>
                </div>
              )}

              {/* Setup steps */}
              <div className="bg-gray-800/30 border border-gray-700/40 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 mb-3">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" /> How to connect VS Code
                </p>
                {[
                  'Install the VS Integrate extension from VS Code Marketplace',
                  'Come back here, generate or copy your API key above',
                  'In VS Code: Ctrl+Shift+P → "VS Integrate: Set API Key" → paste',
                  'Status bar shows tracking status — nothing else required',
                  'Connection persists permanently until you revoke the key',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Privacy Controls */}
          <Section title="Public Profile & Privacy" icon={<Globe className="w-4 h-4 text-blue-400" />} delay={0.2}>
            <div className="divide-y divide-gray-800/50">
              <ToggleRow label="Public Profile" description="Let others view your profile at /u/username" value={settings.profilePublic} onChange={() => toggleSetting('profilePublic')} />
              <ToggleRow label="Show Total Hours" description="Display your total coding hours" value={settings.showHours} onChange={() => toggleSetting('showHours')} disabled={!settings.profilePublic} />
              <ToggleRow label="Show Languages" description="Display your top programming languages" value={settings.showLanguages} onChange={() => toggleSetting('showLanguages')} disabled={!settings.profilePublic} />
              <ToggleRow label="Show Streak" description="Display current and longest streak" value={settings.showStreak} onChange={() => toggleSetting('showStreak')} disabled={!settings.profilePublic} />
              <ToggleRow label="Show Heatmap" description="Display contribution activity heatmap" value={settings.showHeatmap} onChange={() => toggleSetting('showHeatmap')} disabled={!settings.profilePublic} />
              <ToggleRow label="Show Projects" description="Show project breakdown on public profile" value={settings.showProjects} onChange={() => toggleSetting('showProjects')} disabled={!settings.profilePublic} />
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifications & Email" icon={<Bell className="w-4 h-4 text-blue-400" />} delay={0.25}>
            <div className="divide-y divide-gray-800/50">
              <ToggleRow label="Goal Achievement Email" description="Get emailed when you achieve a coding goal" value={settings.dailyDigest} onChange={() => toggleSetting('dailyDigest')} />
              <ToggleRow label="Streak Reminder" description="Get warned when your streak is about to break" value={settings.streakReminder} onChange={() => toggleSetting('streakReminder')} />
            </div>
            <div className="px-5 sm:px-6 py-4 border-t border-gray-800/50">
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                <p>
                  Emails sent to <span className="text-gray-300 font-medium">{session.user?.email}</span>.
                  Configure <code className="text-blue-400">SMTP_USER</code> and <code className="text-blue-400">SMTP_PASS</code> in your
                  environment variables to enable email delivery.
                </p>
              </div>
            </div>
          </Section>

          {/* Quick Links */}
          <Section title="Quick Links" icon={<ArrowRight className="w-4 h-4 text-blue-400" />} delay={0.3}>
            <div className="divide-y divide-gray-800/50">
              <Link href="/dashboard" className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-300">Dashboard</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </Link>
              <Link href="/onboarding" className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Code2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-300">VS Code Extension Setup Guide</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </Link>
            </div>
          </Section>

          {/* Data & Privacy */}
          <Section title="Privacy & Data" icon={<Shield className="w-4 h-4 text-blue-400" />} delay={0.35}>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-300 mb-2">What we collect</p>
                <ul className="text-xs text-gray-500 space-y-1.5">
                  <li>✓ Time spent per coding session (seconds)</li>
                  <li>✓ Active programming language</li>
                  <li>✓ Anonymized project hash (never the path)</li>
                  <li>✓ Platform (macOS / Windows / Linux)</li>
                  <li className="text-red-400/70">✗ Never: code content, file content, keystrokes, file names</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={exportData} disabled={exportLoading}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 transition-colors flex items-center justify-center gap-2 border border-gray-700">
                  {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export All Data (JSON)
                </button>
                <button onClick={() => setShowDataDeleteConfirm(true)}
                  className="flex-1 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-xl text-sm text-red-400 transition-colors flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete All Tracking Data
                </button>
              </div>
            </div>
          </Section>

          {/* Sign Out */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full p-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-red-500/30 rounded-xl text-gray-300 hover:text-red-400 font-medium transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </motion.div>
        </div>
      </main>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRevokeConfirm && (
          <ModalOverlay onClose={() => setShowRevokeConfirm(false)}>
            <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">Revoke API Key?</h3>
            <p className="text-gray-400 text-center text-sm mb-6">VS Code will disconnect. Generate a new key to reconnect.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRevokeConfirm(false)} className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors">Cancel</button>
              <button onClick={revokeApiKey} disabled={apiKeyLoading}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                {apiKeyLoading && <RefreshCw className="w-4 h-4 animate-spin" />} Revoke
              </button>
            </div>
          </ModalOverlay>
        )}

        {showDataDeleteConfirm && (
          <ModalOverlay onClose={() => { setShowDataDeleteConfirm(false); setDeleteStep(1); setDeleteConfirmText('') }}>
            <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            {deleteStep === 1 ? (
              <>
                <h3 className="text-lg font-semibold text-center mb-2">Delete All Tracking Data?</h3>
                <p className="text-gray-400 text-center text-sm mb-6">
                  Permanently deletes activities, contributions, achievements, and goals.
                  {' '}<span className="text-red-400 font-medium">This cannot be undone.</span>
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDataDeleteConfirm(false)} className="flex-1 px-4 py-3 bg-gray-800 rounded-xl text-gray-300">Cancel</button>
                  <button onClick={() => setDeleteStep(2)} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl">Continue</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-center mb-2">Type DELETE to confirm</h3>
                <input
                  type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE" autoFocus
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm font-mono text-center mb-4 focus:border-red-500 outline-none"
                />
                <div className="flex gap-3">
                  <button onClick={() => { setShowDataDeleteConfirm(false); setDeleteStep(1); setDeleteConfirmText('') }}
                    className="flex-1 px-4 py-3 bg-gray-800 rounded-xl text-gray-300">Cancel</button>
                  <button onClick={deleteData} disabled={deleteDataLoading || deleteConfirmText !== 'DELETE'}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl flex items-center justify-center gap-2">
                    {deleteDataLoading && <Loader2 className="w-4 h-4 animate-spin" />} Delete All
                  </button>
                </div>
              </>
            )}
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({
  title, icon, delay, children,
}: { title: string; icon: React.ReactNode; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden"
    >
      <div className="px-5 sm:px-6 py-4 border-b border-gray-800 flex items-center gap-2.5">
        {icon}
        <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </motion.div>
  )
}

function ToggleRow({
  label, description, value, onChange, disabled,
}: { label: string; description: string; value: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-5 sm:px-6 py-3.5 transition-colors ${disabled ? 'opacity-40' : 'hover:bg-gray-800/20 cursor-pointer'}`}
      onClick={disabled ? undefined : onChange}
    >
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); if (!disabled) onChange() }}
        disabled={disabled}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-700'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        aria-checked={value}
        role="switch"
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  )
}

