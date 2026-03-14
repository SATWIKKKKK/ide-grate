'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Flame, Zap, Code2, Trophy, Target, Calendar, Copy, Check,
  TrendingUp, BarChart3, Globe2, FolderGit2, ChevronDown, Plus, X,
  Loader2, ArrowRight, ExternalLink, Eye, EyeOff, Info, Timer, WifiOff
} from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
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
  projects: { hash: string; name: string | null; hours: number; percentage: number; repoUrl?: string | null }[]
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

interface AchievementData {
  id: string
  icon: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt: string | null
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
  sql: '#e38c00', graphql: '#e10098', dockerfile: '#384d54',
  typescriptreact: '#3178c6', javascriptreact: '#f7df1e',
  r: '#198CE7', scala: '#c22d40', elixir: '#6e4a7e', haskell: '#5e5086',
  perl: '#0298c3', objective_c: '#438eff', powershell: '#012456',
}

function getLangColor(lang: string): string {
  return LANGUAGE_COLORS[lang.toLowerCase()] || '#6366f1'
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatHours(h: number): string {
  if (h <= 0) return '0 minutes'
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} minutes`
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (mins > 0 && hrs > 0) return `${hrs} hours ${mins} minutes`
  if (hrs > 0) return `${hrs} hours`
  return `${mins} minutes`
}

function formatHoursShort(h: number): string {
  if (h <= 0) return '0m'
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`
  if (hrs > 0) return `${hrs}h`
  return `${mins}m`
}

