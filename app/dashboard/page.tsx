'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
 Clock, Flame, Zap, Code2, Trophy, Target, Calendar, Copy, Check,
 TrendingUp, BarChart3, Globe2, FolderGit2, ChevronDown, Plus, X,
 Loader2, ArrowRight, ExternalLink, Eye, EyeOff, Info, WifiOff, Terminal, Download
} from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import AppFooter from '@/components/AppFooter'
import IdeIcon from '@/components/IdeIcon'
import IdeSelector from '@/components/IdeSelector'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { IDE_CONFIG, type IdeId, type IdeSelection } from '@/lib/ide-config'
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
 todaySessions?: { ide?: string; startTime: string; endTime: string; duration: number }[]
 ideBreakdown?: { id: string; name: string; color: string; hours: number; sessions: number; activeDays: number; isSetup: boolean; lastHeartbeat: string | null; lastActivityAt: string | null }[]
}

interface ContributionDay {
 hours: number
 sessions: number
 level: number
 byIde?: Record<string, number>
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
 typescriptreact: 'var(--color-chart-1)', typescript: 'var(--color-chart-1)', javascriptreact: 'var(--color-chart-3)',
 css: 'var(--color-chart-4)', python: 'var(--color-chart-2)', javascript: 'var(--color-chart-3)',
 html: 'var(--color-chart-5)', scss: 'var(--color-chart-4)', vue: 'var(--color-chart-5)', svelte: 'var(--color-chart-3)',
 rust: 'var(--color-chart-3)', go: 'var(--color-chart-5)', java: 'var(--color-chart-2)', cpp: 'var(--color-chart-1)',
 c: 'var(--color-chart-1)', csharp: 'var(--color-chart-4)', ruby: 'var(--color-chart-3)', php: 'var(--color-chart-4)',
 swift: 'var(--color-chart-3)', kotlin: 'var(--color-chart-4)', dart: 'var(--color-chart-5)', lua: 'var(--color-chart-1)',
 shell: 'var(--color-chart-2)', sql: 'var(--color-chart-5)', graphql: 'var(--color-chart-4)', dockerfile: 'var(--color-chart-1)',
 r: 'var(--color-chart-5)', scala: 'var(--color-chart-3)', elixir: 'var(--color-chart-4)', haskell: 'var(--color-chart-1)',
 perl: 'var(--color-chart-2)', objective_c: 'var(--color-chart-3)', powershell: 'var(--color-chart-1)',
}
const LANGUAGE_PALETTE = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)']

