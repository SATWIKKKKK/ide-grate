'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
 Code2, Clock, Flame, TrendingUp, Calendar as CalendarIcon,
 Trophy, Globe, ExternalLink, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { ACHIEVEMENTS } from '@/lib/achievements'

interface ProfileData {
 user: {
 name: string | null
 username: string
 image: string | null
 bio: string | null
 createdAt: string
 }
 stats: {
 totalHours: number
 currentStreak: number
 longestStreak: number
 activeDays: number
 } | null
 languages: { language: string; hours: number; percentage: number }[] | null
 achievements: string[]
 contributions: Record<string, number> | null
 privacy: {
 showHours: boolean
 showLanguages: boolean
 showStreak: boolean
 showHeatmap: boolean
 }
}

export default function PublicProfile() {
 const params = useParams()
 const username = params.username as string
 const [profile, setProfile] = useState<ProfileData | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
 if (username) fetchProfile()
 }, [username])

 const fetchProfile = async () => {
 try {
 const res = await fetch(`/api/profile/${username}`)
 if (res.status === 404) {
 setError('User not found')
 } else if (res.status === 403) {
 setError('This profile is private')
 } else if (res.ok) {
 setProfile(await res.json())
 } else {
 setError('Failed to load profile')
 }
 } catch {
 setError('Failed to load profile')
 }
 setLoading(false)
 }

 if (loading) {
 return (
 <div className="min-h-screen bg-background flex items-center justify-center">
 <div className="w-8 h-8 border-4 border-primary/30 border-t-blue-500 rounded-full animate-spin" />
 </div>
 )
 }

 if (error) {
 return (
 <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
 <div className="text-center">
 <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
 <Code2 className="w-10 h-10 text-muted-foreground" />
 </div>
 <h1 className="text-2xl font-bold mb-2">{error}</h1>
 <p className="text-muted-foreground mb-6 text-sm">
 {error === 'This profile is private' ? 'This user has chosen to keep their profile private.' : 'The user you are looking for does not exist.'}
 </p>
 <Link href="/" className="px-5 py-2.5 bg-primary hover:bg-primary text-foreground rounded-lg inline-flex items-center gap-2 text-sm transition-colors">
 <ArrowLeft className="w-4 h-4" />
 Go Home
 </Link>
 </div>
 </div>
 )
 }

 if (!profile) return null

 const { user, stats, languages, achievements: userAchievementIds, contributions, privacy } = profile
 const unlockedAchievements = ACHIEVEMENTS.filter(a => userAchievementIds.includes(a.id))
 const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

 return (
 <div className="min-h-screen bg-background text-foreground">
 {/* Header */}
 <div className="border-b border-border">
 <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
 <Link href="/" className="text-primary hover:text-primary flex items-center gap-2 text-sm">
 <ArrowLeft className="w-4 h-4" />
 VS-Integrate
 </Link>
 <div className="flex items-center gap-2">
 <a href={`/api/widget/${username}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-secondary hover:bg-secondary rounded-lg text-xs text-muted-foreground flex items-center gap-1.5 transition-colors">
 <Globe className="w-3 h-3" />
 Widget
 </a>
 </div>
 </div>
 </div>

 <main className="max-w-4xl mx-auto px-4 py-8">
 {/* Profile Header */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-5 mb-8">
 <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden shrink-0">
 {user.image ? (
 <img src={user.image} alt={user.name || username} className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
 {(user.name || username)[0]?.toUpperCase()}
 </div>
 )}
 </div>
 <div>
 <h1 className="text-2xl font-bold text-foreground">{user.name || username}</h1>
 <p className="text-muted-foreground text-sm">@{username}</p>
 {user.bio && <p className="text-muted-foreground text-sm mt-2">{user.bio}</p>}
 <p className="text-muted-foreground text-xs mt-2 flex items-center gap-1.5">
 <CalendarIcon className="w-3 h-3" />
 Joined {joinDate}
 </p>
 </div>
 </motion.div>

 {/* Stats Cards */}
 {stats && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
 {privacy.showHours && (
 <div className="bg-card border border-border rounded-xl p-4 text-center">
 <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
 <p className="text-xl font-bold">{stats.totalHours.toFixed(1)}</p>
 <p className="text-xs text-muted-foreground">Total Hours</p>
 </div>
 )}
 {privacy.showStreak && (
 <>
 <div className="bg-card border border-border rounded-xl p-4 text-center">
 <Flame className="w-5 h-5 text-orange-400 mx-auto mb-2" />
 <p className="text-xl font-bold">{stats.currentStreak}</p>
 <p className="text-xs text-muted-foreground">Current Streak</p>
 </div>
 <div className="bg-card border border-border rounded-xl p-4 text-center">
 <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
 <p className="text-xl font-bold">{stats.longestStreak}</p>
 <p className="text-xs text-muted-foreground">Longest Streak</p>
 </div>
 </>
 )}
 <div className="bg-card border border-border rounded-xl p-4 text-center">
 <CalendarIcon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
 <p className="text-xl font-bold">{stats.activeDays}</p>
 <p className="text-xs text-muted-foreground">Active Days</p>
 </div>
 </motion.div>
 )}

 {/* Contribution Graph */}
 {contributions && privacy.showHeatmap && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-5 mb-6">
 <h2 className="text-base font-semibold flex items-center gap-2 text-foreground mb-4">
 <CalendarIcon className="w-4 h-4 text-primary" />
 Contributions
 </h2>
 <PublicContributionGraph contributions={contributions} />
 </motion.div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
 {/* Top Languages */}
 {languages && privacy.showLanguages && languages.length > 0 && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-5">
 <h2 className="text-base font-semibold mb-4 text-foreground flex items-center gap-2">
 <Code2 className="w-4 h-4 text-primary" />
 Top Languages
 </h2>
 <div className="space-y-3">
 {languages.slice(0, 6).map((lang) => (
 <div key={lang.language} className="flex items-center gap-3">
 <span className="w-20 text-xs truncate text-muted-foreground">{lang.language}</span>
 <div className="flex-1 h-4 bg-secondary rounded overflow-hidden">
 <div className="h-full bg-secondary to-purple-600 rounded" style={{ width: `${lang.percentage}%` }} />
 </div>
 <span className="w-14 text-xs text-right text-muted-foreground">{lang.percentage}%</span>
 </div>
 ))}
 </div>
 </motion.div>
 )}

 {/* Achievements */}
 {unlockedAchievements.length > 0 && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card border border-border rounded-xl p-5">
 <h2 className="text-base font-semibold mb-4 text-foreground flex items-center gap-2">
 <Trophy className="w-4 h-4 text-yellow-500" />
 Achievements ({unlockedAchievements.length})
 </h2>
 <div className="grid grid-cols-5 gap-2">
 {unlockedAchievements.map(a => (
 <div key={a.id} className="flex flex-col items-center p-2 bg-secondary rounded-lg" title={`${a.title}: ${a.description}`}>
 <span className="text-2xl">{a.icon}</span>
 <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">{a.title}</span>
 </div>
 ))}
 </div>
 </motion.div>
 )}
 </div>

 {/* Embed Widget */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-xl p-5">
 <h2 className="text-base font-semibold mb-3 text-foreground flex items-center gap-2">
 <Globe className="w-4 h-4 text-primary" />
 Embed Widget
 </h2>
 <p className="text-sm text-muted-foreground mb-3">Add this to your GitHub README or website:</p>
 <div className="bg-secondary rounded-lg p-3 font-mono text-xs text-muted-foreground break-all select-all">
 {`![VS-Integrate Stats](${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget/${username})`}
 </div>
 </motion.div>

 {/* CTA */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-8 text-center">
 <p className="text-muted-foreground text-sm mb-3">Track your own coding activity</p>
 <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary text-foreground rounded-lg text-sm font-medium transition-colors">
 <Code2 className="w-4 h-4" />
 Get Started Free
 </Link>
 </motion.div>
 </main>
 </div>
 )
}

function PublicContributionGraph({ contributions }: { contributions: Record<string, number> }) {
 const weeks = 52
 const today = new Date()
 const startDate = new Date(today)
 startDate.setDate(startDate.getDate() - (weeks * 7))
 startDate.setDate(startDate.getDate() - startDate.getDay())

 const getColor = (hours: number): string => {
 if (!hours || hours === 0) return '#1e2530'
 if (hours < 1) return '#0e4429'
 if (hours < 2) return '#006d32'
 if (hours < 4) return '#26a641'
 return '#39d353'
 }

 const weekColumns = []
 const currentDate = new Date(startDate)
 
 for (let week = 0; week < weeks; week++) {
 const daysArray = []
 for (let day = 0; day < 7; day++) {
 const dateStr = currentDate.toISOString().split('T')[0]
 const hours = contributions[dateStr] || 0
 daysArray.push(
 <div key={dateStr} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getColor(hours) }} title={`${dateStr}: ${hours.toFixed(1)}h`} />
 )
 currentDate.setDate(currentDate.getDate() + 1)
 }
 weekColumns.push(<div key={week} className="flex flex-col gap-0.5">{daysArray}</div>)
 }

 return (
 <div className="overflow-x-auto">
 <div className="flex gap-0.5 min-w-max">{weekColumns}</div>
 <div className="flex items-center justify-end gap-1.5 mt-2 text-xs text-muted-foreground">
 <span>Less</span>
 {['#1e2530', '#0e4429', '#006d32', '#26a641', '#39d353'].map(c => (
 <div key={c} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
 ))}
 <span>More</span>
 </div>
 </div>
 )
}
