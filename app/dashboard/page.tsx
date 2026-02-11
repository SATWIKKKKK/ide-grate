'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Code2, 
  LogOut, 
  TrendingUp, 
  Clock, 
  Flame, 
  Calendar,
  Activity,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react'
import { useTheme } from 'next-themes'

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
  const { theme, setTheme } = useTheme()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchAnalytics()
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-blue-400 bg-clip-text text-transparent">
              vs-integrate
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || ''}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {session.user.name?.[0] || session.user.email?.[0] || '?'}
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:block">
                  {session.user.name || session.user.email}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">
            Welcome back, {session.user.name?.split(' ')[0] || 'Developer'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your coding activity overview
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Clock}
            label="Total Hours"
            value={analytics?.stats.totalHours.toFixed(1) || '0'}
            suffix="hrs"
            color="blue"
            delay={0}
          />
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={analytics?.stats.currentStreak || 0}
            suffix="days"
            color="orange"
            delay={0.1}
          />
          <StatCard
            icon={TrendingUp}
            label="Longest Streak"
            value={analytics?.stats.longestStreak || 0}
            suffix="days"
            color="green"
            delay={0.2}
          />
          <StatCard
            icon={Activity}
            label="Total Sessions"
            value={analytics?.stats.totalSessions || 0}
            suffix=""
            color="purple"
            delay={0.3}
          />
        </div>

        {/* Contribution Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Contribution Graph
            </h2>
            <span className="text-sm text-muted-foreground">Last 365 days</span>
          </div>
          
          <ContributionGraph contributions={analytics?.contributions || {}} />
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-6">Weekly Activity</h2>
            <div className="space-y-3">
              {dayNames.map((day, i) => {
                const hours = analytics?.weeklyBreakdown[i] || 0
                const maxHours = Math.max(...(analytics?.weeklyBreakdown || [1]))
                const percentage = maxHours > 0 ? (hours / maxHours) * 100 : 0
                
                return (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-8 text-sm text-muted-foreground">{day}</span>
                    <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.6 + i * 0.05, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg"
                      />
                    </div>
                    <span className="w-16 text-sm text-right">
                      {hours.toFixed(1)}h
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Top Languages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-6">Top Languages</h2>
            {analytics?.stats.topLanguages && analytics.stats.topLanguages.length > 0 ? (
              <div className="space-y-3">
                {analytics.stats.topLanguages.slice(0, 5).map((lang, i) => {
                  const maxHours = analytics.stats.topLanguages[0]?.hours || 1
                  const percentage = (lang.hours / maxHours) * 100
                  
                  return (
                    <div key={lang.language} className="flex items-center gap-4">
                      <span className="w-24 text-sm truncate">{lang.language}</span>
                      <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.7 + i * 0.05, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"
                        />
                      </div>
                      <span className="w-16 text-sm text-right">
                        {lang.hours.toFixed(1)}h
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Code2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No language data yet</p>
                <p className="text-sm">Start coding to see your top languages!</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Getting Started */}
        {(!analytics?.stats.totalSessions || analytics.stats.totalSessions === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-8 text-center"
          >
            <h2 className="text-xl font-semibold mb-3">Get Started</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Install the VS Code extension to start tracking your coding activity automatically.
              Your data stays private - we only track time, not your code.
            </p>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
              Install VS Code Extension
            </button>
          </motion.div>
        )}
      </main>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  suffix, 
  color, 
  delay 
}: { 
  icon: any
  label: string
  value: number | string
  suffix: string
  color: string
  delay: number
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-border rounded-2xl p-6"
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </motion.div>
  )
}

function ContributionGraph({ contributions }: { contributions: Record<string, number> }) {
  const weeks = 52
  const days = 7
  
  // Generate dates for the last year
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (weeks * days))
  
  // Adjust to start from Sunday
  const startDayOfWeek = startDate.getDay()
  startDate.setDate(startDate.getDate() - startDayOfWeek)

  const getLevel = (hours: number): number => {
    if (!hours || hours === 0) return 0
    if (hours < 1) return 1
    if (hours < 3) return 2
    if (hours < 5) return 3
    return 4
  }

  const levelColors = [
    'bg-muted',
    'bg-blue-900',
    'bg-blue-700',
    'bg-blue-500',
    'bg-blue-400',
  ]

  const weekColumns = []
  const currentDate = new Date(startDate)
  
  for (let week = 0; week < weeks; week++) {
    const days = []
    for (let day = 0; day < 7; day++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const hours = contributions[dateStr] || 0
      const level = getLevel(hours)
      
      days.push(
        <div
          key={dateStr}
          className={`w-3 h-3 rounded-sm ${levelColors[level]} transition-colors`}
          title={`${dateStr}: ${hours.toFixed(1)} hours`}
        />
      )
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weekColumns.push(
      <div key={week} className="flex flex-col gap-1">
        {days}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weekColumns}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        {levelColors.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
