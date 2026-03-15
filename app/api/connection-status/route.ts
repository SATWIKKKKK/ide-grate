import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireServerUser } from "@/lib/serverAuth"

// GET /api/connection-status - Lightweight check if VS Code extension is connected
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has an API key
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { apiKey: true },
    })

    if (!user?.apiKey) {
      return NextResponse.json({
        connected: false,
        active: false,
        hasApiKey: false,
        hasActivity: false,
        lastActivityAt: null,
        message: "No API key generated yet",
      })
    }

    // Check for recent activity (within last 5 minutes = actively connected)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const [recentActivity, latestActivity, totalSessions, stats] = await Promise.all([
      prisma.activity.findFirst({
        where: {
          userId: sessionUser.id,
          endTime: { gte: fiveMinutesAgo },
        },
        orderBy: { endTime: "desc" },
        select: { endTime: true },
      }),
      prisma.activity.findFirst({
        where: { userId: sessionUser.id },
        orderBy: { endTime: "desc" },
        select: { endTime: true },
      }),
      prisma.activity.count({
        where: { userId: sessionUser.id },
      }),
      prisma.userStats.findUnique({
        where: { userId: sessionUser.id },
        select: { totalHours: true, lastActiveDate: true },
      }),
    ])

    // connection_test heartbeats only update UserStats.lastActiveDate, not Activity records
    // so we also check lastActiveDate to detect fresh connections
    const recentConnectionTest = stats?.lastActiveDate && stats.lastActiveDate >= fiveMinutesAgo

    const isActive = !!recentActivity || !!recentConnectionTest

    return NextResponse.json({
      connected: true, // has API key = extension is configured & tracking
      active: isActive, // recent heartbeat = actively coding right now
      hasApiKey: true,
      hasActivity: totalSessions > 0 || !!recentConnectionTest,
      lastActivityAt: latestActivity?.endTime || stats?.lastActiveDate || null,
      totalSessions,
      totalHours: stats?.totalHours || 0,
    })
  } catch (error) {
    console.error("Error checking connection status:", error)
    return NextResponse.json(
      { error: "Failed to check connection status" },
      { status: 500 }
    )
  }
}