function getContributionLevel(hours: number): number {
  if (hours <= 0) return 0
  if (hours < 0.25) return 1
  if (hours < 1) return 2
  if (hours < 3) return 3
  return 4
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
  const contributionApiUrl = '/api/contributions?days=365'
  const liveTimerStorageKey = `vsintegrate-live-start-${session?.user?.id || 'anonymous'}`

  // Data
  const [stats, setStats] = useState<StatsData | null>(null)
  const [contributions, setContributions] = useState<Record<string, ContributionDay>>({})
  const [goals, setGoals] = useState<GoalData[]>([])
  const [achievements, setAchievements] = useState<AchievementData[]>([])
  const [totalUnlockedAchievements, setTotalUnlockedAchievements] = useState(0)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean; hasApiKey: boolean; hasActivity: boolean; lastActivityAt?: string | null
  }>({ connected: false, hasApiKey: false, hasActivity: false, lastActivityAt: null })
  const [connectionReady, setConnectionReady] = useState(false)

  // UI state
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [contributionDays, setContributionDays] = useState(365)
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [newGoalType, setNewGoalType] = useState('daily_hours')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [newGoalDate, setNewGoalDate] = useState('')
  const [goalSaving, setGoalSaving] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<{ date: string; hours: number; sessions: number; x: number; y: number } | null>(null)

  const [connectionToast, setConnectionToast] = useState<{ show: boolean; message: string; type: 'success' | 'warning' | 'info' } | null>(null)
  const [timerFilter, setTimerFilter] = useState<'7d' | '1m' | '3m'>('7d')
  const [liveSeconds, setLiveSeconds] = useState(0)
  const [activeStatPopup, setActiveStatPopup] = useState<string | null>(null)
  const [dailyBarFilter, setDailyBarFilter] = useState<'7d' | '14d' | '1m' | '3m' | '1y'>('14d')
  const hasFetched = useRef(false)
  const prevConnected = useRef<boolean | null>(null)
  const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

  // ─── Data fetching with caching ────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)

    const [statsData, contribData, goalsData, achievementsData, keyData, connData] = await Promise.all([
      cachedFetch<StatsData>('stats', '/api/stats/overview'),
      cachedFetch<{ contributions: Record<string, ContributionDay> }>('contributions', contributionApiUrl),
      cachedFetch<{ goals: GoalData[] }>('goals', '/api/goals'),
      cachedFetch<{ achievements: AchievementData[]; totalUnlocked: number }>('achievements', '/api/achievements'),
      cachedFetch<{ apiKey: string | null }>('apikey', '/api/apikey'),
      cachedFetch<{ connected: boolean; hasApiKey: boolean; hasActivity: boolean; lastActivityAt?: string | null }>('connection', '/api/connection-status'),
    ])

    if (statsData) setStats(statsData)
    if (contribData?.contributions) setContributions(contribData.contributions)
    if (goalsData?.goals) setGoals(goalsData.goals)
    if (achievementsData?.achievements) {
      setAchievements(achievementsData.achievements)
      setTotalUnlockedAchievements(achievementsData.totalUnlocked || 0)
    }
    if (keyData) setApiKey(keyData.apiKey)
    if (connData) {
      setConnectionStatus(connData)
      setConnectionReady(true)
    }

    setLoading(false)
  }, [session, contributionApiUrl])

  // Poll connection status every 15s + refresh stats every ~60s when connected
  useEffect(() => {
    if (!session?.user) return
    let pollCount = 0
    const poll = async () => {
      try {
        const res = await fetch('/api/connection-status')
        if (res.ok) {
          const data = await res.json()
          setConnectionStatus(data)
          setConnectionReady(true)
          // Show toast on status change
          if (prevConnected.current !== null && prevConnected.current !== data.connected) {
            setConnectionToast({
              show: true,
              message: data.connected
                ? 'VS Code is now connected and tracking!'
                : data.hasApiKey
                  ? '🔴 VS Code disconnected — reconnect to continue tracking'
                  : '🔴 API key disconnected — reconnect VS Code tracking',
              type: data.connected ? 'success' : 'warning',
            })
            setTimeout(() => setConnectionToast(null), 5000)
          }
          // Refresh stats + contributions immediately on reconnect, or every 4th poll when connected
          const justReconnected = prevConnected.current === false && data.connected
          prevConnected.current = data.connected
          pollCount++
          if (justReconnected || (pollCount % 4 === 0 && data.connected)) {
            invalidateCache('stats')
            invalidateCache('contributions')
            invalidateCache('achievements')
            const [freshStats, freshContrib, freshAchievements] = await Promise.all([
              cachedFetch<StatsData>('stats', '/api/stats/overview'),
              cachedFetch<{ contributions: Record<string, ContributionDay> }>('contributions', contributionApiUrl),
              cachedFetch<{ achievements: AchievementData[]; totalUnlocked: number }>('achievements', '/api/achievements'),
            ])
            if (freshStats) setStats(freshStats)
            if (freshContrib?.contributions) setContributions(freshContrib.contributions)
            if (freshAchievements?.achievements) {
              setAchievements(freshAchievements.achievements)
              setTotalUnlockedAchievements(freshAchievements.totalUnlocked || 0)
            }
          }
        }
      } catch { /* ignore */ }
    }
    const interval = setInterval(poll, 15000)
    return () => clearInterval(interval)
  }, [session, contributionApiUrl])

  // Live session timer (current session elapsed time — resets on disconnect/reconnect)
  useEffect(() => {
    if (!connectionReady) return

    if (connectionStatus.connected) {
      if (!sessionStartRef.current) {
        const savedStart = typeof window !== 'undefined' ? localStorage.getItem(liveTimerStorageKey) : null
        let start = savedStart ? new Date(savedStart) : null

        if (!start || Number.isNaN(start.getTime())) {
          const fallback = connectionStatus.lastActivityAt ? new Date(connectionStatus.lastActivityAt) : new Date()
          start = Number.isNaN(fallback.getTime()) ? new Date() : fallback
          if (typeof window !== 'undefined') {
            localStorage.setItem(liveTimerStorageKey, start.toISOString())
          }
        }

        sessionStartRef.current = start
        setLiveSeconds(Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000)))
      }

      if (liveTimerRef.current) clearInterval(liveTimerRef.current)
      liveTimerRef.current = setInterval(() => {
        setLiveSeconds(Math.floor((Date.now() - sessionStartRef.current!.getTime()) / 1000))
      }, 1000)
    } else {
      if (liveTimerRef.current) {
        clearInterval(liveTimerRef.current)
        liveTimerRef.current = null
      }
      if (!connectionStatus.hasApiKey) {
        sessionStartRef.current = null
        setLiveSeconds(0)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(liveTimerStorageKey)
        }
      }
    }
    return () => {
      if (liveTimerRef.current) {
        clearInterval(liveTimerRef.current)
        liveTimerRef.current = null
      }
    }
  }, [connectionReady, connectionStatus.connected, connectionStatus.hasApiKey, connectionStatus.lastActivityAt, liveTimerStorageKey])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (session?.user && !hasFetched.current) {
      hasFetched.current = true
      fetchAllData()
    }
  }, [session, fetchAllData])

  const disconnectTracking = async () => {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/apikey', { method: 'DELETE' })
      if (res.ok) {
        setApiKey(null)
        setConnectionStatus(prev => ({ ...prev, connected: false, hasApiKey: false }))
        setConnectionReady(true)
        sessionStartRef.current = null
        setLiveSeconds(0)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(liveTimerStorageKey)
        }
        setConnectionToast({
          show: true,
          message: ' Tracking disconnected. Reconnect API key in VS Code to resume tracking.',
          type: 'warning',
        })
        setTimeout(() => setConnectionToast(null), 5000)
      }
    } catch {
      setConnectionToast({
        show: true,
        message: 'Failed to disconnect. Please try again.',
        type: 'warning',
      })
      setTimeout(() => setConnectionToast(null), 4000)
    }
    setDisconnecting(false)
  }

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

  // Today's date key for contribution lookups
  const todayKey = new Date().toISOString().split('T')[0]

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
        const level = getContributionLevel(hours)
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
      const hours = c?.hours || 0
      days.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: parseFloat(hours.toFixed(2)),
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

  // Daily hours bar chart (dynamic period)
  const dailyBarDays = dailyBarFilter === '7d' ? 7 : dailyBarFilter === '14d' ? 14 : dailyBarFilter === '1m' ? 30 : dailyBarFilter === '3m' ? 90 : 365
  const dailyBarData = useMemo(() => {
    const days = []
    for (let i = dailyBarDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const c = contributions[dateStr]
      const hours = c?.hours || 0
      // For longer ranges, use shorter date format
      const dateLabel = dailyBarDays <= 14
        ? d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
        : dailyBarDays <= 30
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      days.push({
        date: dateLabel,
        hours: parseFloat(hours.toFixed(2)),
        sessions: c?.sessions || 0,
      })
    }
    return days
  }, [contributions, dailyBarDays])

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

  // Period VS Code hours for timer section
  const periodHours = useMemo(() => {
    const now = new Date()
    const sumDays = (days: number) => {
      let total = 0
      for (let i = 0; i < days; i++) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        const key = d.toISOString().split('T')[0]
        total += contributions[key]?.hours || 0
      }
      return total
    }
    return { '7d': sumDays(7), '1m': sumDays(30), '3m': sumDays(90) }
  }, [contributions])

  // Period hours use server data only (accurate active-time tracking)
  const periodHoursDisplay = periodHours

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

      {/* Connection status toast */}
      <AnimatePresence>
        {connectionToast?.show && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border shadow-lg backdrop-blur-md text-sm font-medium ${
              connectionToast.type === 'success'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {connectionToast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 md:mt-16 w-full sm:w-auto">
            {session.user?.image && (
              <img src={session.user.image} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-2 ring-blue-500/30 mt-1 shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
                Welcome back, <span className="text-emerald-400">{session.user?.name?.split(' ')[0] || 'Developer'}</span>
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">
                {stats?.hoursToday ? `${formatHours(stats.hoursToday)} coded today` : 'Start coding to see your stats'}
              </p>
            </div>
          </div>

          {/* Connection status */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <div
              className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium cursor-default ${
                connectionStatus.connected
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
              title={
                connectionStatus.connected
                  ? 'VS Code is actively sending heartbeats'
                  : connectionStatus.hasApiKey
                    ? 'VS Code disconnected — reconnect to continue tracking'
                    : 'No API key yet — generate one to start tracking'
              }
            >
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                connectionStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`} />
              {connectionStatus.connected ? 'Connected' : 'Disconnected'}
            </div>
            {apiKey && connectionStatus.connected && (
              <button
                onClick={disconnectTracking}
                disabled={disconnecting}
                className="px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-60"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            )}
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
                    {apiKey ? 'Click to view • Used by VS Code extension to send heartbeats' : 'No key generated — click to create one'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {apiKey && (
                  <button
                    onClick={(e) => { e.stopPropagation(); copyApiKey() }}
                    className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-blue-400" /> : <Copy className="w-4 h-4 text-gray-500" />}
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

        {/* VS Code Live Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className={`rounded-xl border transition-all overflow-hidden ${
            connectionStatus.connected
              ? 'bg-linear-to-br from-blue-950/40 to-blue-900/20 border-blue-500/30'
              : 'bg-gray-900/80 border-gray-800'
          }`}>
            {/* Connected banner */}
            {connectionStatus.connected && (
              <div className="bg-blue-500/10 border-b border-blue-500/20 px-5 py-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-xs text-blue-400 font-medium">
                  Connected since {sessionStartRef.current ? sessionStartRef.current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
                  {sessionStartRef.current && (
                    <span className="text-blue-500/60 ml-1">
                      — {sessionStartRef.current.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {/* Timer display */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                    connectionStatus.connected
                      ? 'bg-blue-500/20 ring-2 ring-blue-500/30'
                      : 'bg-gray-800'
                  }`}>
                    {connectionStatus.connected
                      ? <Timer className="w-7 h-7 text-blue-400" />
                      : <WifiOff className="w-7 h-7 text-gray-600" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Current Session</span>
                      {connectionStatus.connected && (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25 font-semibold">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className={`text-5xl font-mono font-bold tracking-tight tabular-nums ${
                      connectionStatus.connected ? 'text-emerald-400' : 'text-gray-700'
                    }`}>
                      {connectionStatus.connected ? formatTimer(liveSeconds) : '0:00:00'}
                    </p>
                    <p className="text-xs mt-1">
                      {connectionStatus.connected
                        ? <span className="text-emerald-400/70">Session time • Today&apos;s total: {formatHours(stats?.hoursToday || 0)}</span>
                        : connectionStatus.hasApiKey
                          ? <span className="text-red-400/80">Disconnected. Reconnect VS Code to resume tracking.</span>
                          : <span className="text-red-400/80">Generate API key and reconnect to start VS Code tracking.</span>}
                    </p>
                  </div>
                </div>

                {/* Period filter */}
                <div className="flex items-center bg-gray-800/80 rounded-xl p-1 gap-0.5 shrink-0">
                  {([
                    { key: '7d' as const, label: '7 Days' },
                    { key: '1m' as const, label: '1 Month' },
                    { key: '3m' as const, label: '3 Months' },
                  ]).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setTimerFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                        timerFilter === f.key
                          ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period summary cards */}
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                <div className={`rounded-lg p-3 text-center border ${
                  connectionStatus.connected ? 'bg-blue-900/20 border-blue-500/15' : 'bg-gray-800/50 border-gray-800'
                }`}>
                  <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">
                    {timerFilter === '7d' ? 'Last 7 Days' : timerFilter === '1m' ? 'Last 30 Days' : 'Last 90 Days'}
                  </p>
                  <p className={`text-lg sm:text-xl font-bold ${connectionStatus.connected ? 'text-blue-300' : 'text-white'}`}>
                    {formatHours(periodHoursDisplay[timerFilter])}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">total in VS Code</p>
                </div>
                <div className={`rounded-lg p-3 text-center border ${
                  connectionStatus.connected ? 'bg-blue-900/20 border-blue-500/15' : 'bg-gray-800/50 border-gray-800'
                }`}>
                  <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Daily Avg</p>
                  <p className={`text-lg sm:text-xl font-bold ${connectionStatus.connected ? 'text-blue-400' : 'text-blue-400'}`}>
                    {formatHours(periodHoursDisplay[timerFilter] / (timerFilter === '7d' ? 7 : timerFilter === '1m' ? 30 : 90))}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">per day</p>
                </div>
                <div className={`rounded-lg p-3 text-center border ${
                  connectionStatus.connected ? 'bg-blue-900/20 border-blue-500/15' : 'bg-gray-800/50 border-gray-800'
                }`}>
                  <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Today</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-400">{formatHours(stats?.hoursToday || 0)}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">coded today</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { key: 'totalHours', label: 'Total Hours', value: formatHours(stats?.totalHours || 0), icon: Clock, color: 'blue', sub: `${stats?.activeDays || 0} active days` },
            { key: 'streak', label: 'Current Streak', value: `${stats?.currentStreak || 0}d`, icon: Flame, color: 'orange', sub: `Best: ${stats?.longestStreak || 0}d` },
            { key: 'today', label: 'Today', value: formatHours(stats?.hoursToday || 0), icon: Zap, color: 'blue', sub: `Score: ${stats?.productivityScore || 0}/100` },
            { key: 'languages', label: 'Languages', value: `${stats?.uniqueLanguages || 0}`, icon: Globe2, color: 'violet', sub: `${stats?.totalSessions || 0} sessions` },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => setActiveStatPopup(stat.key)}
              className={`group relative bg-gray-900/80 border border-gray-800 rounded-xl p-4 sm:p-5 hover:border-${stat.color}-500/30 transition-all overflow-hidden cursor-pointer active:scale-[0.97]`}
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

        {/* Stat Popup Modals */}
        <AnimatePresence>
          {activeStatPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setActiveStatPopup(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Total Hours Popup */}
                {activeStatPopup === 'totalHours' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Total Hours</h3>
                          <p className="text-xs text-gray-500">All-time coding breakdown</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveStatPopup(null)} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">{formatHours(stats?.totalHours || 0)}</p>
                        <p className="text-xs text-gray-500 mt-1">Total Coded</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-blue-300">{stats?.activeDays || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Active Days</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Daily Average</span>
                        <span className="text-sm font-semibold">{formatHours(stats?.activeDays ? (stats?.totalHours || 0) / stats.activeDays : 0)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Last 7 Days</span>
                        <span className="text-sm font-semibold">{formatHours(periodHoursDisplay['7d'])}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Last 30 Days</span>
                        <span className="text-sm font-semibold">{formatHours(periodHoursDisplay['1m'])}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Last 90 Days</span>
                        <span className="text-sm font-semibold">{formatHours(periodHoursDisplay['3m'])}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Best Day</span>
                        <span className="text-sm font-semibold">{formatHours(stats?.maxDayHours || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Total Sessions</span>
                        <span className="text-sm font-semibold">{stats?.totalSessions || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Streak Popup */}
                {activeStatPopup === 'streak' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                          <Flame className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Streak Details</h3>
                          <p className="text-xs text-gray-500">Your coding consistency</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveStatPopup(null)} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-orange-400">{stats?.currentStreak || 0}<span className="text-lg">d</span></p>
                        <p className="text-xs text-gray-500 mt-1">Current Streak</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-yellow-400">{stats?.longestStreak || 0}<span className="text-lg">d</span></p>
                        <p className="text-xs text-gray-500 mt-1">Longest Streak</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Active Days</span>
                        <span className="text-sm font-semibold">{stats?.activeDays || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Coded Today</span>
                        <span className="text-sm font-semibold">{(stats?.hoursToday || 0) > 0 ? '✅ Yes' : '❌ Not yet'}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Productivity Score</span>
                        <span className="text-sm font-semibold">{stats?.productivityScore || 0}/100</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-4 text-center">Code at least once per day to keep your streak alive!</p>
                  </div>
                )}

                {/* Today Popup */}
                {activeStatPopup === 'today' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Today&apos;s Activity</h3>
                          <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveStatPopup(null)} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-5 text-center mb-4">
                      <p className="text-4xl font-bold text-blue-400">{formatHours(stats?.hoursToday || 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">Coded today</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Server-tracked</span>
                        <span className="text-sm font-semibold">{formatHours(stats?.hoursToday || 0)}</span>
                      </div>
                      {connectionStatus.connected && (
                        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                          <span className="text-sm text-gray-400">Current session</span>
                          <span className="text-sm font-semibold text-emerald-400">{formatTimer(liveSeconds)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Daily Average</span>
                        <span className="text-sm font-semibold">{formatHours(stats?.avgDailyHours || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Productivity Score</span>
                        <span className="text-sm font-semibold">{stats?.productivityScore || 0}/100</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-400">Best Day Ever</span>
                        <span className="text-sm font-semibold">{formatHours(stats?.maxDayHours || 0)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Languages Popup */}
                {activeStatPopup === 'languages' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                          <Globe2 className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Languages Used</h3>
                          <p className="text-xs text-gray-500">{stats?.uniqueLanguages || 0} languages across {stats?.totalSessions || 0} sessions</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveStatPopup(null)} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                    {stats?.topLanguages && stats.topLanguages.length > 0 ? (
                      <div className="space-y-3">
                        {stats.topLanguages.map((lang) => (
                          <div key={lang.language} className="p-3 bg-gray-800/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLangColor(lang.language) }} />
                                <span className="text-sm font-medium capitalize">{lang.language}</span>
                              </div>
                              <span className="text-xs text-gray-500">{formatHours(lang.hours)} ({lang.percentage}%)</span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${lang.percentage}%`, backgroundColor: getLangColor(lang.language) }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-600">
                        <Globe2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No language data yet</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                    contributionDays === f.days
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-800/50 text-gray-500 border border-gray-800 hover:text-gray-300 hover:border-gray-700'
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
                  <div
                    key={project.hash}
                    className={`flex items-center gap-3 rounded-lg p-2 -m-2 transition-colors ${project.repoUrl ? 'cursor-pointer hover:bg-blue-500/5' : ''}`}
                    onClick={() => {
                      if (project.repoUrl) window.open(project.repoUrl, '_blank', 'noopener,noreferrer')
                    }}
                    role={project.repoUrl ? 'button' : undefined}
                    tabIndex={project.repoUrl ? 0 : -1}
                    onKeyDown={(e) => {
                      if (!project.repoUrl) return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        window.open(project.repoUrl, '_blank', 'noopener,noreferrer')
                      }
                    }}
                    title={project.repoUrl ? 'Open GitHub repository' : undefined}
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <FolderGit2 className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {project.repoUrl ? (
                            <a
                              href={project.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 min-w-0"
                              onClick={e => e.stopPropagation()}
                            >
                              <span className="truncate">{project.name || `Project ${project.hash.slice(0, 8)}`}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-sm text-gray-200 truncate block" title={project.name || `Project ${project.hash.slice(0, 8)}`}>
                              {project.name || `Project ${project.hash.slice(0, 8)}`}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{formatHours(project.hours)}</span>
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
            <TrendingUp className="w-4 h-4 text-blue-400" />
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
                  tickFormatter={v => formatHoursShort(v)}
                />
                <ReTooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: '#e5e7eb', fontSize: '12px' }}
                  formatter={(v: number) => [formatHoursShort(v), 'Coded']}
                  labelStyle={{ color: '#9ca3af' }}
                  cursor={{ stroke: '#374151' }}
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
                      contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', fontSize: '11px', color: '#ffffff' }}
                      formatter={(v: number, _: string, p) => [`${v}h (${p.payload.percentage}%)`, p.payload.name]}
                      itemStyle={{ color: '#ffffff' }}
                      labelStyle={{ color: '#9ca3af' }}
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
          {/* Daily Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-900/80 border border-gray-800 rounded-xl p-5"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Daily Hours
              </h2>
              <div className="flex items-center gap-1 bg-gray-800/80 rounded-xl p-0.5">
                {([
                  { key: '7d' as const, label: '7D' },
                  { key: '14d' as const, label: '14D' },
                  { key: '1m' as const, label: '1M' },
                  { key: '3m' as const, label: '3M' },
                  { key: '1y' as const, label: '1Y' },
                ]).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setDailyBarFilter(f.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                      dailyBarFilter === f.key
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyBarData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#4b5563', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#1f2937' }}
                  interval={dailyBarDays <= 14 ? 1 : dailyBarDays <= 30 ? 3 : dailyBarDays <= 90 ? 13 : 29}
                />
                <YAxis
                  tick={{ fill: '#4b5563', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => formatHoursShort(v)}
                />
                <ReTooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: '#e5e7eb', fontSize: '12px' }}
                  formatter={(v: number) => [formatHoursShort(v), 'Coded']}
                  labelStyle={{ color: '#9ca3af' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 active:scale-95 transition-all"
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
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-1"
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
                    goal.achieved ? 'border-blue-500/30 bg-blue-500/5' : 'border-gray-800'
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
                      <span className={`text-xs ${goal.achieved ? 'text-blue-400' : 'text-gray-500'}`}>
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
                      className={`h-full rounded-full ${goal.achieved ? 'bg-blue-500' : 'bg-blue-500'}`}
                    />
                  </div>
                  {goal.achieved && (
                    <p className="text-[10px] text-blue-400/60 mt-1.5">Goal achieved! Check your email for confirmation.</p>
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

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 mb-8"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-blue-400" />
            Achievements
            <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full ml-auto">
              {totalUnlockedAchievements}/{achievements.length || 0} unlocked
            </span>
          </h2>

          {achievements.length > 0 ? (
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {achievements.map((achievement) => (
                  <Tooltip key={achievement.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`border rounded-xl p-3 text-center transition-all cursor-default ${
                          achievement.unlocked
                            ? 'bg-linear-to-br from-blue-500/20 to-blue-700/10 border-blue-500/30 hover:border-blue-400/50 hover:scale-105'
                            : 'bg-gray-800/30 border-gray-700/60 hover:border-gray-600 hover:scale-105'
                        }`}
                      >
                        <span className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-60'}`}>{achievement.icon}</span>
                        <p className={`text-xs font-medium mt-1.5 ${achievement.unlocked ? 'text-gray-100' : 'text-gray-400'}`}>
                          {achievement.title}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {achievement.unlocked
                            ? achievement.unlockedAt
                              ? formatDate(achievement.unlockedAt)
                              : 'Unlocked'
                            : 'Locked'}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] text-center">
                      <p className="font-semibold text-blue-300 mb-0.5">{achievement.title}</p>
                      <p className="text-gray-400">{achievement.unlocked ? '✅ ' : '🔒 How to earn: '}{achievement.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          ) : (
            <div className="text-center py-6 text-gray-600">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No achievements yet</p>
              <p className="text-xs mt-1">Keep coding to unlock your first badge</p>
            </div>
          )}
        </motion.div>

        {/* Rewards */}
        {goals.filter(g => g.achieved).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52 }}
            className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 mb-8"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Rewards
              <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full ml-auto">
                {goals.filter(g => g.achieved).length} earned
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {goals.filter(g => g.achieved).map((goal) => {
                const badge = goal.type === 'daily_hours'
                  ? { icon: '⏱️', label: `${goal.target}h Day`, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' }
                  : goal.type === 'weekly_hours'
                    ? { icon: '📅', label: `${goal.target}h Week`, color: 'from-violet-500/20 to-violet-600/10 border-violet-500/30' }
                    : { icon: '🔥', label: `${goal.target}d Streak`, color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30' }
                return (
                  <div key={goal.id} className={`bg-linear-to-br ${badge.color} border rounded-xl p-3 text-center`}>
                    <span className="text-2xl">{badge.icon}</span>
                    <p className="text-xs font-medium text-gray-200 mt-1.5">{badge.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {goal.targetDate ? formatDate(goal.targetDate) : 'Recurring'}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

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
                    (stats?.productivityScore || 0) >= 75 ? '#2563eb' :
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
                { label: 'Consistency', value: 'This week', pct: Math.min(100, ((stats?.weeklyBreakdown?.filter(h => h > 0).length || 0) / 7) * 100), color: 'bg-blue-500' },
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
