import { NextRequest, NextResponse } from "next/server"
import { requireServerUser } from "@/lib/serverAuth"
import prisma from "@/lib/prisma"

// Non-language file types to exclude from language stats
const NON_LANGUAGES = new Set([
  'dotenv', 'markdown', 'json', 'jsonc', 'yaml', 'yml', 'toml', 'xml',
  'plaintext', 'text', 'log', 'csv', 'tsv', 'ini', 'cfg', 'conf',
  'properties', 'env', 'editorconfig', 'gitignore', 'gitattributes',
  'dockerignore', 'npmignore', 'eslintignore', 'prettierignore',
  'ignore', 'lock', 'svg', 'ico', 'png', 'jpg', 'jpeg', 'gif',
  'bmp', 'webp', 'woff', 'woff2', 'ttf', 'eot', 'otf',
  'binary', 'image', 'font', 'pdf', 'zip', 'tar', 'gz',
])

// GET /api/stats/overview - Comprehensive stats for dashboard
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    // Get all activities this year
    const activities = await prisma.activity.findMany({
      where: {
        userId: sessionUser.id,
        startTime: { gte: yearStart },
      },
      select: {
        startTime: true,
        duration: true,
        language: true,
        projectHash: true,
        projectName: true,
      },
    })

    const userStats = await prisma.userStats.findUnique({
      where: { userId: sessionUser.id },
      select: {
        totalHours: true,
        totalSessions: true,
        topLanguages: true,
        monthlyData: true,
      },
    })

    // Get daily contributions
    const contributions = await prisma.dailyContribution.findMany({
      where: {
        userId: sessionUser.id,
        date: { gte: yearStart },
      },
    })

    // Basic stats
    const totalSeconds = activities.reduce((s, a) => s + a.duration, 0)
    const fallbackTotalHours = totalSeconds / 3600
    const totalHours = userStats?.totalHours ?? fallbackTotalHours
    const totalSessions = userStats?.totalSessions ?? activities.length
    const activeDays = new Set(contributions.filter(c => c.hours > 0).map(c => new Date(c.date).toISOString().split('T')[0])).size
    const avgDailyHours = activeDays > 0 ? totalHours / activeDays : 0

    // Streak calculation from daily contributions
    const sortedDates = contributions
      .filter(c => c.hours > 0)
      .map(c => new Date(c.date).toISOString().split('T')[0])
      .sort()
      .reverse()

    let currentStreak = 0
    let longestStreak = 0
    if (sortedDates.length > 0) {
      const todayStr = now.toISOString().split('T')[0]
      const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0]
      
      // Current streak: count consecutive days back from today/yesterday
      let checkDate = sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr ? new Date(sortedDates[0]) : null
      if (checkDate) {
        const dateSet = new Set(sortedDates)
        while (dateSet.has(checkDate.toISOString().split('T')[0])) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        }
      }

      // Longest streak
      let streak = 1
      const allDates = [...sortedDates].reverse()
      for (let i = 1; i < allDates.length; i++) {
        const prev = new Date(allDates[i - 1])
        const curr = new Date(allDates[i])
        const diffDays = (curr.getTime() - prev.getTime()) / 86400000
        if (diffDays === 1) {
          streak++
        } else {
          longestStreak = Math.max(longestStreak, streak)
          streak = 1
        }
      }
      longestStreak = Math.max(longestStreak, streak)
    }

    // Top languages (prefer persisted per-language totals from heartbeat aggregation)
    const persistedLanguageTotals = parseLanguageTotals(userStats?.topLanguages)
    const languageTotals: Record<string, number> = Object.keys(persistedLanguageTotals).length > 0
      ? persistedLanguageTotals
      : aggregateLanguagesFromActivities(activities)

    const totalLangSeconds = Object.values(languageTotals).reduce((s, v) => s + v, 0) || 1
    const topLanguages = Object.entries(languageTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([lang, secs]) => ({
        language: lang,
        hours: parseFloat((secs / 3600).toFixed(2)),
        percentage: Math.round((secs / totalLangSeconds) * 100),
      }))

    // Unique languages count
    const uniqueLanguages = Object.keys(languageTotals).length

    // Weekly activity (hours per day of week)
    const weeklyBreakdown = Array(7).fill(0)
    const last7DaysStart = new Date(now)
    last7DaysStart.setDate(now.getDate() - 6)
    last7DaysStart.setHours(0, 0, 0, 0)
    contributions
      .filter(c => new Date(c.date) >= last7DaysStart)
      .forEach(c => {
        const day = new Date(c.date).getDay()
        weeklyBreakdown[day] += c.hours
      })

    // Active days this week
    const activeDaysThisWeek = contributions
      .filter(c => new Date(c.date) >= weekStart && c.hours > 0)
      .map(c => new Date(c.date).toISOString().split('T')[0])
    const uniqueActiveDaysThisWeek = new Set(activeDaysThisWeek).size

    // Today's hours
    const todayKey = now.toISOString().split('T')[0]
    const todayContribution = contributions.find(c => new Date(c.date).toISOString().split('T')[0] === todayKey)
    const hoursToday = todayContribution?.hours || 0

    // Max day hours
    const dayHours: Record<string, number> = {}
    contributions.forEach(c => {
      dayHours[new Date(c.date).toISOString().split('T')[0]] = c.hours
    })
    const maxDayHours = Math.max(0, ...Object.values(dayHours))

    // Early/late sessions
    const hasEarlySession = activities.some(a => new Date(a.startTime).getHours() < 7)
    const hasLateSession = activities.some(a => new Date(a.startTime).getHours() >= 0 && new Date(a.startTime).getHours() < 4)

    // Avg session length
    const avgSessionMinutes = activities.length > 0
      ? (totalSeconds / activities.length) / 60
      : 0

    // Productivity score
    const productivityScore = calculateProductivityScore(hoursToday, currentStreak, uniqueActiveDaysThisWeek, avgSessionMinutes)

    // Project breakdown
    const projectTotals: Record<string, { hash: string; name: string | null; seconds: number }> = {}
    activities.forEach(a => {
      const key = a.projectHash || 'unknown'
      if (!projectTotals[key]) {
        projectTotals[key] = { hash: key, name: a.projectName, seconds: 0 }
      }
      projectTotals[key].seconds += a.duration
    })

    // Get project repo URL mappings from UserStats.monthlyData
    const projectRepos = ((userStats?.monthlyData as Record<string, unknown>)?.projectRepos as Record<string, string>) || {}

    const projects = Object.values(projectTotals)
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 10)
      .map(p => {
        const repoUrl = projectRepos[p.hash] || null
        return {
          hash: p.hash,
          name: deriveProjectName(p.name, repoUrl, p.hash),
          hours: parseFloat((p.seconds / 3600).toFixed(1)),
          percentage: Math.round((p.seconds / Math.max(totalSeconds, 1)) * 100),
          repoUrl,
        }
      })

    return NextResponse.json({
      totalHours: parseFloat(totalHours.toFixed(1)),
      activeDays,
      avgDailyHours: parseFloat(avgDailyHours.toFixed(1)),
      currentStreak,
      longestStreak,
      totalSessions,
      uniqueLanguages,
      hoursToday: parseFloat(hoursToday.toFixed(1)),
      maxDayHours: parseFloat(maxDayHours.toFixed(1)),
      hasEarlySession,
      hasLateSession,
      productivityScore,
      topLanguages,
      weeklyBreakdown: weeklyBreakdown.map(h => parseFloat(h.toFixed(2))),
      projects,
      // Achievement stats for frontend
      achievementStats: {
        totalSessions,
        totalHours: parseFloat(totalHours.toFixed(1)),
        longestStreak,
        currentStreak,
        uniqueLanguages,
        hasEarlySession,
        hasLateSession,
        maxDayHours: parseFloat(maxDayHours.toFixed(1)),
        activeDays,
      },
    })
  } catch (error) {
    console.error("Error fetching stats overview:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

function parseLanguageTotals(raw: unknown): Record<string, number> {
  if (!raw) return {}

  if (Array.isArray(raw)) {
    const fromArray: Record<string, number> = {}
    raw.forEach((entry) => {
      const item = entry as { language?: unknown; hours?: unknown; seconds?: unknown }
      const language = typeof item.language === 'string' ? item.language.toLowerCase() : ''
      if (!language || language === 'unknown' || NON_LANGUAGES.has(language)) return

      if (typeof item.seconds === 'number' && Number.isFinite(item.seconds) && item.seconds > 0) {
        fromArray[language] = (fromArray[language] || 0) + item.seconds
        return
      }

      if (typeof item.hours === 'number' && Number.isFinite(item.hours) && item.hours > 0) {
        fromArray[language] = (fromArray[language] || 0) + item.hours * 3600
      }
    })
    return fromArray
  }

  if (typeof raw === 'object') {
    const fromObject: Record<string, number> = {}
    Object.entries(raw as Record<string, unknown>).forEach(([language, value]) => {
      if (!language || language.toLowerCase() === 'unknown' || NON_LANGUAGES.has(language.toLowerCase())) return
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return
      fromObject[language.toLowerCase()] = value
    })
    return fromObject
  }

  return {}
}

function aggregateLanguagesFromActivities(
  activities: Array<{ language: string | null; duration: number }>
): Record<string, number> {
  const languageTotals: Record<string, number> = {}
  activities.forEach((a) => {
    if (a.language && a.language !== 'unknown') {
      const key = a.language.toLowerCase()
      if (NON_LANGUAGES.has(key)) return
      languageTotals[key] = (languageTotals[key] || 0) + a.duration
    }
  })
  return languageTotals
}

function calculateProductivityScore(
  hoursToday: number,
  streakDays: number,
  activeDaysThisWeek: number,
  avgSessionMinutes: number
): number {
  const factors = {
    hoursToday: Math.min(hoursToday / 4, 1) * 30,
    streakBonus: Math.min(streakDays / 30, 1) * 20,
    consistencyScore: (activeDaysThisWeek / 7) * 25,
    focusScore: Math.min(avgSessionMinutes / 60, 1) * 25,
  }
  return Math.round(Object.values(factors).reduce((s, v) => s + v, 0))
}

function deriveProjectName(projectName: string | null, repoUrl: string | null, hash: string): string {
  const cleaned = (projectName || '').trim()
  if (cleaned && cleaned.toLowerCase() !== 'unknown') return cleaned

  if (repoUrl) {
    const repoParts = repoUrl.replace(/\/+$/, '').split('/')
    const repoName = repoParts[repoParts.length - 1]
    if (repoName) return decodeURIComponent(repoName)
  }

  return `Project ${hash.slice(0, 8)}`
}
