import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireServerUser } from "@/lib/serverAuth"
import { IDE_OPTIONS, validateIdeParam } from "@/lib/ide-config"

// GET /api/connection-status - Lightweight check if editor integrations are connected.
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
        totalSessions: 0,
        totalHours: 0,
        ide: ide || "combined",
        integrations: [],
        message: "No API key generated yet",
      })
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const where = { userId: sessionUser.id, ...(ide ? { ide } : {}) }
    const [recentActivity, latestActivity, totalSessions, scopedContributions, setups, allSetups, ideActivities] = await Promise.all([
      prisma.activity.findFirst({
        where: { ...where, endTime: { gte: fiveMinutesAgo } },
        orderBy: { endTime: "desc" },
        select: { endTime: true },
      }),
      prisma.activity.findFirst({
        where,
        orderBy: { endTime: "desc" },
        select: { endTime: true },
      }),
      prisma.activity.count({ where }),
      prisma.dailyContribution.findMany({
        where,
        select: { hours: true },
      }),
      prisma.userIdeSetup.findMany({
        where: { userId: sessionUser.id, ...(ide ? { ide } : {}) },
        select: { ide: true, isActive: true, lastHeartbeat: true, connectedAt: true },
      }),
      prisma.userIdeSetup.findMany({
        where: { userId: sessionUser.id },
        select: { ide: true, isActive: true, lastHeartbeat: true, connectedAt: true },
      }),
      prisma.activity.findMany({
        where: { userId: sessionUser.id },
        select: { ide: true, endTime: true },
        orderBy: { endTime: "desc" },
        take: 100,
      }),
    ])

    const connectedSetups = setups.filter((setup) => setup.isActive && setup.lastHeartbeat)
    const setupActive = connectedSetups.some((setup) => setup.lastHeartbeat && setup.lastHeartbeat >= fiveMinutesAgo)
    const hasConnectedSetup = connectedSetups.length > 0
    const isActive = Boolean(hasConnectedSetup && (recentActivity || setupActive))

    const integrations = IDE_OPTIONS.map((definition) => {
      const setup = allSetups.find((item) => item.ide === definition.id)
      const latestForIde = ideActivities.find((activity) => activity.ide === definition.id)
      return {
        id: definition.id,
        name: definition.shortName,
        color: definition.color,
        isSetup: Boolean(setup?.isActive),
        connected: Boolean(setup?.isActive && setup?.lastHeartbeat),
        active: Boolean(setup?.lastHeartbeat && setup.lastHeartbeat >= fiveMinutesAgo),
        lastHeartbeat: setup?.lastHeartbeat?.toISOString() || null,
        lastActivityAt: latestForIde?.endTime?.toISOString() || null,
      }
    })

    return NextResponse.json({
      connected: hasConnectedSetup,
      active: isActive,
      hasApiKey: true,
      hasActivity: totalSessions > 0 || isActive,
      isSetup: ide ? setups.some((setup) => setup.isActive) : setups.length > 0,
      ide: ide || "combined",
      lastActivityAt: latestActivity?.endTime || setups[0]?.lastHeartbeat || null,
      totalSessions,
      totalHours: scopedContributions.reduce((sum, contribution) => sum + contribution.hours, 0),
      integrations,
    })
  } catch (error) {
    console.error("Error checking connection status:", error)
    return NextResponse.json({ error: "Failed to check connection status" }, { status: 500 })
  }
}
