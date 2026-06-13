import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireServerUser } from "@/lib/serverAuth"
import { validateIdeParam } from "@/lib/ide-config"

// GET /api/contributions - Get contribution graph data.
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

    const userStats = await prisma.userStats.findUnique({
      where: { userId: sessionUser.id },
      select: { monthlyData: true },
    })
    const storedMd = (userStats?.monthlyData as Record<string, unknown>) || {}
    const storedTzOffset = typeof storedMd.timezoneOffset === "number" ? storedMd.timezoneOffset : null

    const nowDate = new Date()
    const todayStr = storedTzOffset !== null
      ? new Date(nowDate.getTime() - storedTzOffset * 60000).toISOString().split("T")[0]
      : nowDate.toISOString().split("T")[0]
    const todayLocal = new Date(todayStr)

    const startDate = new Date(todayLocal)
    startDate.setDate(startDate.getDate() - days)

    const contributions = await prisma.dailyContribution.findMany({
      where: {
        userId: sessionUser.id,
        date: { gte: startDate },
        ...(ide ? { ide } : {}),
      },
      orderBy: { date: "asc" },
    })

    const contributionMap: Record<string, { hours: number; sessions: number; level: number; byIde: Record<string, number> }> = {}
    for (let d = new Date(startDate); d <= todayLocal; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      contributionMap[dateStr] = { hours: 0, sessions: 0, level: 0, byIde: {} }
    }

    contributions.forEach((c) => {
      const dateStr = new Date(c.date).toISOString().split("T")[0]
      const current = contributionMap[dateStr] || { hours: 0, sessions: 0, level: 0, byIde: {} }
      const nextHours = current.hours + c.hours
      contributionMap[dateStr] = {
        hours: Math.round(nextHours * 100) / 100,
        sessions: current.sessions + c.sessions,
        level: getContributionLevel(nextHours),
        byIde: {
          ...current.byIde,
          [c.ide]: Math.round(((current.byIde[c.ide] || 0) + c.hours) * 100) / 100,
        },
      }
    })

    const totalHours = contributions.reduce((sum, c) => sum + c.hours, 0)
    const activeDays = new Set(contributions.filter((c) => c.hours > 0).map((c) => c.date.toISOString().split("T")[0])).size
    const avgHoursPerDay = activeDays > 0 ? totalHours / activeDays : 0

    return NextResponse.json({
      selectedIde: ide || "combined",
      contributions: contributionMap,
      stats: {
        totalHours: Math.round(totalHours * 10) / 10,
        activeDays,
        avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      },
    })
  } catch (error) {
    console.error("Error fetching contributions:", error)
    return NextResponse.json({ error: "Failed to fetch contributions" }, { status: 500 })
  }
}

function getContributionLevel(hours: number): number {
  if (hours <= 0) return 0
  if (hours < 0.25) return 1
  if (hours < 1) return 2
  if (hours < 3) return 3
  return 4
}
