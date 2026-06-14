import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireServerUser } from "@/lib/serverAuth"
import { IDE_OPTIONS, isIdeId } from "@/lib/ide-config"

// GET /api/ide-setup - Setup and connection status for every supported editor.
export async function GET() {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const [user, setups, activities] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { apiKey: true },
      }),
      prisma.userIdeSetup.findMany({
        where: { userId: sessionUser.id },
        select: { ide: true, label: true, isActive: true, connectedAt: true, lastHeartbeat: true, updatedAt: true },
      }),
      prisma.activity.findMany({
        where: { userId: sessionUser.id, startTime: { gte: weekStart } },
        select: { ide: true, duration: true, endTime: true },
        orderBy: { endTime: "desc" },
      }),
    ])

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const rows = IDE_OPTIONS.map((definition) => {
      const setup = setups.find((item) => item.ide === definition.id)
      const ideActivities = activities.filter((activity) => activity.ide === definition.id)
      const weeklySeconds = ideActivities.reduce((sum, activity) => sum + activity.duration, 0)
      return {
        ...definition,
        isSetup: Boolean(setup?.isActive),
        isConnected: Boolean(setup?.isActive && setup?.lastHeartbeat),
        isActiveNow: Boolean(setup?.lastHeartbeat && setup.lastHeartbeat >= fiveMinutesAgo),
        connectedAt: setup?.connectedAt?.toISOString() || null,
        lastHeartbeat: setup?.lastHeartbeat?.toISOString() || null,
        lastSessionAt: ideActivities[0]?.endTime?.toISOString() || null,
        weeklyMinutes: Math.round(weeklySeconds / 60),
        hasApiKey: Boolean(user?.apiKey),
      }
    })

    return NextResponse.json({
      apiKey: user?.apiKey || null,
      hasApiKey: Boolean(user?.apiKey),
      integrations: rows,
    })
  } catch (error) {
    console.error("Error fetching IDE setup:", error)
    return NextResponse.json({ error: "Failed to fetch IDE setup" }, { status: 500 })
  }
}

// POST /api/ide-setup - Mark an editor as configured.
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const ide = typeof body.ide === "string" ? body.ide.toLowerCase() : ""
    if (!isIdeId(ide)) return NextResponse.json({ error: "Unsupported IDE" }, { status: 400 })

    const label = typeof body.label === "string" ? body.label.slice(0, 80) : undefined
    const now = new Date()
    const setup = await prisma.userIdeSetup.upsert({
      where: { userId_ide: { userId: sessionUser.id, ide } },
      update: { isActive: true, label, connectedAt: now },
      create: { userId: sessionUser.id, ide, label, isActive: true, connectedAt: now },
    })

    return NextResponse.json({ setup })
  } catch (error) {
    console.error("Error updating IDE setup:", error)
    return NextResponse.json({ error: "Failed to update IDE setup" }, { status: 500 })
  }
}

// DELETE /api/ide-setup?ide=vscode - Hide/deactivate an editor setup row.
export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const ide = (searchParams.get("ide") || "").toLowerCase()
    if (!isIdeId(ide)) return NextResponse.json({ error: "Unsupported IDE" }, { status: 400 })

    await prisma.userIdeSetup.updateMany({
      where: { userId: sessionUser.id, ide },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deactivating IDE setup:", error)
    return NextResponse.json({ error: "Failed to deactivate IDE setup" }, { status: 500 })
  }
}
