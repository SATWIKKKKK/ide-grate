import { NextRequest, NextResponse } from "next/server"
import { requireServerUser } from "@/lib/serverAuth"
import prisma from "@/lib/prisma"

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

    // Get daily contributions
    const contributions = await prisma.dailyContribution.findMany({
      where: {
        userId: sessionUser.id,
        date: { gte: yearStart },
      },
    })

    // Basic stats
    const totalSeconds = activities.reduce((s, a) => s + a.duration, 0)
    const totalHours = totalSeconds / 3600
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

    // Top languages
    const languageTotals: Record<string, number> = {}
    activities.forEach(a => {
      if (a.language && a.language !== 'unknown') {
        languageTotals[a.language] = (languageTotals[a.language] || 0) + a.duration
      }
    })
    const totalLangSeconds = Object.values(languageTotals).reduce((s, v) => s + v, 0) || 1
    const topLanguages = Object.entries(languageTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([lang, secs]) => ({
        language: lang,
        hours: parseFloat((secs / 3600).toFixed(1)),
        percentage: Math.round((secs / totalLangSeconds) * 100),
      }))

    // Unique languages count
    const uniqueLanguages = Object.keys(languageTotals).length

    // Weekly activity (hours per day of week)
    const weeklyBreakdown = Array(7).fill(0)
    const last7DaysStart = new Date(now.getTime() - 7 * 86400000)
    activities
      .filter(a => new Date(a.startTime) >= last7DaysStart)
      .forEach(a => {
        const day = new Date(a.startTime).getDay()
        weeklyBreakdown[day] += a.duration / 3600
      })

    // Active days this week
    const activeDaysThisWeek = activities
      .filter(a => new Date(a.startTime) >= weekStart)
      .map(a => new Date(a.startTime).toISOString().split('T')[0])
    const uniqueActiveDaysThisWeek = new Set(activeDaysThisWeek).size

    // Today's hours
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayActivities = activities.filter(a => new Date(a.startTime) >= todayStart)
    const hoursToday = todayActivities.reduce((s, a) => s + a.duration, 0) / 3600

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
    const projects = Object.values(projectTotals)
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 10)
      .map(p => ({
        hash: p.hash,
        name: p.name,
        hours: parseFloat((p.seconds / 3600).toFixed(1)),
        percentage: Math.round((p.seconds / totalSeconds) * 100),
      }))

    return NextResponse.json({
      totalHours: parseFloat(totalHours.toFixed(1)),
      activeDays,
      avgDailyHours: parseFloat(avgDailyHours.toFixed(1)),
      currentStreak,
      longestStreak,
      totalSessions: activities.length,
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
        totalSessions: activities.length,
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
