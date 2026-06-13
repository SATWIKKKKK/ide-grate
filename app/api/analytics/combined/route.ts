import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireServerUser } from "@/lib/serverAuth"
import { IDE_OPTIONS } from "@/lib/ide-config"

// GET /api/analytics/combined - Combined analytics with per-IDE breakdowns.
export async function GET() {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const yearStart = new Date(new Date().getFullYear(), 0, 1)
    const [activities, contributions] = await Promise.all([
      prisma.activity.findMany({
        where: { userId: sessionUser.id, startTime: { gte: yearStart } },
        select: { ide: true, startTime: true, duration: true, language: true },
      }),
      prisma.dailyContribution.findMany({
        where: { userId: sessionUser.id, date: { gte: yearStart } },
        select: { ide: true, date: true, hours: true, sessions: true },
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
      if (activity.language && activity.language !== "unknown") {
        languageTotals[activity.language.toLowerCase()] = (languageTotals[activity.language.toLowerCase()] || 0) + activity.duration
      }
      hourlyActivity[new Date(activity.startTime).getHours()] += activity.duration / 3600
    })

    const totalSeconds = activities.reduce((sum, activity) => sum + activity.duration, 0)
    const ideBreakdown = IDE_OPTIONS.map((definition) => {
      const seconds = activities
        .filter((activity) => activity.ide === definition.id)
        .reduce((sum, activity) => sum + activity.duration, 0)
      return {
        id: definition.id,
        name: definition.shortName,
        color: definition.color,
        hours: parseFloat((seconds / 3600).toFixed(1)),
        percentage: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0,
      }
    })

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
      totalHours: parseFloat((totalSeconds / 3600).toFixed(1)),
      activeDays: Object.values(contributionsByDate).filter((day) => day.hours > 0).length,
      contributions: contributionsByDate,
      ideBreakdown,
      topLanguages,
      hourlyActivity: hourlyActivity.map((hours) => parseFloat(hours.toFixed(2))),
    })
  } catch (error) {
    console.error("Error fetching combined analytics:", error)
    return NextResponse.json({ error: "Failed to fetch combined analytics" }, { status: 500 })
  }
}
