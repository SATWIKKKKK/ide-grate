'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Code2,
  ExternalLink,
  Flame,
  Globe,
  Trophy,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import AppFooter from '@/components/AppFooter'
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
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/public/${username}`)
        if (res.status === 404) setError('User not found')
        else if (res.status === 403) setError('This profile is private')
        else if (res.ok) setProfile(await res.json())
        else setError('Failed to load profile')
      } catch {
        setError('Failed to load profile')
      }
      setLoading(false)
    }
  }, [username])

  if (loading) {
    return <div className="page-shell flex min-h-screen items-center justify-center"><div className="size-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" /></div>
  }

  if (error) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center p-4 text-foreground">
        <div className="signal-panel w-full max-w-md p-8 text-center" data-gsap="fade-up">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-lg bg-secondary">
            <Code2 className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl">{error}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {error === 'This profile is private' ? 'This user has chosen to keep their profile private.' : 'The user you are looking for does not exist.'}
          </p>
          <Link href="/" className="signal-button mt-6">
            <ArrowLeft className="size-4" />
            Go home
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
    <div className="page-shell flex min-h-screen flex-col text-foreground">
      <header className="border-b border-border bg-[var(--color-paper-glass)] backdrop-blur-xl">
        <div className="signal-container flex items-center justify-between py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <ArrowLeft className="size-4 text-muted-foreground" />
            <Logo size="sm" />
          </Link>
          <a href={`/api/widget/${username}`} target="_blank" rel="noopener noreferrer" className="signal-button signal-button-secondary min-h-9 px-3 text-xs">
            <Globe className="size-3.5" />
            Widget
          </a>
        </div>
      </header>

      <main className="signal-container flex-1 py-14 sm:py-16">
        <section className="signal-panel overflow-hidden" data-gsap="fade-up">
          <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="flex items-start gap-5">
              <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                {user.image ? (
                  <img src={user.image} alt={user.name || username} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                    {(user.name || username)[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="signal-kicker">@{username}</p>
                <h1 className="mt-2 text-[clamp(3rem,6vw,4.5rem)] leading-none">{user.name || username}</h1>
                {user.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{user.bio}</p>}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarIcon className="size-3.5" />
                  Joined {joinDate}
                </p>
              </div>
            </div>
            <Link href="/signup" className="signal-button">
              Track your own activity
            </Link>
          </div>
        </section>

        {stats && (
          <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" data-gsap-stagger>
            {privacy.showHours && <ProfileStat icon={<Clock className="size-4" />} label="Total hours" value={stats.totalHours.toFixed(1)} />}
            {privacy.showStreak && (
              <>
                <ProfileStat icon={<Flame className="size-4" />} label="Current streak" value={`${stats.currentStreak}d`} />
                <ProfileStat icon={<TrendingUp className="size-4" />} label="Longest streak" value={`${stats.longestStreak}d`} />
              </>
            )}
            <ProfileStat icon={<CalendarIcon className="size-4" />} label="Active days" value={`${stats.activeDays}`} />
          </section>
        )}

        {contributions && privacy.showHeatmap && (
          <section className="app-card mt-5 p-5" data-gsap="fade-up">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-sans text-lg font-semibold">Contribution signal</h2>
              <CalendarIcon className="size-4 text-primary" />
            </div>
            <PublicContributionGraph contributions={contributions} />
          </section>
        )}

        <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {languages && privacy.showLanguages && languages.length > 0 && (
            <article className="app-card p-5" data-gsap="fade-up">
              <h2 className="mb-4 flex items-center gap-2 font-sans text-lg font-semibold">
                <Code2 className="size-4 text-primary" />
                Top languages
              </h2>
              <div className="space-y-3">
                {languages.slice(0, 6).map((lang) => (
                  <div key={lang.language}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate capitalize text-muted-foreground">{lang.language}</span>
                      <span className="text-muted-foreground">{lang.percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${lang.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {unlockedAchievements.length > 0 && (
            <article className="app-card p-5" data-gsap="fade-up">
              <h2 className="mb-4 flex items-center gap-2 font-sans text-lg font-semibold">
                <Trophy className="size-4 text-primary" />
                Achievements ({unlockedAchievements.length})
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {unlockedAchievements.map(a => (
                  <div key={a.id} className="rounded-md border border-border bg-secondary/65 p-2 text-center" title={`${a.title}: ${a.description}`}>
                    <span className="text-xl">{a.icon}</span>
                    <span className="mt-1 block truncate text-[10px] text-muted-foreground">{a.title}</span>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>

        <section className="app-card mt-5 p-5" data-gsap="fade-up">
          <h2 className="mb-3 flex items-center gap-2 font-sans text-lg font-semibold">
            <Globe className="size-4 text-primary" />
            Embed widget
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">Add this to your GitHub README or website:</p>
          <div className="rounded-md border border-border bg-secondary p-3 font-mono text-xs text-muted-foreground break-all select-all">
            {`![Cadence Stats](${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget/${username})`}
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  )
}

function ProfileStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="app-card p-4" data-gsap-item>
      <div className="mb-3 flex size-8 items-center justify-center rounded-md bg-accent text-primary">{icon}</div>
      <p className="font-mono text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </article>
  )
}

function PublicContributionGraph({ contributions }: { contributions: Record<string, number> }) {
  const weeks = 52
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (weeks * 7))
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const getColor = (hours: number): string => {
    if (!hours || hours === 0) return 'var(--color-contrib-0)'
    if (hours < 1) return 'var(--color-contrib-1)'
    if (hours < 2) return 'var(--color-contrib-2)'
    if (hours < 4) return 'var(--color-contrib-3)'
    return 'var(--color-contrib-4)'
  }

  const weekColumns = []
  const currentDate = new Date(startDate)

  for (let week = 0; week < weeks; week++) {
    const daysArray = []
    for (let day = 0; day < 7; day++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const hours = contributions[dateStr] || 0
      daysArray.push(
        <div key={dateStr} className="size-2.5 rounded-[3px] border border-border" style={{ backgroundColor: getColor(hours) }} title={`${dateStr}: ${hours.toFixed(1)}h`} />
      )
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weekColumns.push(<div key={week} className="flex flex-col gap-0.5">{daysArray}</div>)
  }

  return (
    <div className="heatmap-scroll overflow-x-auto">
      <div className="flex min-w-max gap-0.5">{weekColumns}</div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 0.5, 1.5, 3, 5].map((h) => (
          <div key={h} className="size-2.5 rounded-[3px] border border-border" style={{ backgroundColor: getColor(h) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