function getLangColor(lang: string): string {
 const key = lang.toLowerCase()
 if (LANGUAGE_COLORS[key]) return LANGUAGE_COLORS[key]
 const hash = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
 return LANGUAGE_PALETTE[hash % LANGUAGE_PALETTE.length]
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

function toLocalDateStr(d: Date): string {
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
 const { data: session, status } = useSession()
 const router = useRouter()
 const [selectedIde, setSelectedIde] = useState<IdeSelection>('combined')
 const ideQuery = selectedIde === 'combined' ? '' : `ide=${selectedIde}`
 const idePrefix = selectedIde === 'combined' ? 'combined' : IDE_CONFIG[selectedIde].shortName
 const contributionApiUrl = `/api/contributions?days=365${ideQuery ? `&${ideQuery}` : ''}`
 const statsApiUrl = `/api/stats/overview${ideQuery ? `?${ideQuery}` : ''}`
 const connectionApiUrl = `/api/connection-status${ideQuery ? `?${ideQuery}` : ''}`

 // Data
 const [stats, setStats] = useState<StatsData | null>(null)
 const [contributions, setContributions] = useState<Record<string, ContributionDay>>({})
 const [goals, setGoals] = useState<GoalData[]>([])
 const [achievements, setAchievements] = useState<AchievementData[]>([])
 const [totalUnlockedAchievements, setTotalUnlockedAchievements] = useState(0)
 const [apiKey, setApiKey] = useState<string | null>(null)
 const [connectionStatus, setConnectionStatus] = useState<{
 connected: boolean; active: boolean; hasApiKey: boolean; hasActivity: boolean; lastActivityAt?: string | null
 integrations?: { id: string; active?: boolean; connected?: boolean; isSetup?: boolean; hours?: number }[]
 }>({ connected: false, active: false, hasApiKey: false, hasActivity: false, lastActivityAt: null })
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
 const [activeStatPopup, setActiveStatPopup] = useState<string | null>(null)
 const [dailyBarFilter, setDailyBarFilter] = useState<'7d' | '14d' | '1m' | '3m' | '1y'>('14d')
 const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
 const [showReconnectPopup, setShowReconnectPopup] = useState(false)
 const hasFetched = useRef(false)
 const prevConnected = useRef<boolean | null>(null)

 useEffect(() => {
 if (typeof window === 'undefined') return
 const stored = window.localStorage.getItem('cadence-selected-ide')
 if (stored === 'combined' || stored === 'vscode' || stored === 'cursor' || stored === 'antigravity' || stored === 'jetbrains' || stored === 'zed' || stored === 'neovim' || stored === 'sublime') {
 setSelectedIde(stored)
 }
 }, [])

 useEffect(() => {
 if (typeof window !== 'undefined') window.localStorage.setItem('cadence-selected-ide', selectedIde)
 }, [selectedIde])

 // ─── Data fetching with caching ────────────────────────────────────────────
 const fetchAllData = useCallback(async () => {
 if (!session?.user) return
 setLoading(true)

 const [statsData, contribData, goalsData, achievementsData, keyData, connData] = await Promise.all([
 cachedFetch<StatsData>(`stats:${selectedIde}`, statsApiUrl),
 cachedFetch<{ contributions: Record<string, ContributionDay> }>(`contributions:${selectedIde}`, contributionApiUrl),
 cachedFetch<{ goals: GoalData[] }>('goals', '/api/goals'),
 cachedFetch<{ achievements: AchievementData[]; totalUnlocked: number }>('achievements', '/api/achievements'),
 cachedFetch<{ apiKey: string | null }>('apikey', '/api/apikey'),
 cachedFetch<{ connected: boolean; active: boolean; hasApiKey: boolean; hasActivity: boolean; lastActivityAt?: string | null; integrations?: { id: string; active?: boolean; connected?: boolean; isSetup?: boolean }[] }>(`connection:${selectedIde}`, connectionApiUrl),
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
 // Show reconnect popup if disconnected and had previous activity
 if (!connData.connected && connData.hasActivity) {
 setShowReconnectPopup(true)
 }
 }

 setLoading(false)
 }, [session, contributionApiUrl, statsApiUrl, connectionApiUrl, selectedIde])

 // Poll connection status every 15s + refresh stats every ~60s when connected
 useEffect(() => {
 if (!session?.user) return
 let pollCount = 0
 const poll = async () => {
 try {
 const res = await fetch(connectionApiUrl)
 if (res.ok) {
 const data = await res.json()
 setConnectionStatus(data)
 setConnectionReady(true)
 // Show toast only when connection truly changes (API key added/removed)
 if (prevConnected.current !== null && prevConnected.current !== data.connected) {
 if (data.connected) {
 setConnectionToast({
 show: true,
 message: `${idePrefix} is now connected and tracking!`,
 type: 'success',
 })
 setShowReconnectPopup(false)
 } else {
 setShowReconnectPopup(true)
 }
 setTimeout(() => setConnectionToast(null), 5000)
 }
 // Show reconnect popup if disconnected on first load
 if (prevConnected.current === null && !data.connected && data.hasActivity) {
 setShowReconnectPopup(true)
 }
 // Refresh stats periodically when connected
 const justReconnected = prevConnected.current === false && data.connected
 prevConnected.current = data.connected
 pollCount++
 if (justReconnected || (pollCount % 4 === 0 && data.connected)) {
 invalidateCache(`stats:${selectedIde}`)
 invalidateCache(`contributions:${selectedIde}`)
 invalidateCache('achievements')
 const [freshStats, freshContrib, freshAchievements] = await Promise.all([
 cachedFetch<StatsData>(`stats:${selectedIde}`, statsApiUrl),
 cachedFetch<{ contributions: Record<string, ContributionDay> }>(`contributions:${selectedIde}`, contributionApiUrl),
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
 }, [session, contributionApiUrl, statsApiUrl, connectionApiUrl, selectedIde, idePrefix])

 useEffect(() => {
 if (status === 'unauthenticated') router.push('/login')
 }, [status, router])

 useEffect(() => {
 if (session?.user) {
 hasFetched.current = true
 fetchAllData()
 }
 }, [session?.user?.id, selectedIde, fetchAllData])

 // Redirect first-time users to setup (no API key, no sessions)
 useEffect(() => {
 if (loading || !connectionReady) return
 const skippedOnboarding = typeof window !== 'undefined' && localStorage.getItem('onboarding_skipped')
 if (!apiKey && !connectionStatus.hasApiKey && (stats?.totalSessions || 0) === 0 && !skippedOnboarding) {
 router.push('/dashboard/setup')
 }
 }, [loading, connectionReady, apiKey, connectionStatus.hasApiKey, stats, router])

 const confirmDisconnect = () => setShowDisconnectConfirm(true)

 const disconnectTracking = async () => {
 setShowDisconnectConfirm(false)
 setDisconnecting(true)
 try {
 const res = await fetch('/api/apikey', { method: 'DELETE' })
 if (res.ok) {
 setApiKey(null)
 setConnectionStatus(prev => ({ ...prev, connected: false, active: false, hasApiKey: false }))
 setConnectionReady(true)
 // Show reconnect popup after disconnect
 setShowReconnectPopup(true)
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

 // Today's date key for contribution lookups (use local date, not UTC)
 const todayKey = (() => {
 const n = new Date()
 return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
 })()

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
 const dateStr = toLocalDateStr(date)
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
 const dateStr = toLocalDateStr(d)
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
 const dateStr = toLocalDateStr(d)
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

 // Period editor hours for timer section (use local dates)
 const periodHours = useMemo(() => {
 const now = new Date()
 const sumDays = (days: number) => {
 let total = 0
 for (let i = 0; i < days; i++) {
 const d = new Date(now)
 d.setDate(now.getDate() - i)
 const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
 total += contributions[key]?.hours || 0
 }
 return total
 }
 return { '7d': sumDays(7), '1m': sumDays(30), '3m': sumDays(90) }
 }, [contributions])

 // Active days per period for daily average (use local dates)
 const periodActiveDays = useMemo(() => {
 const now = new Date()
 const countActiveDays = (days: number) => {
 let count = 0
 for (let i = 0; i < days; i++) {
 const d = new Date(now)
 d.setDate(now.getDate() - i)
 const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
 if ((contributions[key]?.hours || 0) > 0) count++
 }
 return Math.max(count, 1)
 }
 return { '7d': countActiveDays(7), '1m': countActiveDays(30), '3m': countActiveDays(90) }
 }, [contributions])

 // Period hours use server data only (accurate active-time tracking)
 const periodHoursDisplay = periodHours
 const dashboardIdeStatuses = useMemo(() => {
 const rows = stats?.ideBreakdown?.length ? stats.ideBreakdown : connectionStatus.integrations || []
 return rows.map((item) => ({
 id: item.id,
 active: Boolean('active' in item ? item.active : false),
 connected: Boolean('connected' in item ? item.connected : 'lastHeartbeat' in item ? item.lastHeartbeat : false),
 isSetup: Boolean('isSetup' in item ? item.isSetup : false),
 hours: 'hours' in item ? item.hours : undefined,
 }))
 }, [stats?.ideBreakdown, connectionStatus.integrations])

 // ─── Loading state ─────────────────────────────────────────────────────────
 if (status === 'loading' || (loading && !stats)) {
 return (
 <div className="page-shell min-h-screen flex items-center justify-center">
 <div className="flex flex-col items-center gap-4">
 <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
 <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
 </div>
 </div>
 )
 }

 if (!session) return null

 const levelColors = ['bg-[var(--color-contrib-0)]', 'bg-[var(--color-contrib-1)]', 'bg-[var(--color-contrib-2)]', 'bg-[var(--color-contrib-3)]', 'bg-[var(--color-contrib-4)]']
 const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']
 const setupHref = selectedIde === 'combined' ? '/dashboard/setup' : `/dashboard/setup?ide=${selectedIde}`

 return (
 <div className="page-shell flex min-h-screen flex-col text-foreground">
 <Navbar toolbarSlot={<IdeSelector value={selectedIde} onChange={setSelectedIde} statuses={dashboardIdeStatuses} />} />

 {/* Connection status toast */}
 <AnimatePresence>
 {connectionToast?.show && (
 <motion.div
 initial={{ opacity: 0, y: -40 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -40 }}
 className={`fixed top-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 px-5 py-3 rounded-xl border shadow-lg backdrop-blur-md text-sm font-medium text-center ${
 connectionToast.type === 'success'
 ? 'bg-primary/10 border-primary/30 text-primary'
 : 'bg-[var(--color-danger-soft)] border-destructive/30 text-destructive'
 }`}
 >
 {connectionToast.message}
 </motion.div>
 )}
 </AnimatePresence>

 <main className="dashboard-shell flex-1 py-14 sm:py-16" data-gsap-stagger>
 <div className="mb-5 flex justify-end sm:hidden">
 <IdeSelector value={selectedIde} onChange={setSelectedIde} statuses={dashboardIdeStatuses} />
 </div>
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
 data-gsap-item
 >
 <div className="flex min-w-0 items-center gap-6 sm:w-auto">
 {session.user?.image && (
 <img src={session.user.image} alt="" className="mt-1 hidden h-16 w-16 shrink-0 rounded-lg border border-border object-cover shadow-sm md:block" />
 )}
 <div className="min-w-0">
 <h1 className="font-sans text-xl font-semibold leading-tight sm:text-2xl">
 Welcome back, <span className="font-mono font-bold tracking-normal text-primary">{session.user?.name?.split(' ')[0] || 'Developer'}</span>
 </h1>
 <p className="mt-2 text-base text-muted-foreground">
 {stats?.hoursToday ? `${formatHours(stats.hoursToday)} coded today in ${idePrefix}` : `Start coding to see ${idePrefix} stats`}
 </p>
 </div>
 </div>

 {/* Connection status */}
 <div className="flex shrink-0 flex-wrap items-center gap-3">
 {connectionStatus.connected ? (
 <div
 className="flex cursor-default items-center gap-2 rounded-full border border-[var(--color-live)]/35 bg-[var(--color-live-soft)] px-3 py-1.5 font-mono text-xs text-[var(--color-live)]"
 title={connectionStatus.active ? `${idePrefix} is actively sending heartbeats` : `${idePrefix} has verified heartbeats`}
 >
 <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--color-live)] ${connectionStatus.active ? 'animate-pulse' : ''}`} />
 {connectionStatus.active ? `${idePrefix} active` : `${idePrefix} connected`}
 </div>
 ) : (
 <Link href={setupHref} className="signal-button min-h-9 px-3 text-xs">
 Connect now
 <ArrowRight className="size-3.5" />
 </Link>
 )}
 {apiKey && connectionStatus.connected && (
 <button
 onClick={confirmDisconnect}
 disabled={disconnecting}
 className="rounded-full border border-destructive/30 bg-card px-3 py-1.5 text-xs font-medium text-destructive transition-all hover:bg-[var(--color-danger-soft)] active:scale-95 disabled:opacity-60"
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
 data-gsap-item
 >
 <div
 className="muted-panel rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all group"
 onClick={() => setShowApiKey(!showApiKey)}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
 <Code2 className="w-4 h-4 text-primary" />
 </div>
 <div>
 <h3 className="text-sm font-medium text-foreground">API Key</h3>
 <p className="text-xs text-muted-foreground">
 {apiKey ? 'Click to view • Used by Cadence integrations to send heartbeats' : 'No key generated — click to create one'}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {apiKey && (
 <button
 onClick={(e) => { e.stopPropagation(); copyApiKey() }}
 className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
 >
 {copiedKey ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
 </button>
 )}
 {showApiKey ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
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
 <div className="mt-3 pt-3 border-t border-border">
 <code className="text-xs font-mono text-primary break-all select-all">{apiKey}</code>
 <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
 <span className="bg-secondary px-2 py-0.5 rounded">1. Copy this key</span>
 <span className="bg-secondary px-2 py-0.5 rounded">2. Open setup and choose your editor</span>
 <span className="bg-secondary px-2 py-0.5 rounded">3. Paste key → tracking starts automatically</span>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </motion.div>

 {stats?.ideBreakdown && stats.ideBreakdown.length > 0 && (
 <motion.section
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.08 }}
 className="app-card mb-6 p-4 sm:p-5"
 data-gsap-item
 >
 <div className="mb-4 flex items-center justify-between gap-3">
 <div>
 {selectedIde !== 'combined' && <p className="signal-kicker">{idePrefix}</p>}
 <h2 className="font-sans text-lg font-semibold">IDE activity breakdown</h2>
 </div>
 <Link href={setupHref} className="signal-button signal-button-secondary min-h-9 px-3 text-xs">
 Setup
 </Link>
 </div>
 <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
 {stats.ideBreakdown.map((item) => (
 <button
 type="button"
 key={item.id}
 onClick={() => setSelectedIde(item.id as IdeSelection)}
 className={`rounded-md border p-3 text-left transition-colors hover:border-primary ${selectedIde === item.id ? 'border-primary bg-background' : 'border-border bg-secondary/45'}`}
 >
 <div className="flex items-center justify-between gap-3">
 <span className="flex items-center gap-2 min-w-0">
 <IdeIcon ide={item.id as IdeId} className="size-7" />
 <span className="truncate text-sm font-semibold">{item.name}</span>
 </span>
 <span className={`size-2 rounded-full ${item.lastHeartbeat ? 'bg-[var(--color-live)]' : item.isSetup ? 'bg-muted-foreground' : 'bg-border'}`} />
 </div>
 <div className="mt-3 flex items-end justify-between gap-3">
 <span className="font-mono text-xl font-semibold text-primary">{formatHoursShort(item.hours)}</span>
 <span className="text-xs text-muted-foreground">{item.sessions} sessions</span>
 </div>
 </button>
 ))}
 </div>
 </motion.section>
 )}

 {selectedIde !== 'combined' && stats && stats.totalSessions === 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="mb-6 rounded-lg border border-border bg-secondary/50 p-4"
 data-gsap-item
 >
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-start gap-3">
 <IdeIcon ide={selectedIde} className="size-9" />
 <div>
 <h2 className="font-sans text-base font-semibold">No {idePrefix} sessions yet</h2>
 <p className="mt-1 text-sm text-muted-foreground">Combined activity is still available. Configure {idePrefix} when you want this panel to light up.</p>
 </div>
 </div>
 <Link href={setupHref} className="signal-button min-h-10 shrink-0">Connect now</Link>
 </div>
 </motion.div>
 )}

 {/* Today's total */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="mb-6"
 data-gsap-item
 >
 <div className={`overflow-hidden rounded-xl border transition-all ${
 connectionStatus.connected
 ? 'border-[var(--color-live)]/35 bg-[var(--color-live-soft)]'
 : 'bg-card/80 border-border'
 }`}>
 <div className="p-5 sm:p-6">
 <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex min-w-0 items-center gap-4">
 <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${
 connectionStatus.connected ? 'bg-[var(--color-live)]/15' : 'bg-secondary'
 }`}>
 {connectionStatus.connected
 ? <Zap className="size-7 text-[var(--color-live)]" />
 : <WifiOff className="size-7 text-muted-foreground" />}
 </div>
 <div className="min-w-0">
 <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Today&apos;s total</p>
 <p className="mt-1 break-words font-mono text-3xl font-bold tracking-normal text-primary sm:text-5xl">
 {formatHours(stats?.hoursToday || 0)}
 </p>
 <p className="mt-2 text-xs text-muted-foreground">
 {connectionStatus.connected
 ? connectionStatus.active
 ? `${idePrefix} is actively sending heartbeats.`
 : `${idePrefix} is verified. Today's total updates when fresh activity arrives.`
 : `Connect ${idePrefix} to start tracking today's total.`}
 </p>
 </div>
 </div>
 {!connectionStatus.connected && (
 <Link href={setupHref} className="signal-button min-h-10 shrink-0">
 Connect now
 <ArrowRight className="size-4" />
 </Link>
 )}
 </div>
 </div>
 </div>
 </motion.div>

 {/* Disconnect Confirmation Popup */}
 <AnimatePresence>
 {showDisconnectConfirm && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.15 }}
 className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4"
 onClick={() => setShowDisconnectConfirm(false)}
 >
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 transition={{ duration: 0.2, ease: 'easeOut' }}
 className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-sm max-h-[92vh] overflow-y-auto"
 onClick={e => e.stopPropagation()}
 >
 <div className="p-4 sm:p-6 text-center">
 <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-4">
 <WifiOff className="w-6 h-6 text-destructive" />
 </div>
 <h3 className="text-lg font-semibold mb-2">Disconnect Tracking?</h3>
 <p className="text-sm text-muted-foreground mb-1">This will revoke your API key and stop editor tracking.</p>
 <p className="text-xs text-muted-foreground mb-5">You&apos;ll need to generate a new key and reconfigure your editor integrations to resume tracking.</p>
 <div className="flex flex-col min-[380px]:flex-row gap-3">
 <button
 onClick={() => setShowDisconnectConfirm(false)}
 className="flex-1 py-2.5 bg-secondary hover:bg-secondary rounded-xl text-sm text-muted-foreground font-medium transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={disconnectTracking}
 className="flex-1 py-2.5 bg-destructive hover:bg-destructive rounded-xl text-sm text-foreground font-medium transition-colors"
 >
 Disconnect
 </button>
 </div>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Reconnect Popup — shown when user is disconnected (no API key) */}
 <AnimatePresence>
 {showReconnectPopup && !connectionStatus.connected && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.15 }}
 className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4"
 onClick={() => setShowReconnectPopup(false)}
 >
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 transition={{ duration: 0.2, ease: 'easeOut' }}
 className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-sm max-h-[92vh] overflow-y-auto"
 onClick={e => e.stopPropagation()}
 >
 <div className="p-4 sm:p-6 text-center">
 <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
 <WifiOff className="w-6 h-6 text-primary" />
 </div>
 <h3 className="text-lg font-semibold mb-2">Tracking Needs Setup</h3>
 <p className="text-sm text-muted-foreground mb-1">Cadence has not verified a live editor heartbeat yet.</p>
 <p className="text-xs text-muted-foreground mb-5">Open setup for the selected editor, run its test command, then verify the connection.</p>
 <div className="flex flex-col min-[380px]:flex-row gap-3">
 <button
 onClick={() => setShowReconnectPopup(false)}
 className="flex-1 py-2.5 bg-secondary hover:bg-secondary rounded-xl text-sm text-muted-foreground font-medium transition-colors"
 >
 Dismiss
 </button>
 <Link
 href={setupHref}
 className="flex-1 py-2.5 bg-primary hover:bg-primary rounded-xl text-sm text-primary-foreground font-medium transition-colors flex items-center justify-center gap-1.5"
 >
 Connect now
 <ArrowRight className="w-4 h-4" />
 </Link>
 </div>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Stats Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8" data-gsap-stagger>
 {[
 { key: 'totalHours', label: 'Total Hours', value: formatHours(stats?.totalHours || 0), icon: Clock, iconClass: 'text-primary', glowClass: 'bg-primary/5', hoverClass: 'hover:border-primary/30', sub: `${stats?.activeDays || 0} active days` },
 { key: 'streak', label: 'Current Streak', value: `${stats?.currentStreak || 0}d`, icon: Flame, iconClass: 'text-primary', glowClass: 'bg-primary/5', hoverClass: 'hover:border-primary/30', sub: `Best: ${stats?.longestStreak || 0}d` },
 { key: 'today', label: 'Today', value: formatHours(stats?.hoursToday || 0), icon: Zap, iconClass: 'text-primary', glowClass: 'bg-primary/5', hoverClass: 'hover:border-primary/30', sub: `Score: ${stats?.productivityScore || 0}/100` },
 { key: 'languages', label: 'Languages', value: `${stats?.uniqueLanguages || 0}`, icon: Globe2, iconClass: 'text-[var(--color-accent-2)]', glowClass: 'bg-[color-mix(in_oklch,var(--color-accent-2)_10%,transparent)]', hoverClass: 'hover:border-[var(--color-accent-2)]', sub: `${stats?.totalSessions || 0} sessions` },
 ].map((stat, i) => (
 <motion.div
 key={stat.label}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 + i * 0.05 }}
 onClick={() => setActiveStatPopup(stat.key)}
 className={`group relative app-card p-4 sm:p-5 ${stat.hoverClass} transition-all overflow-hidden cursor-pointer active:scale-[0.97]`}
 data-gsap-item
 >
 <div className={`absolute top-0 right-0 w-20 h-20 ${stat.glowClass} rounded-full -translate-y-1/2 translate-x-1/2`} />
 <div className="relative">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
 <stat.icon className={`w-4 h-4 ${stat.iconClass} opacity-70`} />
 </div>
 <p className="text-xl sm:text-2xl font-bold tracking-tight">{stat.value}</p>
 <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
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
 className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4"
 onClick={() => setActiveStatPopup(null)}
 >
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 transition={{ duration: 0.25, ease: 'easeOut' }}
 className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-lg max-h-[92vh] sm:max-h-[80vh] overflow-y-auto"
 onClick={e => e.stopPropagation()}
 >
 {/* Total Hours Popup */}
 {activeStatPopup === 'totalHours' && (
 <div className="p-4 sm:p-6">
 <div className="flex items-center justify-between mb-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
 <Clock className="w-5 h-5 text-primary" />
 </div>
 <div>
 <h3 className="text-lg font-semibold">Total Hours</h3>
 <p className="text-xs text-muted-foreground">All-time coding breakdown</p>
 </div>
 </div>
 <button onClick={() => setActiveStatPopup(null)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
 <X className="w-5 h-5 text-muted-foreground" />
 </button>
 </div>
 <div className="grid grid-cols-2 gap-3 mb-4">
 <div className="bg-secondary/50 rounded-xl p-4 text-center">
 <p className="text-2xl font-bold text-primary">{formatHours(stats?.totalHours || 0)}</p>
 <p className="text-xs text-muted-foreground mt-1">Total Coded</p>
 </div>
 <div className="bg-secondary/50 rounded-xl p-4 text-center">
 <p className="text-2xl font-bold text-primary">{stats?.activeDays || 0}</p>
 <p className="text-xs text-muted-foreground mt-1">Active Days</p>
 </div>
 </div>
 <div className="space-y-3">
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Daily Average</span>
 <span className="text-sm font-semibold">{formatHours(stats?.activeDays ? (stats?.totalHours || 0) / stats.activeDays : 0)}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Last 7 Days</span>
 <span className="text-sm font-semibold">{formatHours(periodHoursDisplay['7d'])}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Last 30 Days</span>
 <span className="text-sm font-semibold">{formatHours(periodHoursDisplay['1m'])}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Last 90 Days</span>
 <span className="text-sm font-semibold">{formatHours(periodHoursDisplay['3m'])}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Best Day</span>
 <span className="text-sm font-semibold">{formatHours(stats?.maxDayHours || 0)}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Total Sessions</span>
 <span className="text-sm font-semibold">{stats?.totalSessions || 0}</span>
 </div>
 </div>
 </div>
 )}

 {/* Streak Popup */}
 {activeStatPopup === 'streak' && (
 <div className="p-4 sm:p-6">
 <div className="flex items-center justify-between mb-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
 <Flame className="w-5 h-5 text-primary" />
 </div>
 <div>
 <h3 className="text-lg font-semibold">Streak Details</h3>
 <p className="text-xs text-muted-foreground">Your coding consistency</p>
 </div>
 </div>
 <button onClick={() => setActiveStatPopup(null)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
 <X className="w-5 h-5 text-muted-foreground" />
 </button>
 </div>
 <div className="grid grid-cols-2 gap-3 mb-4">
 <div className="bg-secondary/50 border border-border rounded-xl p-4 text-center">
 <p className="text-2xl font-bold text-primary">{stats?.currentStreak || 0}<span className="text-base">d</span></p>
 <p className="text-xs text-muted-foreground mt-1">Current Streak</p>
 </div>
 <div className="bg-secondary/50 rounded-xl p-4 text-center">
 <p className="text-2xl font-bold text-primary">{stats?.longestStreak || 0}<span className="text-base">d</span></p>
 <p className="text-xs text-muted-foreground mt-1">Longest Streak</p>
 </div>
 </div>
 <div className="space-y-3">
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Active Days</span>
 <span className="text-sm font-semibold">{stats?.activeDays || 0}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Coded Today</span>
 <span className="text-sm font-semibold">{(stats?.hoursToday || 0) > 0 ? 'Yes' : 'Not yet'}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Productivity Score</span>
 <span className="text-sm font-semibold">{stats?.productivityScore || 0}/100</span>
 </div>
 </div>
 <p className="text-xs text-muted-foreground mt-4 text-center">Code at least once per day to keep your streak alive!</p>
 </div>
 )}

 {/* Today Popup */}
 {activeStatPopup === 'today' && (
 <div className="p-4 sm:p-6">
 <div className="flex items-center justify-between mb-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
 <Zap className="w-5 h-5 text-primary" />
 </div>
 <div>
 <h3 className="text-lg font-semibold">Today&apos;s Activity</h3>
 <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
 </div>
 </div>
 <button onClick={() => setActiveStatPopup(null)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
 <X className="w-5 h-5 text-muted-foreground" />
 </button>
 </div>
 <div className="bg-primary/5 border border-primary/15 rounded-xl p-5 text-center mb-4">
 <p className="text-2xl font-bold text-primary">{formatHours(stats?.hoursToday || 0)}</p>
 <p className="text-xs text-muted-foreground mt-1">Coded today</p>
 </div>
 <div className="space-y-3">
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Server-tracked</span>
 <span className="text-sm font-semibold">{formatHours(stats?.hoursToday || 0)}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Daily Average</span>
 <span className="text-sm font-semibold">{formatHours(stats?.avgDailyHours || 0)}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Productivity Score</span>
 <span className="text-sm font-semibold">{stats?.productivityScore || 0}/100</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
 <span className="text-sm text-muted-foreground">Best Day Ever</span>
 <span className="text-sm font-semibold">{formatHours(stats?.maxDayHours || 0)}</span>
 </div>
 </div>
 </div>
 )}

 {/* Languages Popup */}
 {activeStatPopup === 'languages' && (
 <div className="p-4 sm:p-6">
 <div className="flex items-center justify-between mb-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
 <Globe2 className="w-5 h-5 text-primary" />
 </div>
 <div>
 <h3 className="text-lg font-semibold">Languages Used</h3>
 <p className="text-xs text-muted-foreground">{stats?.uniqueLanguages || 0} languages across {stats?.totalSessions || 0} sessions</p>
 </div>
 </div>
 <button onClick={() => setActiveStatPopup(null)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
 <X className="w-5 h-5 text-muted-foreground" />
 </button>
 </div>
 {stats?.topLanguages && stats.topLanguages.length > 0 ? (
 <div className="space-y-3">
 {stats.topLanguages.map((lang) => (
 <div key={lang.language} className="p-3 bg-secondary/30 rounded-lg">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLangColor(lang.language) }} />
 <span className="text-sm font-medium capitalize">{lang.language}</span>
 </div>
 <span className="text-xs font-semibold" style={{ color: getLangColor(lang.language) }}>{formatHours(lang.hours)} ({lang.percentage}%)</span>
 </div>
 <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
 <div
 className="h-full rounded-full transition-all"
 style={{ width: `${lang.percentage}%`, backgroundColor: getLangColor(lang.language) }}
 />
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-muted-foreground">
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
 className="app-card p-4 sm:p-6 mb-8"
 data-gsap="fade-up"
 >
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
 <div>
 <h2 className="font-sans text-base font-semibold">Contribution Graph</h2>
 <p className="text-xs text-muted-foreground mt-0.5">{stats?.activeDays || 0} active days in the selected period</p>
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
 ? 'bg-primary/20 text-primary border border-primary/30'
 : 'bg-secondary/50 text-muted-foreground border border-border hover:text-muted-foreground hover:border-border'
 }`}
 >
 {f.label}
 </button>
 ))}
 </div>
 </div>

 <div className="relative">
 <div className="heatmap-scroll flex gap-0.75 overflow-x-auto pb-2">
 {/* Day labels */}
 <div className="flex flex-col gap-0.75 mr-1 shrink-0">
 {dayLabels.map((label, i) => (
 <div key={i} className="h-3.25 flex items-center justify-end pr-1">
 <span className="text-[10px] text-muted-foreground">{label}</span>
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
 day.level < 0 ? 'opacity-0' : day.level === 0 ? 'bg-secondary/50 hover:bg-secondary/50' : levelColors[day.level]
 } hover:ring-1 hover:ring-primary/50 hover:scale-125`}
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
 <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
 <p className="text-xs font-semibold text-foreground">
 {formatHours(hoveredDay.hours)} on {formatDate(hoveredDay.date)}
 </p>
 <p className="text-[10px] text-muted-foreground mt-0.5">
 {hoveredDay.sessions} session{hoveredDay.sessions !== 1 ? 's' : ''}
 </p>
 </div>
 <div className="w-2 h-2 bg-card border-b border-r border-border rotate-45 mx-auto -mt-1" />
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Legend */}
 <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground">
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
 className="app-card p-5"
 data-gsap="fade-up"
 >
 <div className="flex items-center justify-between mb-4">
 <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
 <BarChart3 className="w-4 h-4 text-primary" />
 Top Languages
 </h2>
 <span className="text-xs text-muted-foreground">{stats?.uniqueLanguages || 0} total</span>
 </div>

 {stats?.topLanguages && stats.topLanguages.length > 0 ? (
 <div className="space-y-3">
 {stats.topLanguages.map((lang, i) => (
 <div key={lang.language} className="group">
 <div className="flex items-center justify-between mb-1">
 <div className="flex items-center gap-2">
 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getLangColor(lang.language) }} />
 <span className="text-sm text-foreground capitalize">{lang.language}</span>
 </div>
 <span className="text-xs font-semibold" style={{ color: getLangColor(lang.language) }}>{formatHours(lang.hours)} ({lang.percentage}%)</span>
 </div>
 <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
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
 <div className="text-center py-8 text-muted-foreground">
 <Code2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
 <p className="text-sm">No language data yet</p>
 <p className="text-xs mt-1">Start coding with an editor connected</p>
 </div>
 )}
 </motion.div>

 {/* Project Breakdown */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 className="app-card p-5"
 data-gsap="fade-up"
 >
 <div className="flex items-center justify-between mb-4">
 <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
 <FolderGit2 className="w-4 h-4 text-primary" />
 Project Breakdown
 </h2>
 </div>

 {stats?.projects && stats.projects.length > 0 ? (
 <div className="space-y-3">
 {stats.projects.map((project, i) => (
 <div
 key={project.hash}
 className={`flex items-center gap-3 rounded-lg p-2 -m-2 transition-colors ${project.repoUrl ? 'cursor-pointer hover:bg-primary/5' : ''}`}
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
 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
 <FolderGit2 className="w-4 h-4 text-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1 gap-2">
 <div className="flex items-center gap-1.5 min-w-0 flex-1">
 {project.repoUrl ? (
 <a
 href={project.repoUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="text-sm text-primary hover:text-primary transition-colors flex items-center gap-1 min-w-0"
 onClick={e => e.stopPropagation()}
 >
 <span className="truncate">{project.name || `Project ${project.hash.slice(0, 8)}`}</span>
 <ExternalLink className="w-3 h-3 shrink-0" />
 </a>
 ) : (
 <span className="text-sm text-foreground truncate block" title={project.name || `Project ${project.hash.slice(0, 8)}`}>
 {project.name || `Project ${project.hash.slice(0, 8)}`}
 </span>
 )}
 </div>
 <span className="text-xs text-muted-foreground shrink-0">{formatHours(project.hours)}</span>
 </div>
 <div className="h-1 bg-secondary rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${project.percentage}%` }}
 transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
 className="h-full rounded-full bg-primary"
 />
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-muted-foreground">
 <FolderGit2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
 <p className="text-sm">No project data yet</p>
 <p className="text-xs mt-1">Open projects in a connected editor to track them</p>
 </div>
 )}
 </motion.div>
 </div>

 {/* Weekly Activity Chart */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.45 }}
 className="app-card p-5 mb-8"
 data-gsap="fade-up"
 >
 <h2 className="mb-6 flex items-center gap-2 font-sans text-base font-semibold">
 <TrendingUp className="w-4 h-4 text-primary" />
 Weekly Activity
 </h2>
 <div className="flex items-end gap-2 sm:gap-4 h-40">
 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
 const hours = stats?.weeklyBreakdown?.[i] || 0
 const maxH = Math.max(...(stats?.weeklyBreakdown || [0]), 1)
 const pct = (hours / maxH) * 100
 return (
 <div key={day} className="flex-1 flex flex-col items-center gap-1">
 <span className="text-[10px] text-muted-foreground mb-1">{formatHours(hours)}</span>
 <div className="w-full bg-secondary/50 rounded-t-lg relative" style={{ height: '120px' }}>
 <motion.div
 initial={{ height: 0 }}
 animate={{ height: `${pct}%` }}
 transition={{ delay: 0.6 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
 className="absolute bottom-0 w-full rounded-t-lg bg-primary"
 />
 </div>
 <span className="text-[10px] text-muted-foreground">{day}</span>
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
 className="lg:col-span-3 app-card p-5"
 data-gsap="fade-up"
 >
 <div className="flex items-center justify-between mb-4">
 <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
 <TrendingUp className="w-4 h-4 text-primary" />
 30-Day Coding Trend
 </h2>
 <span className="text-xs text-muted-foreground">
 {trendData.reduce((s, d) => s + d.hours, 0).toFixed(1)}h total
 </span>
 </div>
 <ResponsiveContainer width="100%" height={160}>
 <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
 <defs>
 <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.35} />
 <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" vertical={false} />
 <XAxis
 dataKey="date"
 tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
 tickLine={false}
 axisLine={{ stroke: 'var(--color-rule)' }}
 interval={6}
 />
 <YAxis
 tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
 tickLine={false}
 axisLine={false}
 tickFormatter={v => formatHoursShort(v)}
 />
 <ReTooltip
 contentStyle={{ background: 'var(--color-paper)', border: '1px solid var(--color-rule)', borderRadius: '8px', color: 'var(--color-ink)', fontSize: '12px' }}
 formatter={(v: number) => [formatHoursShort(v), 'Coded']}
 labelStyle={{ color: 'var(--color-muted)' }}
 cursor={{ stroke: 'var(--color-rule)' }}
 />
 <Area
 type="monotone"
 dataKey="hours"
 stroke="var(--color-accent)"
 fill="url(#trendGrad)"
 strokeWidth={2}
 dot={false}
 activeDot={{ r: 4, fill: 'var(--color-accent)', strokeWidth: 0 }}
 />
 </AreaChart>
 </ResponsiveContainer>
 </motion.div>

 {/* Language Distribution Donut */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.55 }}
 className="lg:col-span-2 app-card p-5"
 data-gsap="fade-up"
 >
 <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-semibold">
 <Globe2 className="w-4 h-4 text-primary" />
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
 contentStyle={{ background: 'var(--color-paper)', border: '1px solid var(--color-rule)', borderRadius: '8px', fontSize: '11px', color: 'var(--color-ink)' }}
 formatter={(v: number, _: string, p) => [`${v}h (${p.payload.percentage}%)`, p.payload.name]}
 itemStyle={{ color: 'var(--color-ink)' }}
 labelStyle={{ color: 'var(--color-muted)' }}
 />
 </PieChart>
 </ResponsiveContainer>
 <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full">
 {langPieData.map(l => (
 <div key={l.name} className="flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.fill }} />
 <span className="text-[10px] text-muted-foreground truncate capitalize">{l.name}</span>
 <span className="ml-auto text-[10px] font-semibold" style={{ color: l.fill }}>{l.percentage}%</span>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <div className="text-center py-10 text-muted-foreground">
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
 className="app-card p-5"
 data-gsap="fade-up"
 >
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
 <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
 <BarChart3 className="w-4 h-4 text-primary" />
 Daily Hours
 </h2>
 <div className="flex items-center gap-1 bg-secondary/80 rounded-xl p-0.5">
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
 ? 'bg-primary/20 text-primary'
 : 'text-muted-foreground hover:text-muted-foreground'
 }`}
 >
 {f.label}
 </button>
 ))}
 </div>
 </div>
 <ResponsiveContainer width="100%" height={200}>
 <BarChart data={dailyBarData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" vertical={false} />
 <XAxis
 dataKey="date"
 tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
 tickLine={false}
 axisLine={{ stroke: 'var(--color-rule)' }}
 interval={dailyBarDays <= 14 ? 1 : dailyBarDays <= 30 ? 3 : dailyBarDays <= 90 ? 13 : 29}
 />
 <YAxis
 tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
 tickLine={false}
 axisLine={false}
 tickFormatter={v => formatHoursShort(v)}
 />
 <ReTooltip
 contentStyle={{ background: 'var(--color-paper)', border: '1px solid var(--color-rule)', borderRadius: '8px', color: 'var(--color-ink)', fontSize: '12px' }}
 formatter={(v: number) => [formatHoursShort(v), 'Coded']}
 labelStyle={{ color: 'var(--color-muted)' }}
 cursor={{ fill: 'color-mix(in oklch, var(--color-accent) 8%, transparent)' }}
 />
 <Bar dataKey="hours" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </motion.div>

 {/* Productivity Radar */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.65 }}
 className="app-card p-5"
 data-gsap="fade-up"
 >
 <h2 className="mb-6 flex items-center gap-2 font-sans text-base font-semibold">
 <Zap className="w-4 h-4 text-[var(--color-accent-3)]" />
 Productivity Breakdown
 </h2>
 {radarData.length > 0 ? (
 <ResponsiveContainer width="100%" height={200}>
 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
 <PolarGrid stroke="var(--color-rule)" />
 <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-muted)', fontSize: 11 }} />
 <PolarRadiusAxis
 angle={30}
 domain={[0, 100]}
 tick={false}
 axisLine={false}
 />
 <Radar
 name="Score"
 dataKey="value"
 stroke="var(--color-accent-2)"
 fill="var(--color-accent-2)"
 fillOpacity={0.25}
 strokeWidth={2}
 />
 </RadarChart>
 </ResponsiveContainer>
 ) : (
 <div className="text-center py-10 text-muted-foreground">
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
 className="app-card p-5 mb-8"
 >
 <div className="flex items-center justify-between mb-4">
 <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
 <Target className="w-4 h-4 text-primary" />
 Goals
 </h2>
 <button
 onClick={() => setShowNewGoal(!showNewGoal)}
 className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 active:scale-95 transition-all"
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
 <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-xs text-muted-foreground mb-1">Type</label>
 <select
 value={newGoalType}
 onChange={(e) => setNewGoalType(e.target.value)}
 className="w-full bg-card border border-border rounded-lg p-2 text-sm text-foreground outline-none"
 >
 <option value="daily_hours">Daily Hours</option>
 <option value="weekly_hours">Weekly Hours</option>
 <option value="streak_days">Streak Days</option>
 </select>
 </div>
 <div>
 <label className="block text-xs text-muted-foreground mb-1">Target</label>
 <input
 type="number"
 value={newGoalTarget}
 onChange={(e) => setNewGoalTarget(e.target.value)}
 placeholder={newGoalType === 'daily_hours' ? '4' : newGoalType === 'weekly_hours' ? '20' : '7'}
 min="0.5"
 step="0.5"
 className="w-full bg-card border border-border rounded-lg p-2 text-sm text-foreground outline-none"
 />
 </div>
 <div>
 <label className="block text-xs text-muted-foreground mb-1">Date (optional)</label>
 <input
 type="date"
 value={newGoalDate}
 onChange={(e) => setNewGoalDate(e.target.value)}
 min={new Date().toISOString().split('T')[0]}
 className="w-full bg-card border border-border rounded-lg p-2 text-sm text-foreground outline-none"
 />
 </div>
 </div>
 <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
 <Info className="w-3 h-3" />
 Pick a date to set a goal for that specific day. Leave blank for a recurring goal. An email will be sent when achieved.
 </div>
 <div className="flex justify-end gap-2">
 <button onClick={() => setShowNewGoal(false)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
 <button
 onClick={createGoal}
 disabled={goalSaving || !newGoalTarget}
 className="px-4 py-1.5 bg-primary hover:bg-primary disabled:bg-secondary text-primary-foreground disabled:text-muted-foreground rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-1"
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
 className={`relative bg-secondary/30 border rounded-lg p-4 transition-all ${
 goal.achieved ? 'border-primary/30 bg-primary/5' : 'border-border'
 }`}
 >
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 {goal.achieved ? (
 <Trophy className="w-4 h-4 text-primary" />
 ) : (
 <Target className="w-4 h-4 text-muted-foreground" />
 )}
 <span className="text-sm font-medium text-foreground">
 {goal.type === 'daily_hours' ? 'Daily Hours' : goal.type === 'weekly_hours' ? 'Weekly Hours' : 'Streak'}: {goal.target}{goal.type.includes('hours') ? 'h' : 'd'}
 </span>
 {goal.targetDate && (
 <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
 {formatDate(goal.targetDate)}
 </span>
 )}
 </div>
 <div className="flex items-center gap-2">
 <span className={`text-xs ${goal.achieved ? 'text-primary' : 'text-muted-foreground'}`}>
 {goal.current}/{goal.target} ({goal.percentage}%)
 </span>
 <button onClick={() => deleteGoal(goal.id)} className="p-1 hover:bg-secondary rounded transition-colors">
 <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
 </button>
 </div>
 </div>
 <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${goal.percentage}%` }}
 transition={{ duration: 0.8, ease: 'easeOut' }}
 className={`h-full rounded-full ${goal.achieved ? 'bg-primary' : 'bg-primary'}`}
 />
 </div>
 {goal.achieved && (
 <p className="text-[10px] text-primary/60 mt-1.5">Goal achieved! Check your email for confirmation.</p>
 )}
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-6 text-muted-foreground">
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
 className="app-card p-5 mb-8"
 >
 <h2 className="mb-6 flex items-center gap-2 font-sans text-base font-semibold">
 <Trophy className="w-4 h-4 text-primary" />
 Achievements
 <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">
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
 ? 'bg-secondary border-primary/30 hover:border-primary/50 hover:scale-105'
 : 'bg-secondary/30 border-border/60 hover:border-input hover:scale-105'
 }`}
 >
 <span className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-60'}`}>{achievement.icon}</span>
 <p className={`text-xs font-medium mt-1.5 ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
 {achievement.title}
 </p>
 <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
 {achievement.unlocked
 ? achievement.unlockedAt
 ? formatDate(achievement.unlockedAt)
 : 'Unlocked'
 : 'Locked'}
 </p>
 </div>
 </TooltipTrigger>
 <TooltipContent side="top" className="max-w-[200px] text-center">
 <p className="font-semibold text-primary mb-0.5">{achievement.title}</p>
 <p className="text-muted-foreground">{achievement.unlocked ? 'Unlocked: ' : 'How to earn: '}{achievement.description}</p>
 </TooltipContent>
 </Tooltip>
 ))}
 </div>
 </TooltipProvider>
 ) : (
 <div className="text-center py-6 text-muted-foreground">
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
 className="app-card p-5 mb-8"
 >
 <h2 className="mb-6 flex items-center gap-2 font-sans text-base font-semibold">
 <Trophy className="w-4 h-4 text-primary" />
 Rewards
 <span className="text-xs bg-secondary text-primary px-2 py-0.5 rounded-full ml-auto border border-border">
 {goals.filter(g => g.achieved).length} earned
 </span>
 </h2>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
 {goals.filter(g => g.achieved).map((goal) => {
 const badge = goal.type === 'daily_hours'
 ? { icon: 'T', label: `${goal.target}h Day`, color: ' border-primary/30' }
 : goal.type === 'weekly_hours'
 ? { icon: 'W', label: `${goal.target}h Week`, color: 'border-primary/30' }
 : { icon: 'S', label: `${goal.target}d Streak`, color: 'border-[var(--color-accent-3)]/40' }
 return (
 <div key={goal.id} className={`bg-secondary ${badge.color} border rounded-xl p-3 text-center`}>
 <span className="text-2xl">{badge.icon}</span>
 <p className="text-xs font-medium text-foreground mt-1.5">{badge.label}</p>
 <p className="text-[10px] text-muted-foreground mt-0.5">
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
 className="app-card p-5"
 >
 <h2 className="mb-6 flex items-center gap-2 font-sans text-base font-semibold">
 <Trophy className="w-4 h-4 text-primary" />
 Productivity Score
 </h2>
 <div className="flex flex-col sm:flex-row items-center gap-6">
 {/* Score ring */}
 <div className="relative w-32 h-32 shrink-0">
 <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
 <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-rule)" strokeWidth="8" />
 <motion.circle
 cx="60" cy="60" r="54" fill="none"
 stroke={
 (stats?.productivityScore || 0) >= 75 ? 'var(--color-accent)' :
 (stats?.productivityScore || 0) >= 50 ? 'var(--color-accent)' :
 (stats?.productivityScore || 0) >= 25 ? 'var(--color-accent-3)' : 'var(--color-danger)'
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
 <span className="text-2xl font-bold">{stats?.productivityScore || 0}</span>
 </div>
 </div>
 <div className="flex-1 space-y-2">
 {[
 { label: 'Hours Today', value: `${formatHours(stats?.hoursToday || 0)} / 4h`, pct: Math.min(100, ((stats?.hoursToday || 0) / 4) * 100), color: 'bg-primary' },
 { label: 'Streak Bonus', value: `${stats?.currentStreak || 0} / 30 days`, pct: Math.min(100, ((stats?.currentStreak || 0) / 30) * 100), color: 'bg-primary' },
 { label: 'Consistency', value: 'This week', pct: Math.min(100, ((stats?.weeklyBreakdown?.filter(h => h > 0).length || 0) / 7) * 100), color: 'bg-primary' },
 ].map(item => (
 <div key={item.label}>
 <div className="flex justify-between text-xs mb-0.5">
 <span className="text-muted-foreground">{item.label}</span>
 <span className="text-muted-foreground">{item.value}</span>
 </div>
 <div className="h-1 bg-secondary rounded-full">
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
 <AppFooter />
 </div>
 )
}
