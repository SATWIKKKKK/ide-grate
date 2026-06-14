'use client'


import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
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
import AppFooter from '@/components/AppFooter'

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
 totalSessions?: number
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
 const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error' | 'ready'>('idle')

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
 const hasFetched = useRef(false)

 useEffect(() => {
 if (status === 'unauthenticated') router.push('/login')
 }, [status, router])

 const fetchAll = useCallback(async () => {
 try {
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
 } catch (err) {
 console.error('Settings fetch error:', err)
 } finally {
 setSettingsLoading(false)
 }
 }, [])

 useEffect(() => {
 if (session?.user && !hasFetched.current) {
 hasFetched.current = true
 fetchAll()
 }
 }, [session, fetchAll])

 // Auto-poll connection status every 15s
 useEffect(() => {
 if (!session?.user) return
 const poll = async () => {
 try {
 const res = await fetch('/api/connection-status')
 if (res.ok) setConnection(await res.json())
 } catch { /* ignore */ }
 }
 const interval = setInterval(poll, 15000)
 return () => clearInterval(interval)
 }, [session])

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

 const connectVsCode = async () => {
 setApiKeyLoading(true)
 try {
 let key = apiKey
 if (!key) {
 const res = await fetch('/api/apikey', { method: 'POST' })
 if (!res.ok) throw new Error('Failed to generate API key')
 const data = await res.json()
 key = data.apiKey
 setApiKey(key)
 }
 setShowKey(true)
 } catch (error) {
 console.error('Failed to generate API key:', error)
 } finally {
 setApiKeyLoading(false)
 }
 }

 const testConnection = async () => {
 setTestStatus('testing')
 try {
 const res = await fetch('/api/connection-status')
 if (res.ok) {
 const d = await res.json()
 setConnection(d)
 setTestStatus(d.connected ? 'success' : d.hasApiKey ? 'ready' : 'error')
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
 a.download = 'cadence-data.json'
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
 if (status === 'loading' || (settingsLoading && status !== 'unauthenticated')) {
 return (
 <div className="page-shell min-h-screen flex items-center justify-center">
 <div className="flex flex-col items-center gap-4">
 <div className="relative">
 <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="w-4 h-4 bg-primary/30 rounded-full animate-pulse" />
 </div>
 </div>
 <p className="text-muted-foreground text-sm font-medium">Loading settings…</p>
 <p className="text-muted-foreground text-xs">Fetching your profile and stats</p>
 </div>
 </div>
 )
 }
 if (!session) return null

 // ── Render ──────────────────────────────────────────────────────────────────
 return (
 <div className="page-shell flex min-h-screen flex-col text-foreground">
 <Navbar />

 <main className="signal-container flex-1 py-14 sm:py-16" data-gsap-stagger>
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
 className="mb-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center"
 data-gsap-item
 >
 <div className="flex flex-1 items-center gap-6">
 {session.user?.image ? (
 <img src={session.user.image} alt="" className="h-24 w-24 shrink-0 rounded-lg border-2 border-border object-cover" />
 ) : (
 <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-secondary text-4xl font-bold text-foreground">
 {session.user?.name?.[0] || session.user?.email?.[0] || '?'}
 </div>
 )}
 <div>
 <h1 className="text-[clamp(3rem,6vw,4.5rem)] leading-none">{session.user?.name || 'Settings'}</h1>
 <p className="mt-3 text-lg text-muted-foreground">{session.user?.email}</p>
 {accountCreatedAt && (
 <p className="mt-2 flex items-center gap-1 font-mono text-sm text-muted-foreground">
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
 ? 'bg-primary/20 text-primary border border-primary/30'
 : 'bg-destructive/20 text-destructive border border-destructive/30'
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
 className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
 data-gsap-stagger
 >
 {[
 { label: 'Total Hours', value: formatHours(stats.totalHours), icon: Clock, color: 'text-primary', bg: 'bg-primary/10', border: 'hover:border-primary/30' },
 { label: 'Current Streak', value: `${stats.currentStreak}d`, icon: Flame, color: 'text-primary', bg: 'bg-primary/10', border: 'hover:border-primary/30' },
 { label: 'Best Streak', value: `${stats.longestStreak}d`, icon: Flame, color: 'text-primary', bg: 'bg-primary/10', border: 'hover:border-primary/30' },
 { label: 'Total Sessions', value: stats.totalSessions.toLocaleString(), icon: Zap, color: 'text-primary', bg: 'bg-primary/10', border: 'hover:border-primary/30' },
 { label: 'Active Days', value: stats.activeDays.toString(), icon: Calendar, color: 'text-primary', bg: 'bg-primary/10', border: 'hover:border-primary/30' },
 { label: 'Languages', value: stats.uniqueLanguages.toString(), icon: Code2, color: 'text-primary', bg: 'bg-primary/10', border: 'hover:border-primary/30' },
 ].map((s, i) => (
 <motion.div
 key={s.label}
 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 + i * 0.04 }}
 className={`app-card p-8 transition-colors ${s.border}`}
 data-gsap-item
 >
 <div className="mb-6 flex items-center gap-3">
 <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
 <s.icon className="h-4 w-4 text-muted-foreground" />
 </div>
 <span className="font-mono text-sm text-muted-foreground">{s.label}</span>
 </div>
 <p className="font-display text-5xl text-primary">{s.value}</p>
 </motion.div>
 ))}
 </motion.div>
 )}

 <div className="space-y-8">
 {/* Profile */}
 <Section title="Profile" icon={<User className="w-4 h-4 text-primary" />} delay={0.1}>
 <div className="p-5 sm:p-6 space-y-4">
 {/* Username */}
 <div>
 <label className="text-sm text-muted-foreground mb-1.5 block">Username</label>
 <div className="flex flex-col sm:flex-row gap-2">
 <div className="flex-1 flex items-center bg-secondary border border-border rounded-lg overflow-hidden focus-within:border-primary/50 transition-colors">
 <span className="px-3 text-muted-foreground text-sm shrink-0">/u/</span>
 <input
 type="text" value={username}
 onChange={e => setUsername(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && saveSettings({ username })}
 placeholder="my-username"
 className="flex-1 p-2.5 bg-transparent text-foreground text-sm outline-none"
 />
 </div>
 <button
 onClick={() => saveSettings({ username })}
 disabled={saving || !username || username === (settings.username || '')}
 className="signal-button px-4 py-2 text-sm disabled:opacity-45 flex items-center justify-center gap-1.5 shrink-0"
 >
 {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
 Save
 </button>
 </div>
 <p className="text-xs text-muted-foreground mt-1">3–30 chars · letters, numbers, - and _ only</p>
 </div>

 {/* Bio */}
 <div>
 <label className="text-sm text-muted-foreground mb-1.5 block">Bio <span className="text-muted-foreground">{bio.length}/200</span></label>
 <div className="flex flex-col sm:flex-row gap-2">
 <textarea
 value={bio} onChange={e => setBio(e.target.value)}
 placeholder="Tell others about yourself…"
 maxLength={200} rows={2}
 className="flex-1 p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm resize-none outline-none focus:border-primary/50 transition-colors"
 />
 <button
 onClick={() => saveSettings({ bio })}
 disabled={saving || bio === (settings.bio || '')}
 className="signal-button px-4 py-2 text-sm disabled:opacity-45 sm:self-end flex items-center justify-center gap-1.5 shrink-0"
 >
 {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
 Save
 </button>
 </div>
 </div>

 {/* Public profile link */}
 {settings.username && (
 <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
 <div>
 <p className="text-xs text-muted-foreground">Your public profile</p>
 <p className="text-sm text-primary">/u/{settings.username}</p>
 </div>
 <Link href={`/u/${settings.username}`} target="_blank" className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
 <ExternalLink className="w-4 h-4 text-primary" />
 </Link>
 </div>
 )}
 </div>
 </Section>

 {/* Editor Connection */}
 <Section title="Editor Connections" icon={<Code2 className="w-4 h-4 text-primary" />} delay={0.15}>
 <div className="p-5 sm:p-6 space-y-4">
 {/* Live connection badge */}
 <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border ${
 connection?.connected
 ? 'bg-primary/10 border-primary/30'
 : 'bg-secondary/40 border-border'
 }`}>
 <div className="flex items-center gap-3">
 {connection?.connected
 ? <Wifi className="w-5 h-5 text-primary shrink-0" />
 : <WifiOff className="w-5 h-5 text-muted-foreground shrink-0" />}
 <div>
 <p className={`text-sm font-medium ${connection?.connected ? 'text-primary' : 'text-muted-foreground'}`}>
 {connection?.connected
 ? 'Cadence Connected & Tracking'
 : connection?.hasApiKey
 ? 'Not Connected — open a configured editor to start tracking'
 : 'Not Connected'}
 </p>
 {connection?.connected && (
 <p className="text-xs text-primary/70 mt-0.5">Heartbeats received — every second is being tracked</p>
 )}
 {!connection?.connected && connection?.hasApiKey && (
 <p className="text-xs text-muted-foreground mt-0.5">
 {connection?.lastActivityAt
 ? `Last active: ${new Date(connection.lastActivityAt).toLocaleString()}`
 : 'No heartbeats yet — install an editor integration'}
 </p>
 )}
 {!connection?.connected && !connection?.hasApiKey && (
 <p className="text-xs text-muted-foreground mt-0.5">Generate an API key below to get started</p>
 )}
 </div>
 </div>
 <button
 onClick={testConnection}
 disabled={testStatus === 'testing'}
 className={`shrink-0 px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
 connection?.connected
 ? 'bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary hover:text-primary'
 : 'bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary hover:text-primary'
 }`}
 >
 {testStatus === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
 {testStatus === 'success' && <CheckCircle2 className="w-3 h-3 text-primary" />}
 {testStatus === 'ready' && <CheckCircle2 className="w-3 h-3 text-primary" />}
 {testStatus === 'error' && <XCircle className="w-3 h-3 text-destructive" />}
 {testStatus === 'idle' ? 'Refresh Status'
 : testStatus === 'testing' ? 'Checking…'
 : testStatus === 'success' ? 'Connected!'
 : testStatus === 'ready' ? 'Key Valid'
 : 'No Key'}
 </button>
 </div>

 {apiKey && !connection?.connected && (
 <div className="space-y-3">
 <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
 <p className="text-xs text-primary font-medium mb-1">How to connect:</p>
 <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
 <li>Open the multi-IDE setup guide and choose your editor</li>
 <li>Install the VSIX, native plugin, or companion path shown there</li>
 <li>Paste your Cadence API key</li>
 <li>Use endpoint: <code className="text-primary bg-secondary px-1 rounded">/api/heartbeat</code></li>
 </ol>
 </div>
 {!apiKey && (
 <button
 onClick={connectVsCode}
 disabled={apiKeyLoading}
 className="signal-button w-full sm:w-auto px-4 py-2.5 text-sm disabled:opacity-45 flex items-center justify-center gap-2"
 >
 {apiKeyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
 Generate API Key
 </button>
 )}
 </div>
 )}

 {/* API Key display */}
 {apiKey ? (
 <div className="space-y-3">
 <label className="text-sm text-muted-foreground block">Your API Key</label>
 <div className="flex items-center gap-2">
 <div className="flex-1 p-3 bg-secondary border border-border rounded-lg font-mono text-sm break-all min-w-0 overflow-hidden">
 {showKey
 ? <span className="text-primary select-all">{apiKey}</span>
 : <span className="text-muted-foreground">{'•'.repeat(Math.min(apiKey.length, 48))}</span>}
 </div>
 <button onClick={() => setShowKey(v => !v)} className="p-2.5 bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 transition-colors shrink-0">
 {showKey ? <EyeOff className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4 text-primary" />}
 </button>
 <button onClick={copyApiKey} className={`p-2.5 rounded-lg border transition-colors shrink-0 ${copied ? 'bg-primary/10 border-primary/20' : 'bg-secondary hover:bg-secondary border-border'}`}>
 {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
 </button>
 </div>
 <div className="flex flex-wrap gap-2">
 <button onClick={generateApiKey} disabled={apiKeyLoading}
 className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-xs text-primary transition-colors flex items-center gap-1.5">
 <RefreshCw className={`w-3 h-3 ${apiKeyLoading ? 'animate-spin' : ''}`} /> Regenerate
 </button>
 <button onClick={() => setShowRevokeConfirm(true)}
 className="px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg text-xs transition-colors flex items-center gap-1.5">
 <Trash2 className="w-3 h-3" /> Revoke Key
 </button>
 </div>
 </div>
 ) : (
 <div className="text-center py-4">
 <p className="text-muted-foreground text-sm mb-3">No API key generated yet</p>
 <button onClick={generateApiKey} disabled={apiKeyLoading}
 className="signal-button px-5 py-2.5 text-sm flex items-center gap-2 mx-auto">
 {apiKeyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
 Generate API Key
 </button>
 </div>
 )}

 {/* Setup steps */}
 <div className="bg-secondary/30 border border-border/40 rounded-xl p-4 space-y-2.5">
 <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-3">
 <Terminal className="w-3.5 h-3.5 text-primary" /> How to connect editors
 </p>
 {[
 'Open Dashboard > Setup and choose an editor',
 'Install the VSIX, native plugin, or companion path for that editor',
 'Paste your Cadence API key in the integration settings',
 'When prompted for endpoint, enter: /api/heartbeat',
 'Status bar shows tracking state. Your dashboard updates as heartbeats arrive.',
 ].map((step, i) => (
 <div key={i} className="flex items-start gap-2.5">
 <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
 <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
 </div>
 ))}
 <div className="mt-3">
 <a
 href="/api/download/vsix"
 download="cadence.vsix"
 className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary rounded-lg text-xs text-primary-foreground font-medium transition-colors"
 >
 <Download className="w-3.5 h-3.5" />
 Download cadence.vsix
 </a>
 </div>
 </div>
 </div>
 </Section>

 {/* Privacy Controls */}
 <Section title="Public Profile & Privacy" icon={<Globe className="w-4 h-4 text-primary" />} delay={0.2}>
 <div className="divide-y divide-border">
 <ToggleRow label="Public Profile" description="Let others view your profile at /u/username" value={settings.profilePublic} onChange={() => toggleSetting('profilePublic')} />
 <ToggleRow label="Show Total Hours" description="Display your total coding hours" value={settings.showHours} onChange={() => toggleSetting('showHours')} disabled={!settings.profilePublic} />
 <ToggleRow label="Show Languages" description="Display your top programming languages" value={settings.showLanguages} onChange={() => toggleSetting('showLanguages')} disabled={!settings.profilePublic} />
 <ToggleRow label="Show Streak" description="Display current and longest streak" value={settings.showStreak} onChange={() => toggleSetting('showStreak')} disabled={!settings.profilePublic} />
 <ToggleRow label="Show Heatmap" description="Display contribution activity heatmap" value={settings.showHeatmap} onChange={() => toggleSetting('showHeatmap')} disabled={!settings.profilePublic} />
 <ToggleRow label="Show Projects" description="Show project breakdown on public profile" value={settings.showProjects} onChange={() => toggleSetting('showProjects')} disabled={!settings.profilePublic} />
 </div>
 </Section>

 {/* Notifications */}
 <Section title="Notifications & Email" icon={<Bell className="w-4 h-4 text-primary" />} delay={0.25}>
 <div className="divide-y divide-border">
 <ToggleRow label="Goal Achievement Email" description="Get emailed when you achieve a coding goal" value={settings.dailyDigest} onChange={() => toggleSetting('dailyDigest')} />
 <ToggleRow label="Streak Reminder" description="Get warned when your streak is about to break" value={settings.streakReminder} onChange={() => toggleSetting('streakReminder')} />
 </div>
 <div className="px-5 sm:px-6 py-4 border-t border-border/50">
 <div className="flex items-start gap-2 text-xs text-muted-foreground">
 <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
 <p>
 Emails sent to <span className="text-muted-foreground font-medium">{session.user?.email}</span>.
 Configure <code className="text-primary">SMTP_USER</code> and <code className="text-primary">SMTP_PASS</code> in your
 environment variables to enable email delivery.
 </p>
 </div>
 </div>
 </Section>

 {/* Quick Links */}
 <Section title="Quick Links" icon={<ArrowRight className="w-4 h-4 text-primary" />} delay={0.3}>
 <div className="divide-y divide-border">
 <Link href="/dashboard" className="group flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-primary/5 border-l-2 border-transparent hover:border-primary transition-all">
 <div className="flex items-center gap-3">
 <LayoutDashboard className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
 <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">Dashboard</span>
 </div>
 <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
 </Link>
 <Link href="/dashboard/setup" className="group flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-primary/5 border-l-2 border-transparent hover:border-primary transition-all">
 <div className="flex items-center gap-3">
 <Code2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
 <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">Multi-IDE Setup Guide</span>
 </div>
 <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
 </Link>
 </div>
 </Section>

 {/* Data & Privacy */}
 <Section title="Privacy & Data" icon={<Shield className="w-4 h-4 text-primary" />} delay={0.35}>
 <div className="p-5 sm:p-6 space-y-4">
 <div className="bg-secondary/30 border border-border/30 rounded-xl p-4">
 <p className="text-sm font-semibold text-muted-foreground mb-2">What we collect</p>
 <ul className="text-xs text-muted-foreground space-y-1.5">
 <li>Collected: time spent per coding session (seconds)</li>
 <li>Collected: active programming language</li>
 <li>Collected: anonymized project hash (never the path)</li>
 <li>Collected: platform (macOS / Windows / Linux)</li>
 <li className="text-destructive/70">Never collected: code content, file content, keystrokes, file names</li>
 </ul>
 </div>
 <div className="flex flex-col sm:flex-row gap-3">
 <button onClick={exportData} disabled={exportLoading}
 className="flex-1 px-4 py-3 bg-primary/10 hover:bg-primary/20 rounded-xl text-sm text-primary hover:text-primary transition-colors flex items-center justify-center gap-2 border border-primary/20">
 {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
 Export All Data (JSON)
 </button>
 <button onClick={() => setShowDataDeleteConfirm(true)}
 className="flex-1 px-4 py-3 bg-destructive/10 hover:bg-destructive/20 border border-destructive/25 rounded-lg text-sm text-destructive transition-colors flex items-center justify-center gap-2">
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
 className="w-full p-4 app-card hover:bg-destructive/5 border-border hover:border-destructive/40 rounded-lg text-muted-foreground hover:text-destructive font-medium transition-all flex items-center justify-center gap-2"
 >
 <LogOut className="w-4 h-4" />
 Sign Out
 </button>
 </motion.div>
 </div>
 </main>
 <AppFooter />

 {/* ─── Modals ─────────────────────────────────────────────────────────── */}
 <AnimatePresence>
 {showRevokeConfirm && (
 <ModalOverlay onClose={() => setShowRevokeConfirm(false)}>
 <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
 <AlertTriangle className="w-6 h-6 text-destructive" />
 </div>
 <h3 className="text-lg font-semibold text-center mb-2">Revoke API Key?</h3>
 <p className="text-muted-foreground text-center text-sm mb-6">Connected editor integrations will disconnect. Generate a new key to reconnect.</p>
 <div className="flex gap-3">
 <button onClick={() => setShowRevokeConfirm(false)} className="flex-1 px-4 py-3 bg-secondary hover:bg-secondary rounded-xl text-muted-foreground transition-colors">Cancel</button>
 <button onClick={revokeApiKey} disabled={apiKeyLoading}
 className="flex-1 px-4 py-3 bg-destructive hover:bg-destructive text-foreground rounded-xl transition-colors flex items-center justify-center gap-2">
 {apiKeyLoading && <RefreshCw className="w-4 h-4 animate-spin" />} Revoke
 </button>
 </div>
 </ModalOverlay>
 )}

 {showDataDeleteConfirm && (
 <ModalOverlay onClose={() => { setShowDataDeleteConfirm(false); setDeleteStep(1); setDeleteConfirmText('') }}>
 <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
 <AlertTriangle className="w-6 h-6 text-destructive" />
 </div>
 {deleteStep === 1 ? (
 <>
 <h3 className="text-lg font-semibold text-center mb-2">Delete All Tracking Data?</h3>
 <p className="text-muted-foreground text-center text-sm mb-6">
 Permanently deletes activities, contributions, achievements, and goals.
 {' '}<span className="text-destructive font-medium">This cannot be undone.</span>
 </p>
 <div className="flex gap-3">
 <button onClick={() => setShowDataDeleteConfirm(false)} className="flex-1 px-4 py-3 bg-secondary rounded-xl text-muted-foreground">Cancel</button>
 <button onClick={() => setDeleteStep(2)} className="flex-1 px-4 py-3 bg-destructive hover:bg-destructive text-foreground rounded-xl">Continue</button>
 </div>
 </>
 ) : (
 <>
 <h3 className="text-lg font-semibold text-center mb-2">Type DELETE to confirm</h3>
 <input
 type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
 placeholder="DELETE" autoFocus
 className="w-full p-3 muted-panel rounded-lg text-foreground text-sm font-mono text-center mb-4 focus:border-destructive outline-none"
 />
 <div className="flex gap-3">
 <button onClick={() => { setShowDataDeleteConfirm(false); setDeleteStep(1); setDeleteConfirmText('') }}
 className="flex-1 px-4 py-3 bg-secondary rounded-xl text-muted-foreground">Cancel</button>
 <button onClick={deleteData} disabled={deleteDataLoading || deleteConfirmText !== 'DELETE'}
 className="flex-1 px-4 py-3 bg-destructive hover:bg-destructive disabled:bg-secondary disabled:text-muted-foreground text-foreground rounded-xl flex items-center justify-center gap-2">
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
 className="signal-panel overflow-hidden transition-colors"
 data-gsap="fade-up"
 >
 <div className="flex items-center gap-3 border-b border-border bg-card px-6 py-5">
 {icon}
 <h2 className="text-3xl">{title}</h2>
 </div>
 {children}
 </motion.div>
 )
}

function ToggleRow({
 label, description, value, onChange, disabled,
}: { label: string; description: string; value: boolean; onChange: () => void; disabled?: boolean }) {
 return (
 <div
 className={`flex items-center justify-between px-6 py-5 transition-all ${
 disabled
 ? 'opacity-40'
 : value
 ? 'hover:bg-accent cursor-pointer'
 : 'hover:bg-secondary/50 cursor-pointer'
 }`}
 onClick={disabled ? undefined : onChange}
 >
 <div className="flex-1 min-w-0 pr-4">
 <p className={`font-semibold transition-colors ${value && !disabled ? 'text-foreground' : 'text-foreground'}`}>{label}</p>
 <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
 </div>
 <button
 onClick={e => { e.stopPropagation(); if (!disabled) onChange() }}
 disabled={disabled}
 className={`relative h-6 w-11 shrink-0 rounded-full transition-all ${
 value ? 'bg-primary' : 'border border-border bg-secondary'
 } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
 aria-checked={value}
 role="switch"
 >
 <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full border border-border bg-card transition-transform ${value ? 'translate-x-5' : ''}`} />
 </button>
 </div>
 )
}

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
 return (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-background/60 backdrop-blur-sm"
 onClick={onClose}>
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
 className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-card border border-border rounded-lg shadow-2xl p-4 sm:p-6"
 onClick={e => e.stopPropagation()}
 >
 {children}
 </motion.div>
 </div>
 )
}


