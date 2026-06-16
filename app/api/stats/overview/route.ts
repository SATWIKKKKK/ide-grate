import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireServerUser } from "@/lib/serverAuth"
import { IDE_CONFIG, IDE_OPTIONS, type IdeId, validateIdeParam } from "@/lib/ide-config"
import { normalizeLanguageKey } from "@/lib/languages"

type OverviewActivity = {
  ide: string
  startTime: Date
  endTime: Date
  duration: number
  language: string | null
  projectHash: string | null
  projectName: string | null
}

type OverviewContribution = {
  ide: string
  date: Date
  hours: number
  sessions: number
}

// GET /api/stats/overview - Comprehensive stats for dashboard.
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const requestedIde = searchParams.get("ide")
    const ide = validateIdeParam(requestedIde)
    if (requestedIde && !ide) {
      return NextResponse.json({ error: "Unsupported IDE" }, { status: 400 })
    }

    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const ideFilter = ide ? { ide } : {}

    const [activities, allActivities, userStats, contributions, allContributions, metricContributions, ideSetups] = await Promise.all([
      prisma.activity.findMany({
        where: { userId: sessionUser.id, startTime: { gte: yearStart }, ...ideFilter },
        select: { ide: true, startTime: true, endTime: true, duration: true, language: true, projectHash: true, projectName: true },
      }),
      prisma.activity.findMany({
        where: { userId: sessionUser.id, startTime: { gte: yearStart } },
        select: { ide: true, startTime: true, endTime: true, duration: true },
      }),
      prisma.userStats.findUnique({
        where: { userId: sessionUser.id },
        select: { totalHours: true, totalSessions: true, topLanguages: true, monthlyData: true },
      }),
      prisma.dailyContribution.findMany({
        where: { userId: sessionUser.id, date: { gte: yearStart }, ...ideFilter },
      }),
      prisma.dailyContribution.findMany({
        where: { userId: sessionUser.id, date: { gte: yearStart } },
        select: { ide: true, date: true, hours: true, sessions: true },
      }),
      prisma.dailyContribution.findMany({
        where: { userId: sessionUser.id, ...ideFilter },
        select: { ide: true, date: true, hours: true, sessions: true },
      }),
      prisma.userIdeSetup.findMany({
        where: { userId: sessionUser.id },
        select: { ide: true, isActive: true, lastHeartbeat: true, connectedAt: true },
      }),
    ])

    const storedMonthlyData = (userStats?.monthlyData as Record<string, unknown>) || {}
    const storedTzOffset = typeof storedMonthlyData.timezoneOffset === "number" ? storedMonthlyData.timezoneOffset : null
    const todayKey = storedTzOffset !== null
      ? new Date(now.getTime() - storedTzOffset * 60000).toISOString().split("T")[0]
      : now.toISOString().split("T")[0]

    const totalSeconds = activities.reduce((s, a) => s + a.duration, 0)
    const totalHours = metricContributions.reduce((sum, contribution) => sum + contribution.hours, 0)
    const contributionSessions = metricContributions.reduce((sum, contribution) => sum + contribution.sessions, 0)
    const totalSessions = contributionSessions || (ide ? activities.length : (userStats?.totalSessions ?? activities.length))

    const contributionHoursByDate = sumContributionsByDate(contributions)
    const metricHoursByDate = sumContributionsByDate(metricContributions)
    const activeDays = Object.values(metricHoursByDate).filter((hours) => hours > 0).length
    const avgDailyHours = activeDays > 0 ? totalHours / activeDays : 0

    const sortedDates = Object.entries(contributionHoursByDate)
      .filter(([, hours]) => hours > 0)
      .map(([date]) => date)
      .sort()
      .reverse()
    const { currentStreak, longestStreak } = calculateStreaks(sortedDates, todayKey)

    const languageTotals = resolveLanguageTotals(activities, userStats?.topLanguages, storedMonthlyData, ide)
    const totalLangSeconds = Object.values(languageTotals).reduce((s, v) => s + v, 0) || 1
    const topLanguages = Object.entries(languageTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([lang, secs]) => ({
        language: lang,
        hours: parseFloat((secs / 3600).toFixed(2)),
        percentage: Math.round((secs / totalLangSeconds) * 100),
      }))

    const weeklyBreakdown = Array(7).fill(0)
    const last7DaysStart = new Date(now)
    last7DaysStart.setDate(now.getDate() - 6)
    last7DaysStart.setHours(0, 0, 0, 0)
    contributions
      .filter((c) => new Date(c.date) >= last7DaysStart)
      .forEach((c) => {
        weeklyBreakdown[new Date(c.date).getDay()] += c.hours
      })

    const activeDaysThisWeek = new Set(contributions
      .filter((c) => new Date(c.date) >= weekStart && c.hours > 0)
      .map((c) => new Date(c.date).toISOString().split("T")[0])).size

    const hoursToday = contributionHoursByDate[todayKey] || 0
    const maxDayHours = Math.max(0, ...Object.values(contributionHoursByDate))
    const hasEarlySession = activities.some((a) => new Date(a.startTime).getHours() < 7)
    const hasLateSession = activities.some((a) => new Date(a.startTime).getHours() < 4)
    const avgSessionMinutes = activities.length > 0 ? (totalSeconds / activities.length) / 60 : 0
    const productivityScore = calculateProductivityScore(hoursToday, currentStreak, activeDaysThisWeek, avgSessionMinutes)

    const todayStart = new Date(todayKey)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)
    const todayActivities = await prisma.activity.findMany({
      where: {
        userId: sessionUser.id,
        ...ideFilter,
        OR: [
          { startTime: { gte: todayStart, lt: todayEnd } },
          { startTime: { lt: todayStart }, endTime: { gte: todayStart } },
        ],
      },
      orderBy: { startTime: "asc" },
      select: { ide: true, startTime: true, endTime: true, duration: true },
    })

    const projects = buildProjects(activities, storedMonthlyData, totalSeconds)
    const ideBreakdown = buildIdeBreakdown(allActivities, allContributions, ideSetups)

    return NextResponse.json({
      selectedIde: ide || "combined",
      totalHours: parseFloat(totalHours.toFixed(1)),
      activeDays,
      avgDailyHours: parseFloat(avgDailyHours.toFixed(1)),
      currentStreak,
      longestStreak,
      totalSessions,
      uniqueLanguages: Object.keys(languageTotals).length,
      hoursToday: parseFloat(hoursToday.toFixed(2)),
      maxDayHours: parseFloat(maxDayHours.toFixed(1)),
      hasEarlySession,
      hasLateSession,
      productivityScore,
      topLanguages,
      weeklyBreakdown: weeklyBreakdown.map((h) => parseFloat(h.toFixed(2))),
      projects,
      ideBreakdown,
      todaySessions: todayActivities.map((a) => ({
        ide: a.ide,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        duration: a.duration,
      })),
      achievementStats: {
        totalSessions,
        totalHours: parseFloat(totalHours.toFixed(1)),
        longestStreak,
        currentStreak,
        uniqueLanguages: Object.keys(languageTotals).length,
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

function sumContributionsByDate(contributions: OverviewContribution[] | Array<{ date: Date; hours: number }>) {
  const map: Record<string, number> = {}
  contributions.forEach((c) => {
    const key = new Date(c.date).toISOString().split("T")[0]
    map[key] = (map[key] || 0) + c.hours
  })
  return map
}

function calculateStreaks(sortedDates: string[], todayKey: string) {
  let currentStreak = 0
  let longestStreak = 0
  if (sortedDates.length === 0) return { currentStreak, longestStreak }

  const yesterdayDate = new Date(todayKey)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0]
  let checkDate = sortedDates[0] === todayKey || sortedDates[0] === yesterdayStr ? new Date(sortedDates[0]) : null
  if (checkDate) {
    const dateSet = new Set(sortedDates)
    while (dateSet.has(checkDate.toISOString().split("T")[0])) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  let streak = 1
  const allDates = [...sortedDates].reverse()
  for (let i = 1; i < allDates.length; i++) {
    const diffDays = (new Date(allDates[i]).getTime() - new Date(allDates[i - 1]).getTime()) / 86400000
    if (diffDays === 1) {
      streak++
    } else {
      longestStreak = Math.max(longestStreak, streak)
      streak = 1
    }
  }
  longestStreak = Math.max(longestStreak, streak, currentStreak)
  return { currentStreak, longestStreak }
}

function resolveLanguageTotals(
  activities: Array<{ language: string | null; duration: number }>,
  persisted: unknown,
  monthlyData: Record<string, unknown>,
  ide: IdeId | null
) {
  if (ide) {
    const totalsByIde = monthlyData.languageTotalsByIde as Record<string, unknown> | undefined
    const ideTotals = parseLanguageTotals(totalsByIde?.[ide])
    if (Object.keys(ideTotals).length > 0) return ideTotals
    return aggregateLanguagesFromActivities(activities)
  }

  const persistedTotals = parseLanguageTotals(persisted)
  return Object.keys(persistedTotals).length > 0 ? persistedTotals : aggregateLanguagesFromActivities(activities)
}

function parseLanguageTotals(raw: unknown): Record<string, number> {
  if (!raw) return {}
  if (Array.isArray(raw)) {
    const fromArray: Record<string, number> = {}
    raw.forEach((entry) => {
      const item = entry as { language?: unknown; hours?: unknown; seconds?: unknown }
      const language = normalizeLanguageKey(item.language)
      if (!language) return
      if (typeof item.seconds === "number" && Number.isFinite(item.seconds) && item.seconds > 0) {
        fromArray[language] = (fromArray[language] || 0) + item.seconds
        return
      }
      if (typeof item.hours === "number" && Number.isFinite(item.hours) && item.hours > 0) {
        fromArray[language] = (fromArray[language] || 0) + item.hours * 3600
      }
    })
    return fromArray
  }
  if (typeof raw === "object") {
    const fromObject: Record<string, number> = {}
    Object.entries(raw as Record<string, unknown>).forEach(([language, value]) => {
      const key = normalizeLanguageKey(language)
      if (!key) return
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return
      fromObject[key] = value
    })
    return fromObject
  }
  return {}
}

function aggregateLanguagesFromActivities(activities: Array<{ language: string | null; duration: number }>) {
  const languageTotals: Record<string, number> = {}
  activities.forEach((a) => {
    const key = normalizeLanguageKey(a.language)
    if (!key) return
    languageTotals[key] = (languageTotals[key] || 0) + a.duration
  })
  return languageTotals
}

function buildProjects(activities: OverviewActivity[], monthlyData: Record<string, unknown>, totalSeconds: number) {
  const projectTotals: Record<string, { hash: string; name: string | null; seconds: number }> = {}
  activities.forEach((a) => {
    const key = a.projectHash || "unknown"
    projectTotals[key] ||= { hash: key, name: a.projectName, seconds: 0 }
    projectTotals[key].seconds += a.duration
  })

  const projectRepos = (monthlyData.projectRepos as Record<string, string>) || {}
  return Object.values(projectTotals)
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 10)
    .map((p) => {
      const repoUrl = projectRepos[p.hash] || null
      return {
        hash: p.hash,
        name: deriveProjectName(p.name, repoUrl, p.hash),
        hours: parseFloat((p.seconds / 3600).toFixed(1)),
        percentage: Math.round((p.seconds / Math.max(totalSeconds, 1)) * 100),
        repoUrl,
      }
    })
}

function buildIdeBreakdown(
  activities: Pick<OverviewActivity, "ide" | "startTime" | "endTime" | "duration">[],
  contributions: OverviewContribution[],
  setups: Array<{ ide: string; isActive: boolean; lastHeartbeat: Date | null; connectedAt: Date }>
) {
  const setupMap = new Map(setups.map((setup) => [setup.ide, setup]))
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  return IDE_OPTIONS.map((definition) => {
    const ideActivities = activities.filter((activity) => activity.ide === definition.id)
    const ideContributions = contributions.filter((contribution) => contribution.ide === definition.id)
    const seconds = ideActivities.reduce((sum, activity) => sum + activity.duration, 0)
    const activeDays = new Set(ideContributions.filter((c) => c.hours > 0).map((c) => c.date.toISOString().split("T")[0])).size
    const lastActivity = ideActivities.reduce<Date | null>((latest, activity) => {
      if (!latest || activity.endTime > latest) return activity.endTime
      return latest
    }, null)
    const setup = setupMap.get(definition.id)

    return {
      id: definition.id,
      name: IDE_CONFIG[definition.id].shortName,
      color: definition.color,
      hours: parseFloat((seconds / 3600).toFixed(1)),
      sessions: ideActivities.length,
      activeDays,
      isSetup: Boolean(setup?.isActive),
      active: Boolean(setup?.lastHeartbeat && setup.lastHeartbeat >= fiveMinutesAgo),
      lastHeartbeat: setup?.lastHeartbeat?.toISOString() || null,
      lastActivityAt: lastActivity?.toISOString() || null,
    }
  })
}

function calculateProductivityScore(hoursToday: number, streakDays: number, activeDaysThisWeek: number, avgSessionMinutes: number): number {
  const factors = {
    hoursToday: Math.min(hoursToday / 4, 1) * 30,
    streakBonus: Math.min(streakDays / 30, 1) * 20,
    consistencyScore: (activeDaysThisWeek / 7) * 25,
    focusScore: Math.min(avgSessionMinutes / 60, 1) * 25,
  }
  return Math.round(Object.values(factors).reduce((s, v) => s + v, 0))
}

function deriveProjectName(projectName: string | null, repoUrl: string | null, hash: string): string {
  const cleaned = (projectName || "").trim()
  if (cleaned && cleaned.toLowerCase() !== "unknown") return cleaned
  if (repoUrl) {
    const repoName = repoUrl.replace(/\/+$/, "").split("/").pop()
    if (repoName) return decodeURIComponent(repoName)
  }
  return `Project ${hash.slice(0, 8)}`
}
