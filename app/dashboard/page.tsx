'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code2, 
  TrendingUp, 
  Clock, 
  Calendar as CalendarIcon,
  Activity,
  Key,
  Copy,
  RefreshCw,
  Check,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
  Timer,
  BarChart3,
  Gauge,
  CalendarDays,
  Search
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

interface Analytics {
  stats: {
    longestStreak: number
    currentStreak: number
    totalHours: number
    totalSessions: number
    topLanguages: { language: string; hours: number }[]
  }
  contributions: Record<string, number>
  weeklyBreakdown: number[]
  recentActivities: any[]
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [dateActivities, setDateActivities] = useState<any[] | null>(null)
  const [dateLoading, setDateLoading] = useState(false)
  
  const currentUser = session?.user

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('dashboard_welcome_seen')
    if (!hasSeenWelcome && session?.user) {
      setShowWelcomePopup(true)
    }
  }, [session])

  const dismissWelcomePopup = () => {
    sessionStorage.setItem('dashboard_welcome_seen', 'true')
    setShowWelcomePopup(false)
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchAnalytics()
      fetchApiKey()
    }
  }, [session])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

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
    } catch (error) {
      setTestStatus('error')
      setTestMessage('Connection test failed.')
    }
    
    setTimeout(() => {
      setTestStatus('idle')
      setTestMessage('')
    }, 5000)
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
    } catch {
      setDateActivities([])
    } finally {
      setDateLoading(false)
    }
  }

  // Radar chart data: hours per day of week
  const radarData = useMemo(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return dayShort.map((day, i) => ({
      day,
      hours: parseFloat((analytics?.weeklyBreakdown[i] || 0).toFixed(1)),
    }))
  }, [analytics?.weeklyBreakdown])

  const radarChartConfig = {
    hours: { label: 'Hours', color: '#2563eb' },
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hasActivity = analytics && (analytics.stats.totalHours > 0 || analytics.stats.totalSessions > 0)

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Developer'}!
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Here&apos;s your coding activity overview
          </p>
        </motion.div>

        {/* Connection Status Banner */}
        {!hasActivity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 sm:p-5 bg-gray-900 border border-gray-800 rounded-xl"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                  <Gauge className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">No activity yet</h3>
                  <p className="text-sm text-gray-400">
                    Connect your VS Code extension to start tracking.
                  </p>
                </div>
              </div>
              <Link
                href="/onboarding"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
              >
                Setup Extension
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard icon={Timer} label="Total Hours" value={analytics?.stats.totalHours.toFixed(1) || '0'} suffix="hrs" color="blue" delay={0.1} />
          <StatCard icon={BarChart3} label="Current Streak" value={analytics?.stats.currentStreak || 0} suffix="days" color="blue" delay={0.15} />
          <StatCard icon={TrendingUp} label="Longest Streak" value={analytics?.stats.longestStreak || 0} suffix="days" color="blue" delay={0.2} />
          <StatCard icon={Gauge} label="Sessions" value={analytics?.stats.totalSessions || 0} suffix="" color="blue" delay={0.25} />
        </div>

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
                  <button onClick={generateApiKey} disabled={apiKeyLoading} className="flex-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors text-gray-300">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Regen
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
                testStatus === 'success' ? 'bg-green-600' : testStatus === 'error' ? 'bg-red-600' : 'bg-blue-600'
              }`}>
                {testStatus === 'success' ? <CheckCircle2 className="w-4 h-4 text-white" /> :
                 testStatus === 'error' ? <AlertCircle className="w-4 h-4 text-white" /> :
                 <Gauge className="w-4 h-4 text-white" />}
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">Connection</h3>
                <p className="text-xs text-gray-500">
                  {testStatus === 'success' ? 'Connected' : testStatus === 'error' ? 'Not Connected' : 'Test your setup'}
                </p>
              </div>
            </div>
            
            <button
              onClick={testConnection}
              disabled={testStatus === 'testing'}
              className={`w-full px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
                testStatus === 'success' ? 'bg-green-600/20 text-green-400 border border-green-600/30' :
                testStatus === 'error' ? 'bg-red-600/20 text-red-400 border border-red-600/30' :
                'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
              {testStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {testStatus === 'error' && <AlertCircle className="w-4 h-4" />}
              {testStatus === 'idle' && <Gauge className="w-4 h-4" />}
              {testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? 'Connected!' : testStatus === 'error' ? 'Check Setup' : 'Test Connection'}
            </button>
            
            {testMessage && (
              <p className={`mt-2 text-xs ${testStatus === 'success' ? 'text-green-400' : testStatus === 'error' ? 'text-red-400' : 'text-gray-500'}`}>
                {testMessage}
              </p>
            )}
          </motion.div>

          {/* Quick Links */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">Quick Links</h3>
                <p className="text-xs text-gray-500">Helpful resources</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/onboarding" className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm text-gray-300">
                <Code2 className="w-4 h-4 text-gray-500" />
                Setup Guide
              </Link>
              <Link href="/settings" className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm text-gray-300">
                <Key className="w-4 h-4 text-gray-500" />
                Settings
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
            <span className="text-xs sm:text-sm text-gray-500">Last 365 days</span>
          </div>
          <ContributionGraph contributions={analytics?.contributions || {}} />
        </motion.div>

        {/* Radar Chart + Date Range Picker Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Radar Chart - Weekly Activity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-white mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              Weekly Activity Radar
            </h2>
            <ChartContainer config={radarChartConfig} className="mx-auto aspect-square max-h-[300px] w-full">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Radar name="hours" dataKey="hours" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
              </RadarChart>
            </ChartContainer>
          </motion.div>

          {/* Date Range Activity Lookup */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-white mb-4">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              Activity Lookup
            </h2>
            <p className="text-sm text-gray-400 mb-4">Select a date range to view your VS Code activity</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white">
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <span>{format(dateRange.from, 'MMM d, yyyy')} – {format(dateRange.to, 'MMM d, yyyy')}</span>
                      ) : (
                        format(dateRange.from, 'MMM d, yyyy')
                      )
                    ) : (
                      <span className="text-gray-500">Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    disabled={{ after: new Date() }}
                  />
                </PopoverContent>
              </Popover>

              <Button
                onClick={fetchDateActivities}
                disabled={!dateRange?.from || dateLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white shrink-0"
              >
                {dateLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Search
              </Button>
            </div>

            {/* Results */}
            {dateActivities !== null && (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Weekly Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4 text-white">Weekly Activity</h2>
            <div className="space-y-2.5">
              {dayNames.map((day, i) => {
                const hours = analytics?.weeklyBreakdown[i] || 0
                const maxHours = Math.max(...(analytics?.weeklyBreakdown || [1]))
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
            {analytics?.stats.topLanguages && analytics.stats.topLanguages.length > 0 ? (
              <div className="space-y-2.5">
                {analytics.stats.topLanguages.slice(0, 5).map((lang, i) => {
                  const maxHours = analytics.stats.topLanguages[0]?.hours || 1
                  const percentage = (lang.hours / maxHours) * 100
                  return (
                    <div key={lang.language} className="flex items-center gap-3">
                      <span className="w-20 text-xs truncate text-gray-300">{lang.language}</span>
                      <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ delay: 0.65 + i * 0.05, duration: 0.5 }} className="h-full bg-linear-to-r from-blue-600 to-purple-600 rounded" />
                      </div>
                      <span className="w-12 text-xs text-right text-gray-400">{lang.hours.toFixed(1)}h</span>
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
      </main>

      {/* Welcome Popup */}
      <AnimatePresence>
        {showWelcomePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="relative p-6 bg-blue-600">
                <button onClick={dismissWelcomePopup} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
                <h2 className="text-xl font-bold text-white">Welcome to Your Dashboard!</h2>
                <p className="text-white/80 text-sm mt-1">Track your real coding activity</p>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="space-y-3">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-blue-400" />
                    How it works
                  </h3>
                  <ul className="space-y-2.5 text-sm text-gray-400">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
                      <span>Generate an API key from this dashboard</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                      <span>Install our VS Code extension and configure the API key</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                      <span>Start coding! Your activity will appear here automatically</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
                  <p className="text-sm text-blue-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span><strong>Privacy first:</strong> We only track time and language usage. No code content or sensitive file names are stored.</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={dismissWelcomePopup} className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-300">
                    Got it
                  </button>
                  <Link href="/onboarding" onClick={dismissWelcomePopup} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                    Setup Extension
                    <ArrowRight className="w-4 h-4" />
                  </Link>
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
  const iconBg: Record<string, string> = {
    blue: 'bg-blue-600',
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
      <div className={`w-8 h-8 rounded-lg ${iconBg[color]} flex items-center justify-center mb-3`}>
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
  const days = 7
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (weeks * days))
  const startDayOfWeek = startDate.getDay()
  startDate.setDate(startDate.getDate() - startDayOfWeek)

  const getLevel = (hours: number): number => {
    if (!hours || hours === 0) return 0
    if (hours < 1) return 1
    if (hours < 3) return 2
    if (hours < 5) return 3
    return 4
  }

  const levelColors = ['bg-gray-800', 'bg-blue-900', 'bg-blue-700', 'bg-blue-500', 'bg-blue-400']

  const weekColumns = []
  const currentDate = new Date(startDate)
  
  for (let week = 0; week < weeks; week++) {
    const daysArray = []
    for (let day = 0; day < 7; day++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const hours = contributions[dateStr] || 0
      const level = getLevel(hours)
      daysArray.push(
        <div key={dateStr} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm ${levelColors[level]} transition-colors`} title={`${dateStr}: ${hours.toFixed(1)} hours`} />
      )
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weekColumns.push(<div key={week} className="flex flex-col gap-0.5 sm:gap-1">{daysArray}</div>)
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5 sm:gap-1 min-w-max">{weekColumns}</div>
      <div className="flex items-center justify-end gap-1.5 mt-3 text-xs text-gray-500">
        <span>Less</span>
        {levelColors.map((color, i) => (<div key={i} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm ${color}`} />))}
        <span>More</span>
      </div>
    </div>
  )
}
