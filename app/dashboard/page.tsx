'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Flame, Zap, Code2, Trophy, Target, Calendar, Copy, Check,
  TrendingUp, BarChart3, Globe2, FolderGit2, ChevronDown, Plus, X,
  Loader2, ArrowRight, ExternalLink, Eye, EyeOff, Info
} from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────
interface StatsData {
  totalHours: number
  activeDays: number
  avgDailyHours: number
  currentStreak: number
  longestStreak: number
  totalSessions: number
  uniqueLanguages: number
  hoursToday: number
  maxDayHours: number
  productivityScore: number
  topLanguages: { language: string; hours: number; percentage: number }[]
  weeklyBreakdown: number[]
  projects: { hash: string; name: string | null; hours: number; percentage: number }[]
}

interface ContributionDay {
  hours: number
  sessions: number
  level: number
}

interface GoalData {
  id: string
  type: string
  target: number
  targetDate: string | null
  current: number
  percentage: number
  achieved: boolean
  createdAt: string
}

// ─── Cache ───────────────────────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000 // 5 min
const cache: Record<string, { data: unknown; ts: number }> = {}

async function cachedFetch<T>(key: string, url: string, ttl = CACHE_TTL): Promise<T | null> {
  const now = Date.now()
  if (cache[key] && now - cache[key].ts < ttl) return cache[key].data as T
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    cache[key] = { data, ts: now }
    return data as T
  } catch { return null }
}

