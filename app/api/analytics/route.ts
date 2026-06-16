import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireServerUser } from "@/lib/serverAuth"
import { IDE_OPTIONS, validateIdeParam } from "@/lib/ide-config"
import { normalizeLanguageKey } from "@/lib/languages"

// GET /api/analytics - Get user analytics data.
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "365")
    const requestedIde = searchParams.get("ide")
    const ide = validateIdeParam(requestedIde)
    if (requestedIde && !ide) {
      return NextResponse.json({ error: "Unsupported IDE" }, { status: 400 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const recentStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const ideFilter = ide ? { ide } : {}

    const [stats, contributions, recentActivities, allRecentActivities] = await Promise.all([
      prisma.userStats.findUnique({ where: { userId: sessionUser.id } }),
      prisma.dailyContribution.findMany({
        where: { userId: sessionUser.id, date: { gte: startDate }, ...ideFilter },
        orderBy: { date: "asc" },
      }),
      prisma.activity.findMany({
        where: { userId: sessionUser.id, startTime: { gte: recentStart }, ...ideFilter },
        orderBy: { startTime: "desc" },
      }),
      prisma.activity.findMany({
        where: { userId: sessionUser.id, startTime: { gte: recentStart } },
        select: { ide: true, duration: true },
      }),
    ])

    const weeklyBreakdown = Array(7).fill(0)
    recentActivities.forEach((activity) => {
      weeklyBreakdown[new Date(activity.startTime).getDay()] += activity.duration / 3600
    })

    const contributionData: Record<string, number> = {}
    contributions.forEach((c) => {
      const dateStr = new Date(c.date).toISOString().split("T")[0]
      contributionData[dateStr] = (contributionData[dateStr] || 0) + c.hours
    })

    const ideBreakdown = IDE_OPTIONS.map((definition) => {
      const ideActivities = allRecentActivities.filter((activity) => activity.ide === definition.id)
      const seconds = ideActivities.reduce((sum, activity) => sum + activity.duration, 0)
      return {
        id: definition.id,
        name: definition.shortName,
        color: definition.color,
        hours: parseFloat((seconds / 3600).toFixed(1)),
        sessions: ideActivities.length,
      }
    })

    return NextResponse.json({
      selectedIde: ide || "combined",
      stats: stats || {
        longestStreak: 0,
        currentStreak: 0,
        totalHours: 0,
        totalSessions: 0,
        topLanguages: [],
      },
      contributions: contributionData,
      weeklyBreakdown,
      recentActivities: recentActivities.slice(0, 10).map((activity) => ({
        ...activity,
        language: normalizeLanguageKey(activity.language) || null,
      })),
      ideBreakdown,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
