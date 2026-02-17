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
  ChevronDown,
  Key,
  Copy,
  RefreshCw,
  Check,
  Download
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

// Demo data for when auth is disabled
const DEMO_ANALYTICS: Analytics = {
  stats: {
    longestStreak: 14,
    currentStreak: 5,
    totalHours: 127,
    totalSessions: 89,
    topLanguages: [
      { language: 'TypeScript', hours: 45 },
      { language: 'JavaScript', hours: 32 },
      { language: 'Python', hours: 28 },
      { language: 'CSS', hours: 12 },
      { language: 'JSON', hours: 10 },
    ]
  },
  contributions: (() => {
    const contributions: Record<string, number> = {};
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      contributions[dateStr] = Math.random() > 0.3 ? Math.floor(Math.random() * 8) : 0;
    }
    return contributions;
  })(),
  weeklyBreakdown: [2.5, 4.2, 3.8, 5.1, 4.7, 1.2, 0.8],
  recentActivities: [
    { project: 'ide-grate', language: 'TypeScript', duration: 45, timestamp: new Date().toISOString() },
    { project: 'my-app', language: 'JavaScript', duration: 30, timestamp: new Date(Date.now() - 3600000).toISOString() },
  ]
};

const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@example.com',
  image: null
};

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Use demo mode when not authenticated
  const isDemoMode = status === 'unauthenticated' || !session
  const currentUser = isDemoMode ? DEMO_USER : session?.user

  // Skip redirect - allow demo mode
  useEffect(() => {
    // Auth redirect disabled for development
    // if (status === 'unauthenticated') {
    //   router.push('/auth/signin')
    // }
  }, [status, router])

  useEffect(() => {
    if (isDemoMode) {
      // Use demo data
      setAnalytics(DEMO_ANALYTICS)
      setApiKey('demo-api-key-xxxx-xxxx-xxxx')
      setLoading(false)
    } else if (session?.user) {
      fetchAnalytics()
      fetchApiKey()
    }
  }, [session, isDemoMode])

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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Removed auth check - demo mode enabled
  // if (!session) { return null }

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
                {currentUser?.image ? (
                  <img
                    src={currentUser.image}
                    alt={currentUser.name || ''}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {currentUser?.name?.[0] || currentUser?.email?.[0] || '?'}
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:block">
                  {currentUser?.name || currentUser?.email}
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
                    <p className="text-sm font-medium">{currentUser?.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    VS Code Setup
                  </button>
                  <button
                    onClick={() => isDemoMode ? router.push('/auth/signin') : signOut({ callbackUrl: '/' })}
                    className={`w-full px-4 py-3 text-left ${isDemoMode ? 'text-blue-400' : 'text-red-400'} hover:bg-muted flex items-center gap-2 transition-colors`}
                  >
                    <LogOut className="w-4 h-4" />
                    {isDemoMode ? 'Sign In' : 'Sign Out'}
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
          {isDemoMode && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400 text-sm">
              ⚠️ Demo Mode - Sign in to track your real coding activity
            </div>
          )}
          <h1 className="text-3xl font-bold">
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Developer'}!
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

        {/* Getting Started moved to homepage */}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-500" />
                VS Code Extension Setup
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Step 1 */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">1</span>
                  Generate Your API Key
                </h3>
                <p className="text-sm text-muted-foreground">
                  This key connects your VS Code to your account.
                </p>
                
                {apiKey ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono break-all">
                      {apiKey}
                    </code>
                    <button
                      onClick={copyApiKey}
                      className="p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={generateApiKey}
                      disabled={apiKeyLoading}
                      className="p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      title="Regenerate key"
                    >
                      <RefreshCw className={`w-4 h-4 ${apiKeyLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={generateApiKey}
                    disabled={apiKeyLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {apiKeyLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    Generate API Key
                  </button>
                )}
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">2</span>
                  Install the VS Code Extension
                </h3>
                <p className="text-sm text-muted-foreground">
                  Install our extension from the VS Code Marketplace or build from source.
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono mb-2">Build from source:</p>
                  <code className="text-xs text-muted-foreground block">
                    cd vscode-extension && npm install && npm run compile
                  </code>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">3</span>
                  Configure the Extension
                </h3>
                <p className="text-sm text-muted-foreground">
                  In VS Code, open Command Palette (<code className="px-1 bg-muted rounded">Ctrl+Shift+P</code>) and run:
                </p>
                <code className="block p-3 bg-muted rounded-lg text-sm">
                  VS Integrate: Set API Key
                </code>
                <p className="text-sm text-muted-foreground">
                  Paste your API key when prompted. That's it!
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-muted/50">
              <p className="text-xs text-muted-foreground text-center">
                🔒 Privacy: We only track time and language usage. No code content or file names are stored.
              </p>
            </div>
          </motion.div>
        </div>
      )}
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
