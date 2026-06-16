import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireServerUser } from "@/lib/serverAuth"
import { IDE_OPTIONS } from "@/lib/ide-config"
import { normalizeLanguageKey } from "@/lib/languages"

// GET /api/analytics/combined - Combined analytics with per-IDE breakdowns.
export async function GET() {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [activities, contributions, setups] = await Promise.all([
      prisma.activity.findMany({
        where: { userId: sessionUser.id },
        select: { ide: true, startTime: true, duration: true, language: true },
      }),
      prisma.dailyContribution.findMany({
        where: { userId: sessionUser.id },
        select: { ide: true, date: true, hours: true, sessions: true },
      }),
      prisma.userIdeSetup.findMany({
        where: { userId: sessionUser.id },
        select: { ide: true, isActive: true, lastHeartbeat: true },
      }),
    ])

    const contributionsByDate: Record<string, { hours: number; sessions: number; byIde: Record<string, number> }> = {}
    contributions.forEach((contribution) => {
      const key = contribution.date.toISOString().split("T")[0]
      contributionsByDate[key] ||= { hours: 0, sessions: 0, byIde: {} }
      contributionsByDate[key].hours += contribution.hours
      contributionsByDate[key].sessions += contribution.sessions
      contributionsByDate[key].byIde[contribution.ide] = (contributionsByDate[key].byIde[contribution.ide] || 0) + contribution.hours
    })

    const languageTotals: Record<string, number> = {}
    const hourlyActivity = Array(24).fill(0)
    activities.forEach((activity) => {
      const language = normalizeLanguageKey(activity.language)
      if (language) {
        languageTotals[language] = (languageTotals[language] || 0) + activity.duration
      }
      hourlyActivity[new Date(activity.startTime).getHours()] += activity.duration / 3600
    })

    const totalHours = contributions.reduce((sum, contribution) => sum + contribution.hours, 0)
    const ideBreakdown = IDE_OPTIONS.map((definition) => {
      const ideContributions = contributions.filter((contribution) => contribution.ide === definition.id)
      const hours = ideContributions.reduce((sum, contribution) => sum + contribution.hours, 0)
      const sessions = ideContributions.reduce((sum, contribution) => sum + contribution.sessions, 0)
      const activeDates = Array.from(new Set(
        ideContributions
          .filter((contribution) => contribution.hours > 0)
          .map((contribution) => contribution.date.toISOString().split("T")[0])
      )).sort()
      const streaks = calculateStreaks(activeDates)
      const setup = setups.find((item) => item.ide === definition.id)
      return {
        id: definition.id,
        name: definition.shortName,
        color: definition.color,
        hours: parseFloat(hours.toFixed(1)),
        sessions,
        activeDays: activeDates.length,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        connected: Boolean(setup?.isActive && setup.lastHeartbeat),
        active: Boolean(setup?.lastHeartbeat && setup.lastHeartbeat >= new Date(Date.now() - 5 * 60 * 1000)),
        percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
      }
    })
    const usedBreakdown = ideBreakdown.filter((item) => item.hours > 0)
    const mostUsed = usedBreakdown.length ? [...usedBreakdown].sort((a, b) => b.hours - a.hours)[0] : null
    const leastUsed = usedBreakdown.length ? [...usedBreakdown].sort((a, b) => a.hours - b.hours)[0] : null

    const totalLanguageSeconds = Object.values(languageTotals).reduce((sum, seconds) => sum + seconds, 0) || 1
    const topLanguages = Object.entries(languageTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([language, seconds]) => ({
        language,
        hours: parseFloat((seconds / 3600).toFixed(1)),
        percentage: Math.round((seconds / totalLanguageSeconds) * 100),
      }))

    return NextResponse.json({
      totalHours: parseFloat(totalHours.toFixed(1)),
      activeDays: Object.values(contributionsByDate).filter((day) => day.hours > 0).length,
      contributions: contributionsByDate,
      ideBreakdown,
      mostUsed,
      leastUsed,
      topLanguages,
      hourlyActivity: hourlyActivity.map((hours) => parseFloat(hours.toFixed(2))),
    })
  } catch (error) {
    console.error("Error fetching combined analytics:", error)
    return NextResponse.json({ error: "Failed to fetch combined analytics" }, { status: 500 })
  }
}

function calculateStreaks(sortedDatesAsc: string[]) {
  if (sortedDatesAsc.length === 0) return { currentStreak: 0, longestStreak: 0 }
  const dateSet = new Set(sortedDatesAsc)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  let currentCursor = dateSet.has(today.toISOString().split("T")[0])
    ? today
    : dateSet.has(yesterday.toISOString().split("T")[0])
      ? yesterday
      : null
  let currentStreak = 0
  while (currentCursor && dateSet.has(currentCursor.toISOString().split("T")[0])) {
    currentStreak++
    currentCursor.setDate(currentCursor.getDate() - 1)
  }

  let longestStreak = 1
  let streak = 1
  for (let i = 1; i < sortedDatesAsc.length; i++) {
    const prev = new Date(sortedDatesAsc[i - 1])
    const next = new Date(sortedDatesAsc[i])
    const diffDays = (next.getTime() - prev.getTime()) / 86400000
    streak = diffDays === 1 ? streak + 1 : 1
    longestStreak = Math.max(longestStreak, streak)
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) }
}
