'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code2, TrendingUp, Clock, Calendar as CalendarIcon, Activity, Key, Copy,
  RefreshCw, Check, X, ExternalLink, CheckCircle2, AlertCircle, Loader2,
  ArrowRight, Info, Timer, BarChart3, Gauge, CalendarDays, Search,
  Trophy, Target, Flame, Star, Share2, Unplug, Plug
} from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { ACHIEVEMENTS } from '@/lib/achievements'

interface StatsOverview {
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
  achievementStats: any
}

interface GoalData {
  id: string
  type: string
  target: number
  current: number
  percentage: number
  achieved: boolean
}

interface AchievementData {
  id: string
  icon: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt: string | null
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState<string | null | undefined>(undefined)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [dateActivities, setDateActivities] = useState<any[] | null>(null)
  const [dateLoading, setDateLoading] = useState(false)
  const [contributions, setContributions] = useState<Record<string, number>>({})
  const [achievements, setAchievements] = useState<AchievementData[]>([])
  const [newAchievements, setNewAchievements] = useState<any[]>([])
  const [goals, setGoals] = useState<GoalData[]>([])
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalType, setGoalType] = useState('daily_hours')
  const [goalTarget, setGoalTarget] = useState('')
  const [showProductivityPopup, setShowProductivityPopup] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const currentUser = session?.user

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('dashboard_welcome_seen')
    if (!hasSeenWelcome && session?.user) setShowWelcomePopup(true)
  }, [session])

  const dismissWelcomePopup = () => {
    sessionStorage.setItem('dashboard_welcome_seen', 'true')
    localStorage.setItem('onboarding_skipped', 'true')
    setShowWelcomePopup(false)
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // Only redirect brand-new users who have never generated an API key.
  // Once they have a key OR dismiss onboarding, they stay on dashboard.
  useEffect(() => {
    if (!session?.user || loading) return
    // apiKey is undefined while still loading — only act when confirmed null
    if (apiKey === undefined) return
    if (apiKey === null && (!stats || stats.totalSessions === 0)) {
      // Check localStorage flag — persists across tabs/sessions
      const skipped = localStorage.getItem('onboarding_skipped')
      if (!skipped) {
        router.push('/onboarding')
      }
    }
  }, [session, loading, apiKey, stats, router])

  useEffect(() => {
    if (session?.user) {
      fetchAllData()
    }
  }, [session])

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchStats(),
      fetchContributions(),
      fetchApiKey(),
      fetchAchievements(),
      fetchGoals(),
    ])
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/overview')
      if (res.ok) setStats(await res.json())
    } catch { /* ignore */ }
  }

  const fetchContributions = async () => {
    try {
      const res = await fetch('/api/contributions?days=365')
      if (res.ok) {
        const data = await res.json()
        const contribMap: Record<string, number> = {}
        if (data.contributions) {
          Object.entries(data.contributions).forEach(([date, val]: [string, any]) => {
            contribMap[date] = typeof val === 'object' ? val.hours : val
          })
        }
        setContributions(contribMap)
      }
    } catch { /* ignore */ }
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

  const fetchAchievements = async () => {
    try {
      const res = await fetch('/api/achievements')
      if (res.ok) {
        const data = await res.json()
        setAchievements(data.achievements || [])
        if (data.newlyUnlocked?.length > 0) {
          setNewAchievements(data.newlyUnlocked)
          // Auto-dismiss after 5 seconds
          setTimeout(() => setNewAchievements([]), 5000)
        }
      }
    } catch { /* ignore */ }
  }

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals')
      if (res.ok) {
        const data = await res.json()
        setGoals(data.goals || [])
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

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const testConnection = async () => {
    setTestStatus('testing')
    setTestMessage('Checking for recent activity...')
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) {
        const data = await res.json()
        if (data.stats?.totalSessions > 0 || data.recentActivities?.length > 0) {
          setTestStatus('success')
          setTestMessage('Your VS Code extension is connected and tracking!')
        } else {
          setTestStatus('error')
          setTestMessage('No activity detected yet. Make sure your VS Code extension is configured.')
        }
      } else {
        setTestStatus('error')
        setTestMessage('Failed to check connection.')
      }
    } catch {
      setTestStatus('error')
      setTestMessage('Connection test failed.')
    }
    setTimeout(() => { setTestStatus('idle'); setTestMessage('') }, 5000)
  }

  const fetchDateActivities = async () => {
    if (!dateRange?.from) return
    setDateLoading(true)
    try {
      const from = dateRange.from.toISOString()
      const to = (dateRange.to || dateRange.from).toISOString()
      const res = await fetch(`/api/activities?from=${from}&to=${to}`)
      if (res.ok) {
        const data = await res.json()
        setDateActivities(Array.isArray(data) ? data : [])
      } else {
        setDateActivities([])
      }
    } catch { setDateActivities([]) }
    setDateLoading(false)
  }

  const createGoal = async () => {
    if (!goalTarget) return
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: goalType, target: parseFloat(goalTarget) }),
      })
      setShowGoalModal(false)
      setGoalTarget('')
      fetchGoals()
    } catch { /* ignore */ }
  }

  const openInVSCode = () => {
    if (!apiKey) return
    const endpoint = `${window.location.origin}/api/heartbeat`
    window.location.href = `vscode://vsintegrate.vs-integrate-tracker/auth?key=${encodeURIComponent(apiKey)}&endpoint=${encodeURIComponent(endpoint)}`
  }

  // Check connection status on load
  useEffect(() => {
    if (!session?.user) return
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/connection-status')
        if (res.ok) {
          const data = await res.json()
          setConnectionStatus(data.hasApiKey ? (data.connected || data.hasActivity ? 'connected' : 'disconnected') : 'disconnected')
        }
      } catch { setConnectionStatus('disconnected') }
    }
    checkConnection()
  }, [session])

  const disconnectExtension = async () => {
    setDisconnecting(true)
    try {
      await fetch('/api/apikey', { method: 'DELETE' })
      setApiKey(null)
      setConnectionStatus('disconnected')
      setShowDisconnectConfirm(false)
    } catch { /* ignore */ }
    setDisconnecting(false)
  }

  const reconnectExtension = async () => {
    try {
      // If user had a key before, generate a new one and open VS Code
      const res = await fetch('/api/apikey', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setApiKey(data.apiKey)
        const endpoint = `${window.location.origin}/api/heartbeat`
        window.location.href = `vscode://vsintegrate.vs-integrate-tracker/auth?key=${encodeURIComponent(data.apiKey)}&endpoint=${encodeURIComponent(endpoint)}`
        setConnectionStatus('connected')
      }
    } catch { /* ignore */ }
  }

  // Radar chart data
  const radarData = useMemo(() => {
    const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return dayShort.map((day, i) => ({
      day,
      hours: parseFloat((stats?.weeklyBreakdown[i] || 0).toFixed(1)),
    }))
  }, [stats?.weeklyBreakdown])

  const radarChartConfig = { hours: { label: 'Hours', color: '#2563eb' } }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hasActivity = stats && (stats.totalHours > 0 || stats.totalSessions > 0)
  const hasRadarData = stats?.weeklyBreakdown?.some(h => h > 0)

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
        {/* Achievement Popup */}
        <AnimatePresence>
          {newAchievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
            >
              {newAchievements.map((a: any) => (
                <div key={a.id} className="bg-yellow-600/20 border border-yellow-500/50 rounded-xl p-4 mb-2 flex items-center gap-3 backdrop-blur-md">
                  <span className="text-3xl">{a.icon}</span>
                  <div>
                    <p className="text-yellow-400 font-semibold text-sm">Achievement Unlocked!</p>
                    <p className="text-white font-medium">{a.title}</p>
                    <p className="text-gray-400 text-xs">{a.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Welcome back, <span className="bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">{currentUser?.name?.split(' ')[0] || 'Developer'}</span>!
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                Here&apos;s your coding activity overview
              </p>
              {/* Mobile productivity score */}
              {hasActivity && (
                <button onClick={() => setShowProductivityPopup(true)} className="sm:hidden mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-sm">
                  <Gauge className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400">Score:</span>
                  <span className="font-bold text-white">{stats!.productivityScore}</span>
                </button>
              )}
            </div>
            {/* Productivity Score */}
            {hasActivity && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setShowProductivityPopup(true)}
                className="hidden sm:flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-700 transition-colors"
                title="Click to see how to improve your score"
              >
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1f2937" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={stats!.productivityScore >= 70 ? '#22c55e' : stats!.productivityScore >= 40 ? '#eab308' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${stats!.productivityScore}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{stats!.productivityScore}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Productivity</p>
                  <p className="text-sm font-medium text-white">Score</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Connection Status Banner */}
        {!hasActivity && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 sm:p-5 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                  <Gauge className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">No activity yet</h3>
                  <p className="text-sm text-gray-400">Connect your VS Code extension to start tracking.</p>
                </div>
              </div>
              <div className="flex gap-2">
                {apiKey && (
                  <button onClick={openInVSCode} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap">
                    <ExternalLink className="w-4 h-4" />
                    Open in VS Code
                  </button>
                )}
                <Link href="/onboarding" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap">
                  Setup Extension
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard icon={Timer} label="Total Hours" value={stats?.totalHours?.toFixed(1) || '0'} suffix="hrs" color="blue" delay={0.1} />
          <StatCard icon={Flame} label="Current Streak" value={stats?.currentStreak || 0} suffix="days" color="blue" delay={0.15} />
          <StatCard icon={TrendingUp} label="Longest Streak" value={stats?.longestStreak || 0} suffix="days" color="blue" delay={0.2} />
          <StatCard icon={Gauge} label="Sessions" value={stats?.totalSessions || 0} suffix="" color="blue" delay={0.25} />
        </div>

        {/* Goals Progress Bar */}
        {goals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {goals.map(goal => (
                <div key={goal.id} className={`bg-gray-900 border rounded-xl p-4 ${goal.achieved ? 'border-green-600/30' : 'border-gray-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      {goal.type === 'daily_hours' ? 'Daily Goal' : goal.type === 'weekly_hours' ? 'Weekly Goal' : 'Streak Goal'}
                    </span>
                    {goal.achieved && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-lg font-bold text-white">{goal.current}</span>
                    <span className="text-xs text-gray-500">/ {goal.target} {goal.type.includes('hours') ? 'hrs' : 'days'}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className={`h-full rounded-full ${goal.achieved ? 'bg-green-500' : 'bg-blue-600'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {/* API Key */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Key className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">API Key</h3>
                <p className="text-xs text-gray-500">{apiKey ? 'Click to copy' : 'Generate to connect'}</p>
              </div>
            </div>
            {apiKey ? (
              <div className="space-y-2">
                <button onClick={copyApiKey} className="w-full p-2.5 bg-gray-800 rounded-lg text-xs font-mono text-left truncate hover:bg-gray-700 transition-colors text-gray-300">
                  {copied ? <span className="text-green-400">Copied!</span> : apiKey.substring(0, 20) + '...'}
                </button>
                <div className="flex gap-2">
                  <button onClick={copyApiKey} className="flex-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors text-gray-300">
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                  <button onClick={openInVSCode} className="flex-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors text-white">
                    <ExternalLink className="w-3 h-3" />
                    VS Code
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={generateApiKey} disabled={apiKeyLoading} className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                {apiKeyLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Generate Key
              </button>
            )}
          </motion.div>

          {/* Connection Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                connectionStatus === 'connected' ? 'bg-green-600' : connectionStatus === 'disconnected' ? 'bg-red-600/80' : 'bg-gray-700'
              }`}>
                {connectionStatus === 'connected' ? <Plug className="w-4 h-4 text-white" /> :
                 connectionStatus === 'disconnected' ? <Unplug className="w-4 h-4 text-white" /> :
                 <Loader2 className="w-4 h-4 text-white animate-spin" />}
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">Connection</h3>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : connectionStatus === 'disconnected' ? 'bg-red-400' : 'bg-gray-500'}`} />
                  <p className="text-xs text-gray-500">
                    {connectionStatus === 'connected' ? 'Extension active' : connectionStatus === 'disconnected' ? 'Not connected' : 'Checking...'}
                  </p>
                </div>
              </div>
            </div>
            {connectionStatus === 'connected' ? (
              <button onClick={() => setShowDisconnectConfirm(true)}
                className="w-full px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium text-red-400">
                <Unplug className="w-4 h-4" />
                Disconnect
              </button>
            ) : connectionStatus === 'disconnected' ? (
              <button onClick={apiKey ? openInVSCode : reconnectExtension}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium text-white">
                <Plug className="w-4 h-4" />
                {apiKey ? 'Open in VS Code' : 'Reconnect'}
              </button>
            ) : (
              <div className="w-full px-4 py-2.5 bg-gray-800 rounded-lg flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking status...
              </div>
            )}
          </motion.div>

          {/* Quick Links + Goals */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">Quick Actions</h3>
                <p className="text-xs text-gray-500">Links & goals</p>
              </div>
            </div>
            <div className="space-y-2">
              <button onClick={() => setShowGoalModal(true)} className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg transition-colors flex items-center gap-2 text-sm text-blue-400">
                <Target className="w-4 h-4" />
                Set a Goal
              </button>
              <Link href="/settings" className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm text-gray-300">
                <Share2 className="w-4 h-4 text-gray-500" />
                Public Profile
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Contribution Graph */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-white">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              Contribution Graph
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{stats?.activeDays || 0} active days this year</span>
            </div>
          </div>
          <ContributionGraph contributions={contributions} />
        </motion.div>

        {/* Achievements Row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.47 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-white">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Achievements
            </h2>
            <span className="text-xs text-gray-500">{achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked</span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {(achievements.length > 0 ? achievements : ACHIEVEMENTS.map(a => ({ ...a, unlocked: false, unlockedAt: null }))).map((a) => {
              const achievementDef = ACHIEVEMENTS.find(def => def.id === a.id)
              return (
                <div key={a.id} className={`relative group flex flex-col items-center p-2 rounded-lg transition-all cursor-pointer ${a.unlocked ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-800/30 opacity-40 grayscale hover:opacity-60'}`}>
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">{a.title}</span>
                  {/* Hover popup */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 pointer-events-none">
                    <p className="text-xs font-semibold text-white mb-1">{a.title}</p>
                    <p className="text-[11px] text-gray-400 mb-1.5">{a.description}</p>
                    {achievementDef && (
                      <p className="text-[10px] text-blue-400 font-medium">
                        {a.id === 'first_session' && '→ Log at least 1 coding session'}
                        {a.id === 'week_streak' && '→ Maintain a 7-day coding streak'}
                        {a.id === 'month_streak' && '→ Maintain a 30-day coding streak'}
                        {a.id === 'hundred_hours' && '→ Accumulate 100 hours of coding'}
                        {a.id === 'polyglot' && '→ Code in 5 or more languages'}
                        {a.id === 'early_bird' && '→ Start a session before 7:00 AM'}
                        {a.id === 'night_owl' && '→ Code after midnight'}
                        {a.id === 'marathon' && '→ Code 6+ hours in a single day'}
                        {a.id === 'ten_days' && '→ Be active for at least 10 days'}
                        {a.id === 'thousand_hours' && '→ Accumulate 1000 hours of coding'}
                      </p>
                    )}
                    {a.unlocked && a.unlockedAt && (
                      <p className="text-[10px] text-green-400 mt-1">✓ Unlocked {new Date(a.unlockedAt).toLocaleDateString()}</p>
                    )}
                    {!a.unlocked && (
                      <p className="text-[10px] text-gray-500 mt-1">🔒 Not yet unlocked</p>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Radar Chart + Date Range Picker Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Radar Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-white mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              Weekly Activity Radar
            </h2>
            {hasRadarData ? (
              <ChartContainer config={radarChartConfig} className="mx-auto aspect-square max-h-75 w-full">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Radar name="hours" dataKey="hours" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                </RadarChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                  <Activity className="w-8 h-8 opacity-30" />
                </div>
                <p className="text-sm">Waiting for activity...</p>
                <p className="text-xs mt-1 text-gray-600">Start coding in VS Code to see your weekly pattern</p>
              </div>
            )}
          </motion.div>

          {/* Date Range Activity Lookup */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-white mb-4">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              Activity Lookup
            </h2>
            <p className="text-sm text-gray-400 mb-4">Select a date range to view your VS Code activity</p>
            <div className="flex flex-col gap-3 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white overflow-hidden">
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 shrink-0" />
                    <span className="truncate">
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <span>{format(dateRange.from, 'MMM d, yyyy')} – {format(dateRange.to, 'MMM d, yyyy')}</span>
                      ) : format(dateRange.from, 'MMM d, yyyy')
                    ) : <span className="text-gray-500">Pick a date range</span>}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
                  <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={1} disabled={{ after: new Date() }} />
                </PopoverContent>
              </Popover>
              <Button onClick={fetchDateActivities} disabled={!dateRange?.from || dateLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                {dateLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Search
              </Button>
            </div>
            {dateActivities !== null && (
              <div className="space-y-2 max-h-55 overflow-y-auto">
                {dateActivities.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Code2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No activity found for this period</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-gray-500 px-1 mb-1">
                      <span>{dateActivities.length} session{dateActivities.length !== 1 ? 's' : ''} found</span>
                      <span>{(dateActivities.reduce((sum: number, a: any) => sum + (a.duration || 0), 0) / 3600).toFixed(1)}h total</span>
                    </div>
                    {dateActivities.map((act: any, i: number) => (
                      <div key={act.id || i} className="flex items-center justify-between p-2.5 bg-gray-800 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-gray-300">{act.language || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{(act.duration / 3600).toFixed(1)}h</span>
                          <span>{new Date(act.startTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Weekly Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4 text-white">Weekly Activity</h2>
            <div className="space-y-2.5">
              {dayNames.map((day, i) => {
                const hours = stats?.weeklyBreakdown[i] || 0
                const maxHours = Math.max(...(stats?.weeklyBreakdown || [1]))
                const percentage = maxHours > 0 ? (hours / maxHours) * 100 : 0
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-8 text-xs text-gray-500 font-medium">{day}</span>
                    <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ delay: 0.6 + i * 0.05, duration: 0.5 }} className="h-full bg-blue-600 rounded" />
                    </div>
                    <span className="w-12 text-xs text-right text-gray-400">{hours.toFixed(1)}h</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Top Languages */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4 text-white">Top Languages</h2>
            {stats?.topLanguages && stats.topLanguages.length > 0 ? (
              <div className="space-y-2.5">
                {stats.topLanguages.slice(0, 5).map((lang, i) => {
                  const maxHours = stats.topLanguages[0]?.hours || 1
                  const percentage = (lang.hours / maxHours) * 100
                  return (
                    <div key={lang.language} className="flex items-center gap-3">
                      <span className="w-20 text-xs truncate text-gray-300">{lang.language}</span>
                      <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ delay: 0.65 + i * 0.05, duration: 0.5 }} className="h-full bg-linear-to-r from-blue-600 to-purple-600 rounded" />
                      </div>
                      <span className="w-16 text-xs text-right text-gray-400">{lang.hours}h ({lang.percentage}%)</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Code2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No language data yet</p>
                <p className="text-xs mt-1">Start coding to see your top languages!</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Project Breakdown */}
        {stats?.projects && stats.projects.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4 text-white">Project Breakdown</h2>
            <div className="space-y-2.5">
              {stats.projects.map((proj, i) => {
                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#14b8a6']
                const color = colors[i % colors.length]
                return (
                  <div key={proj.hash} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="w-24 text-xs truncate text-gray-300">{proj.name || `Project ${String.fromCharCode(65 + i)}`}</span>
                    <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${proj.percentage}%`, backgroundColor: color }} />
                    </div>
                    <span className="w-12 text-xs text-right text-gray-400">{proj.hours}h</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Extra Stats Row */}
        {hasActivity && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats?.hoursToday?.toFixed(1) || '0'}</p>
              <p className="text-xs text-gray-500 mt-1">Hours Today</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats?.avgDailyHours?.toFixed(1) || '0'}</p>
              <p className="text-xs text-gray-500 mt-1">Avg Daily Hours</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats?.uniqueLanguages || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Languages Used</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats?.maxDayHours?.toFixed(1) || '0'}</p>
              <p className="text-xs text-gray-500 mt-1">Max Day Hours</p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Welcome Popup */}
      <AnimatePresence>
        {showWelcomePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <div className="relative p-6 bg-blue-600">
                <button onClick={dismissWelcomePopup} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5 text-white" /></button>
                <h2 className="text-xl font-bold text-white">Welcome to Your Dashboard!</h2>
                <p className="text-white/80 text-sm mt-1">Track your real coding activity</p>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-3">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-sm"><Info className="w-4 h-4 text-blue-400" />How it works</h3>
                  <ul className="space-y-2.5 text-sm text-gray-400">
                    <li className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">1</div><span>Download extension & generate API key</span></li>
                    <li className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">2</div><span>Click &quot;Open in VS Code&quot; to auto-configure</span></li>
                    <li className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">3</div><span>Start coding! Your activity appears here automatically</span></li>
                  </ul>
                </div>
                <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
                  <p className="text-sm text-blue-300 flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /><span><strong>Privacy first:</strong> We only track time and language usage. No code content or sensitive file names are stored.</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={dismissWelcomePopup} className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-300">Got it</button>
                  <Link href="/onboarding" onClick={dismissWelcomePopup} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium">Setup Extension<ArrowRight className="w-4 h-4" /></Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Goal Creation Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Target className="w-5 h-5 text-blue-400" />Set a Goal</h3>
                  <button onClick={() => setShowGoalModal(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Goal Type</label>
                    <select value={goalType} onChange={e => setGoalType(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                      <option value="daily_hours">Daily Coding Hours</option>
                      <option value="weekly_hours">Weekly Coding Hours</option>
                      <option value="streak_days">Streak Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Target</label>
                    <input type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder={goalType.includes('hours') ? 'e.g. 2' : 'e.g. 7'} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600" min="0.5" step="0.5" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowGoalModal(false)} className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300">Cancel</button>
                    <button onClick={createGoal} disabled={!goalTarget} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium">Set Goal</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Productivity Score Popup */}
      <AnimatePresence>
        {showProductivityPopup && stats && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowProductivityPopup(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Gauge className="w-5 h-5 text-blue-400" />Productivity Score</h3>
                  <button onClick={() => setShowProductivityPopup(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="flex justify-center mb-5">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1f2937" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={stats.productivityScore >= 70 ? '#22c55e' : stats.productivityScore >= 40 ? '#eab308' : '#ef4444'} strokeWidth="3" strokeDasharray={`${stats.productivityScore}, 100`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">{stats.productivityScore}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Score Breakdown</h4>
                  {[
                    { label: 'Hours Today', weight: '30%', tip: `Code for up to 4 hours today (currently ${stats.hoursToday?.toFixed(1) || 0}h)`, value: Math.min((stats.hoursToday || 0) / 4, 1) },
                    { label: 'Streak Bonus', weight: '20%', tip: `Maintain a coding streak (${stats.currentStreak || 0} days, max 30)`, value: Math.min((stats.currentStreak || 0) / 30, 1) },
                    { label: 'Consistency', weight: '25%', tip: 'Code every day of the week (active days / 7)', value: Math.min((stats.activeDays || 0) / 7, 1) },
                    { label: 'Focus', weight: '25%', tip: 'Longer average sessions (target: 60 min per session)', value: stats.totalSessions ? Math.min(((stats.totalHours * 60) / stats.totalSessions) / 60, 1) : 0 },
                  ].map(factor => (
                    <div key={factor.label} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white">{factor.label} <span className="text-gray-500">({factor.weight})</span></span>
                        <span className="text-xs text-blue-400">{Math.round(factor.value * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${factor.value * 100}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">{factor.tip}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                  <p className="text-xs text-blue-300"><strong>Tip:</strong> To increase your score, code consistently every day, maintain longer focused sessions, and keep your streak going!</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Disconnect Confirmation */}
      <AnimatePresence>
        {showDisconnectConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
                  <Unplug className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-center mb-2 text-white">Disconnect Extension?</h3>
                <p className="text-gray-400 text-center text-sm mb-6">This will revoke your API key and disconnect the VS Code extension. Your existing data will be preserved. You can reconnect anytime.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDisconnectConfirm(false)} className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300">Cancel</button>
                  <button onClick={disconnectExtension} disabled={disconnecting} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                    {disconnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Disconnect
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

function StatCard({ icon: Icon, label, value, suffix, color, delay }: { icon: any; label: string; value: number | string; suffix: string; color: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center mb-3">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl sm:text-2xl font-bold text-white">{value}</span>
        {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
      </div>
    </motion.div>
  )
}

function ContributionGraph({ contributions }: { contributions: Record<string, number> }) {
  const weeks = 52
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (weeks * 7))
  const startDayOfWeek = startDate.getDay()
  startDate.setDate(startDate.getDate() - startDayOfWeek)

  // Light blue → Deep blue gradient based on hours
  const getColor = (hours: number): string => {
    if (!hours || hours === 0) return '#1e2530'
    if (hours < 1) return '#93c5fd'   // light blue (0-59min)
    if (hours < 3) return '#3b82f6'   // mid blue (1-3hr)
    if (hours < 6) return '#1d4ed8'   // deep blue (3-6hr)
    return '#1e3a8a'                   // deepest blue (6hr+)
  }

  const months: { label: string; col: number }[] = []
  const weekColumns = []
  const currentDate = new Date(startDate)
  
  for (let week = 0; week < weeks; week++) {
    const daysArray = []
    for (let day = 0; day < 7; day++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const hours = contributions[dateStr] || 0
      if (day === 0) {
        const monthName = currentDate.toLocaleString('default', { month: 'short' })
        if (months.length === 0 || months[months.length - 1].label !== monthName) {
          months.push({ label: monthName, col: week })
        }
      }
      daysArray.push(
        <div
          key={dateStr}
          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-white/30"
          style={{ backgroundColor: getColor(hours) }}
          title={`${dateStr}: ${hours.toFixed(1)} hours`}
        />
      )
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weekColumns.push(<div key={week} className="flex flex-col gap-0.5 sm:gap-1">{daysArray}</div>)
  }

  return (
    <div>
      <div className="flex gap-0.5 sm:gap-1 mb-1 ml-8">
        {months.map((m, i) => (
          <span key={i} className="text-[10px] text-gray-500" style={{ marginLeft: i === 0 ? 0 : `${(months[i].col - (months[i-1]?.col || 0) - 1) * 13}px` }}>
            {m.label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-0.5 sm:gap-1 min-w-max">{weekColumns}</div>
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-3 text-xs text-gray-500">
        <span>Less</span>
        {['#1e2530', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'].map((color) => (
          <div key={color} className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
