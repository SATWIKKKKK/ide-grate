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
        hasApiKey: false,
        hasActivity: false,
        lastActivityAt: null,
        message: "No API key generated yet",
      })
    }

    // Check for recent activity (within last 5 minutes = actively connected)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentActivity = await prisma.activity.findFirst({
      where: {
        userId: sessionUser.id,
        endTime: { gte: fiveMinutesAgo },
      },
      orderBy: { endTime: "desc" },
      select: { endTime: true },
    })

    // Check for any activity ever
    const anyActivity = recentActivity || await prisma.activity.findFirst({
      where: { userId: sessionUser.id },
      orderBy: { endTime: "desc" },
      select: { endTime: true },
    })

    const stats = await prisma.userStats.findUnique({
      where: { userId: sessionUser.id },
      select: { totalSessions: true, totalHours: true, lastActiveDate: true },
    })

    return NextResponse.json({
      connected: !!recentActivity,
      hasApiKey: true,
      hasActivity: !!anyActivity,
      lastActivityAt: anyActivity?.endTime || stats?.lastActiveDate || null,
      totalSessions: stats?.totalSessions || 0,
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