function invalidateCache(key?: string) {
  if (key) delete cache[key]
  else Object.keys(cache).forEach(k => delete cache[k])
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const LANGUAGE_COLORS: Record<string, string> = {
  typescript: '#3178c6', javascript: '#f7df1e', python: '#3572A5', rust: '#dea584',
  go: '#00ADD8', java: '#b07219', cpp: '#f34b7d', c: '#555555', csharp: '#239120',
  ruby: '#CC342D', php: '#4F5D95', swift: '#FA7343', kotlin: '#A97BFF',
  html: '#e34c26', css: '#563d7c', scss: '#c6538c', vue: '#41b883',
  svelte: '#ff3e00', dart: '#00B4AB', lua: '#000080', shell: '#89e051',
  markdown: '#083fa1', json: '#292929', yaml: '#cb171e', sql: '#e38c00',
  graphql: '#e10098', dockerfile: '#384d54', typescriptreact: '#3178c6',
  javascriptreact: '#f7df1e',
}

function getLangColor(lang: string): string {
  return LANGUAGE_COLORS[lang.toLowerCase()] || '#6366f1'
}

function formatHours(h: number): string {
  if (h < 0.1) return '0 minutes'
  if (h < 1) return `${Math.round(h * 60)} minutes`
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (mins > 0 && hrs > 0) return `${hrs} hours ${mins} minutes`
  if (hrs > 0) return `${hrs} hours`
  return `${mins} minutes`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Data
  const [stats, setStats] = useState<StatsData | null>(null)
  const [contributions, setContributions] = useState<Record<string, ContributionDay>>({})
  const [goals, setGoals] = useState<GoalData[]>([])
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean; hasApiKey: boolean; hasActivity: boolean
  }>({ connected: false, hasApiKey: false, hasActivity: false })

  // UI state
  const [loading, setLoading] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [contributionDays, setContributionDays] = useState(365)
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [newGoalType, setNewGoalType] = useState('daily_hours')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [newGoalDate, setNewGoalDate] = useState('')
  const [goalSaving, setGoalSaving] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<{ date: string; hours: number; sessions: number; x: number; y: number } | null>(null)

  const hasFetched = useRef(false)

  // ─── Data fetching with caching ────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)

    const [statsData, contribData, goalsData, keyData, connData] = await Promise.all([
      cachedFetch<StatsData>('stats', '/api/stats/overview'),
      cachedFetch<{ contributions: Record<string, ContributionDay> }>('contributions', `/api/contributions?days=${contributionDays}`),
      cachedFetch<{ goals: GoalData[] }>('goals', '/api/goals'),
      cachedFetch<{ apiKey: string | null }>('apikey', '/api/apikey'),
      cachedFetch<{ connected: boolean; hasApiKey: boolean; hasActivity: boolean }>('connection', '/api/connection-status'),
    ])

    if (statsData) setStats(statsData)
    if (contribData?.contributions) setContributions(contribData.contributions)
    if (goalsData?.goals) setGoals(goalsData.goals)
    if (keyData) setApiKey(keyData.apiKey)
    if (connData) setConnectionStatus(connData)

    setLoading(false)
  }, [session, contributionDays])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session?.user && !hasFetched.current) {
      hasFetched.current = true
      fetchAllData()
    }
  }, [session, fetchAllData])

  // Re-fetch contributions when filter changes (invalidate that cache key)
  useEffect(() => {
    if (hasFetched.current) {
      invalidateCache('contributions')
      cachedFetch<{ contributions: Record<string, ContributionDay> }>('contributions', `/api/contributions?days=${contributionDays}`)
        .then(d => { if (d?.contributions) setContributions(d.contributions) })
    }
  }, [contributionDays])

  // ─── Goal handlers ─────────────────────────────────────────────────────────
  const createGoal = async () => {
    if (!newGoalTarget || parseFloat(newGoalTarget) <= 0) return
    setGoalSaving(true)
    try {
      const body: Record<string, unknown> = { type: newGoalType, target: newGoalTarget }
      if (newGoalDate) body.targetDate = newGoalDate
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        invalidateCache('goals')
        const goalsData = await cachedFetch<{ goals: GoalData[] }>('goals', '/api/goals')
        if (goalsData?.goals) setGoals(goalsData.goals)
        setShowNewGoal(false)
        setNewGoalTarget('')
        setNewGoalDate('')
      }
    } catch { /* ignore */ }
    setGoalSaving(false)
  }

  const deleteGoal = async (id: string) => {
    try {
      await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
      invalidateCache('goals')
      setGoals(prev => prev.filter(g => g.id !== id))
    } catch { /* ignore */ }
  }

  // ─── Copy API key ──────────────────────────────────────────────────────────
  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  // ─── Contribution grid ────────────────────────────────────────────────────
  const contributionGrid = useMemo(() => {
    const weeks: { date: string; hours: number; sessions: number; level: number }[][] = []
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() - (Math.ceil(contributionDays / 7) - 1) * 7)

    const totalWeeks = Math.ceil(contributionDays / 7)
    for (let w = 0; w < totalWeeks; w++) {
      const week: typeof weeks[0] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + w * 7 + d)
        if (date > today) { week.push({ date: '', hours: 0, sessions: 0, level: -1 }); continue }
        const dateStr = date.toISOString().split('T')[0]
        const c = contributions[dateStr]
        const hours = c?.hours || 0
        const sessions = c?.sessions || 0
        let level = 0
        if (hours > 0) level = 1
        if (hours >= 1) level = 2
        if (hours >= 3) level = 3
        if (hours >= 5) level = 4
        week.push({ date: dateStr, hours, sessions, level })
      }
      weeks.push(week)
    }
    return weeks
  }, [contributions, contributionDays])

  // 30-day coding trend for AreaChart
  const trendData = useMemo(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const c = contributions[dateStr]
      days.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: parseFloat((c?.hours || 0).toFixed(2)),
      })
    }
    return days
  }, [contributions])

  // Language donut data
  const langPieData = useMemo(() => (
    (stats?.topLanguages || []).slice(0, 6).map(l => ({
      name: l.language,
      value: parseFloat(l.hours.toFixed(2)),
      percentage: l.percentage,
      fill: getLangColor(l.language),
    }))
  ), [stats])

  // Daily hours bar chart (last 14 days)
  const dailyBarData = useMemo(() => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const c = contributions[dateStr]
      days.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        hours: parseFloat((c?.hours || 0).toFixed(2)),
        sessions: c?.sessions || 0,
      })
    }
    return days
  }, [contributions])

  // Productivity radar data
  const radarData = useMemo(() => {
    if (!stats) return []
    const hoursScore = Math.min((stats.hoursToday / 4) * 100, 100)
    const streakScore = Math.min((stats.currentStreak / 30) * 100, 100)
    const langScore = Math.min((stats.uniqueLanguages / 5) * 100, 100)
    const consistencyScore = Math.min(((stats.weeklyBreakdown?.filter(h => h > 0).length || 0) / 7) * 100, 100)
    const sessionScore = Math.min((stats.totalSessions / 50) * 100, 100)
    const projectScore = Math.min(((stats.projects?.length || 0) / 3) * 100, 100)
    return [
      { subject: 'Focus', value: hoursScore },
      { subject: 'Streak', value: streakScore },
      { subject: 'Languages', value: langScore },
      { subject: 'Consistency', value: consistencyScore },
      { subject: 'Sessions', value: sessionScore },
      { subject: 'Projects', value: projectScore },
    ]
  }, [stats])

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (status === 'loading' || (loading && !stats)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const levelColors = ['bg-gray-800/50', 'bg-blue-900/60', 'bg-blue-700/70', 'bg-blue-500/80', 'bg-blue-400']
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            {session.user?.image && (
              <img src={session.user.image} alt="" className="w-12 h-12 rounded-full ring-2 ring-blue-500/30" />
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Welcome back, <span className="bg-linear-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">{session.user?.name?.split(' ')[0] || 'Developer'}</span>
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {stats?.hoursToday ? `${formatHours(stats.hoursToday)} coded today` : 'Start coding to see your stats'}
              </p>
            </div>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              connectionStatus.connected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : connectionStatus.hasApiKey
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus.connected ? 'bg-emerald-400 animate-pulse' : connectionStatus.hasApiKey ? 'bg-yellow-400' : 'bg-gray-600'
              }`} />
              {connectionStatus.connected ? 'VS Code Connected' : connectionStatus.hasApiKey ? 'VS Code Idle' : 'Not Connected'}
            </div>
            <Link href="/settings" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Settings
            </Link>
          </div>
        </motion.div>

        {/* API Key Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div
            className="bg-linear-to-r from-gray-900 to-gray-900/80 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-blue-500/30 transition-all group"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-200">API Key</h3>
                  <p className="text-xs text-gray-500">
                    {apiKey ? 'Click to view • Used by VS Code extension to send heartbeats' : 'No key generated — go to Settings to create one'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {apiKey && (
                  <button
                    onClick={(e) => { e.stopPropagation(); copyApiKey() }}
                    className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                )}
                {showApiKey ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
              </div>
            </div>
            <AnimatePresence>
              {showApiKey && apiKey && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <code className="text-xs font-mono text-blue-300 break-all select-all">{apiKey}</code>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
                      <span className="bg-gray-800 px-2 py-0.5 rounded">1. Copy this key</span>
                      <span className="bg-gray-800 px-2 py-0.5 rounded">2. Open VS Code → Ctrl+Shift+P → "VS Integrate: Set API Key"</span>
                      <span className="bg-gray-800 px-2 py-0.5 rounded">3. Paste key → tracking starts automatically</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'Total Hours', value: formatHours(stats?.totalHours || 0), icon: Clock, color: 'blue', sub: `${stats?.activeDays || 0} active days` },
            { label: 'Current Streak', value: `${stats?.currentStreak || 0}d`, icon: Flame, color: 'orange', sub: `Best: ${stats?.longestStreak || 0}d` },
            { label: 'Today', value: formatHours(stats?.hoursToday || 0), icon: Zap, color: 'emerald', sub: `Score: ${stats?.productivityScore || 0}/100` },
            { label: 'Languages', value: `${stats?.uniqueLanguages || 0}`, icon: Globe2, color: 'violet', sub: `${stats?.totalSessions || 0} sessions` },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`group relative bg-gray-900/80 border border-gray-800 rounded-xl p-4 sm:p-5 hover:border-${stat.color}-500/30 transition-all overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-${stat.color}-500/5 rounded-full -translate-y-1/2 translate-x-1/2`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</span>
                  <stat.icon className={`w-4 h-4 text-${stat.color}-400 opacity-60`} />
                </div>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-gray-600 mt-1">{stat.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contribution Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 sm:p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold">Contribution Graph</h2>
              <p className="text-xs text-gray-500 mt-0.5">{stats?.activeDays || 0} active days in the selected period</p>
            </div>
            {/* Filter bar */}
            <div className="flex items-center gap-2">
              {[
                { label: '1M', days: 30 },
                { label: '3M', days: 90 },
                { label: '6M', days: 180 },
                { label: '1Y', days: 365 },
              ].map(f => (
                <button
                  key={f.label}
                  onClick={() => setContributionDays(f.days)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    contributionDays === f.days
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-800/50 text-gray-500 border border-gray-800 hover:text-gray-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="flex gap-0.75 overflow-x-auto pb-2 scrollbar-thin">
              {/* Day labels */}
              <div className="flex flex-col gap-0.75 mr-1 shrink-0">
                {dayLabels.map((label, i) => (
                  <div key={i} className="h-3.25 flex items-center justify-end pr-1">
                    <span className="text-[10px] text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
              {/* Grid */}
              {contributionGrid.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.75">
                  {week.map((day, di) => (
                    <div
                      key={`${wi}-${di}`}
                      className={`w-3.25 h-3.25 rounded-[2px] transition-all cursor-pointer ${
                        day.level < 0 ? 'opacity-0' : day.level === 0 ? 'bg-gray-800/50 hover:bg-gray-700/50' : levelColors[day.level]
                      } hover:ring-1 hover:ring-blue-400/50 hover:scale-125`}
                      onMouseEnter={(e) => {
                        if (day.level < 0 || !day.date) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        setHoveredDay({ date: day.date, hours: day.hours, sessions: day.sessions, x: rect.left, y: rect.top })
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredDay && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="fixed z-50 pointer-events-none"
                  style={{ left: hoveredDay.x - 40, top: hoveredDay.y - 70 }}
                >
                  <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl shadow-black/50">
                    <p className="text-xs font-semibold text-white">
                      {formatHours(hoveredDay.hours)} on {formatDate(hoveredDay.date)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {hoveredDay.sessions} session{hoveredDay.sessions !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-gray-900 border-b border-r border-gray-700 rotate-45 mx-auto -mt-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-600">
            <span>Less</span>
            {levelColors.map((c, i) => (
              <div key={i} className={`w-3.25 h-3.25 rounded-[2px] ${c}`} />
            ))}
            <span>More</span>
          </div>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Languages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-gray-900/80 border border-gray-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Top Languages
              </h2>
              <span className="text-xs text-gray-600">{stats?.uniqueLanguages || 0} total</span>
            </div>

            {stats?.topLanguages && stats.topLanguages.length > 0 ? (
              <div className="space-y-3">
                {stats.topLanguages.map((lang, i) => (
                  <div key={lang.language} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getLangColor(lang.language) }} />
                        <span className="text-sm text-gray-200 capitalize">{lang.language}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatHours(lang.hours)} ({lang.percentage}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${lang.percentage}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: getLangColor(lang.language) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Code2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No language data yet</p>
                <p className="text-xs mt-1">Start coding with VS Code connected</p>
              </div>
            )}
          </motion.div>

          {/* Project Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900/80 border border-gray-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-violet-400" />
                Project Breakdown
              </h2>
            </div>

            {stats?.projects && stats.projects.length > 0 ? (
              <div className="space-y-3">
                {stats.projects.map((project, i) => (
                  <div key={project.hash} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <FolderGit2 className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-200 truncate">
                          {project.name || `Project ${project.hash.slice(0, 8)}`}
                        </span>
                        <span className="text-xs text-gray-500 shrink-0 ml-2">{formatHours(project.hours)}</span>
                      </div>
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.percentage}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                          className="h-full rounded-full bg-linear-to-r from-violet-500 to-purple-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <FolderGit2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No project data yet</p>
                <p className="text-xs mt-1">Open projects in VS Code to track them</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 mb-8"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Weekly Activity
          </h2>
          <div className="flex items-end gap-2 sm:gap-4 h-40">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
              const hours = stats?.weeklyBreakdown?.[i] || 0
              const maxH = Math.max(...(stats?.weeklyBreakdown || [0]), 1)
              const pct = (hours / maxH) * 100
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500 mb-1">{formatHours(hours)}</span>
                  <div className="w-full bg-gray-800/50 rounded-t-lg relative" style={{ height: '120px' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ delay: 0.6 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                      className="absolute bottom-0 w-full rounded-t-lg bg-linear-to-t from-blue-600/80 to-blue-400/60"
                    />
                  </div>
                  <span className="text-[10px] text-gray-600">{day}</span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Charts Row — 30-day Trend + Language Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* 30-Day Coding Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-3 bg-gray-900/80 border border-gray-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                30-Day Coding Trend
              </h2>
              <span className="text-xs text-gray-600">
                {trendData.reduce((s, d) => s + d.hours, 0).toFixed(1)}h total
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#4b5563', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#1f2937' }}
                  interval={6}
                />
                <YAxis
                  tick={{ fill: '#4b5563', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}h`}
                />
                <ReTooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: '#e5e7eb', fontSize: '12px' }}
                  formatter={(v: number) => [`${v}h`, 'Hours']}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#3b82f6"
                  fill="url(#trendGrad)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Language Distribution Donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="lg:col-span-2 bg-gray-900/80 border border-gray-800 rounded-xl p-5"
          >
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-violet-400" />
              Language Mix
            </h2>
            {langPieData.length > 0 ? (
              <div className="flex flex-col items-center gap-3">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={langPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={62}
                      paddingAngle={3}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {langPieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} opacity={0.85} />
                      ))}
                    </Pie>
                    <ReTooltip
                      contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(v: number, _: string, p) => [`${v}h (${p.payload.percentage}%)`, p.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full">
                  {langPieData.map(l => (
                    <div key={l.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.fill }} />
                      <span className="text-[10px] text-gray-400 truncate capitalize">{l.name}</span>
                      <span className="text-[10px] text-gray-600 ml-auto">{l.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-600">
                <Globe2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No language data yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Daily Hours Bar Chart + Productivity Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Hours (14 days) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-900/80 border border-gray-800 rounded-xl p-5"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Daily Hours (Last 14 Days)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyBarData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#4b5563', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#1f2937' }}
                  interval={1}
                />
                <YAxis
                  tick={{ fill: '#4b5563', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}h`}
                />
                <ReTooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: '#e5e7eb', fontSize: '12px' }}
                  formatter={(v: number) => [`${v}h`, 'Hours']}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="hours" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Productivity Radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="bg-gray-900/80 border border-gray-800 rounded-xl p-5"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Productivity Breakdown
            </h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#1f2937" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-gray-600">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No data yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Goals Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Goals
            </h2>
            <button
              onClick={() => setShowNewGoal(!showNewGoal)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
            >
              <Plus className="w-3 h-3" /> New Goal
            </button>
          </div>

          {/* New Goal Form */}
          <AnimatePresence>
            {showNewGoal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Type</label>
                      <select
                        value={newGoalType}
                        onChange={(e) => setNewGoalType(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-200 outline-none"
                      >
                        <option value="daily_hours">Daily Hours</option>
                        <option value="weekly_hours">Weekly Hours</option>
                        <option value="streak_days">Streak Days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Target</label>
                      <input
                        type="number"
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(e.target.value)}
                        placeholder={newGoalType === 'daily_hours' ? '4' : newGoalType === 'weekly_hours' ? '20' : '7'}
                        min="0.5"
                        step="0.5"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date (optional)</label>
                      <input
                        type="date"
                        value={newGoalDate}
                        onChange={(e) => setNewGoalDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-200 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Info className="w-3 h-3" />
                    Pick a date to set a goal for that specific day. Leave blank for a recurring goal. An email will be sent when achieved.
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowNewGoal(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
                    <button
                      onClick={createGoal}
                      disabled={goalSaving || !newGoalTarget}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      {goalSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Create Goal
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Goals List */}
          {goals.length > 0 ? (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`relative bg-gray-800/30 border rounded-lg p-4 transition-all ${
                    goal.achieved ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {goal.achieved ? (
                        <Trophy className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Target className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm font-medium text-gray-200">
                        {goal.type === 'daily_hours' ? 'Daily Hours' : goal.type === 'weekly_hours' ? 'Weekly Hours' : 'Streak'}: {goal.target}{goal.type.includes('hours') ? 'h' : 'd'}
                      </span>
                      {goal.targetDate && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                          {formatDate(goal.targetDate)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${goal.achieved ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {goal.current}/{goal.target} ({goal.percentage}%)
                      </span>
                      <button onClick={() => deleteGoal(goal.id)} className="p-1 hover:bg-gray-700 rounded transition-colors">
                        <X className="w-3 h-3 text-gray-600 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${goal.achieved ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    />
                  </div>
                  {goal.achieved && (
                    <p className="text-[10px] text-emerald-400/60 mt-1.5">Goal achieved! Check your email for confirmation.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-600">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No active goals</p>
              <p className="text-xs mt-1">Set a goal to stay motivated</p>
            </div>
          )}
        </motion.div>

        {/* Productivity Score Circle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-gray-900/80 border border-gray-800 rounded-xl p-5"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Productivity Score
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score ring */}
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#1f2937" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke={
                    (stats?.productivityScore || 0) >= 75 ? '#22c55e' :
                    (stats?.productivityScore || 0) >= 50 ? '#3b82f6' :
                    (stats?.productivityScore || 0) >= 25 ? '#f59e0b' : '#ef4444'
                  }
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - (stats?.productivityScore || 0) / 100) }}
                  transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{stats?.productivityScore || 0}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {[
                { label: 'Hours Today', value: `${formatHours(stats?.hoursToday || 0)} / 4h`, pct: Math.min(100, ((stats?.hoursToday || 0) / 4) * 100), color: 'bg-blue-500' },
                { label: 'Streak Bonus', value: `${stats?.currentStreak || 0} / 30 days`, pct: Math.min(100, ((stats?.currentStreak || 0) / 30) * 100), color: 'bg-orange-500' },
                { label: 'Consistency', value: 'This week', pct: Math.min(100, ((stats?.weeklyBreakdown?.filter(h => h > 0).length || 0) / 7) * 100), color: 'bg-emerald-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-gray-500">{item.value}</span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ delay: 1, duration: 0.8 }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
