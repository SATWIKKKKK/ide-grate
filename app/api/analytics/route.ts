import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { requireServerUser } from "@/lib/serverAuth"

// GET /api/analytics - Get user analytics data
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "365")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get user stats
    const stats = await prisma.userStats.findUnique({
      where: { userId: sessionUser.id },
    })

    // Get daily contributions for contribution graph
    const contributions = await prisma.dailyContribution.findMany({
      where: {
        userId: sessionUser.id,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    // Get recent activities for activity breakdown
    const recentActivities = await prisma.activity.findMany({
      where: {
        userId: sessionUser.id,
        startTime: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: {
        startTime: "desc",
      },
    })

    // Calculate weekly breakdown
    const weeklyBreakdown = Array(7).fill(0)
    recentActivities.forEach((activity) => {
      const dayOfWeek = new Date(activity.startTime).getDay()
      weeklyBreakdown[dayOfWeek] += activity.duration / 3600
    })

    // Format contribution data for the graph
    const contributionData: Record<string, number> = {}
    contributions.forEach((c) => {
      const dateStr = new Date(c.date).toISOString().split("T")[0]
      contributionData[dateStr] = c.hours
    })

    return NextResponse.json({
      stats: stats || {
        longestStreak: 0,
        currentStreak: 0,
        totalHours: 0,
        totalSessions: 0,
        topLanguages: [],
      },
      contributions: contributionData,
      weeklyBreakdown,
      recentActivities: recentActivities.slice(0, 10),
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
