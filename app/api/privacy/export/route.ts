import { NextRequest, NextResponse } from "next/server"
import { requireServerUser } from "@/lib/serverAuth"
import prisma from "@/lib/prisma"

// GET /api/privacy/export - Download all user data
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        createdAt: true,
      },
    })

    const activities = await prisma.activity.findMany({
      where: { userId: sessionUser.id },
      orderBy: { startTime: 'desc' },
    })

    const contributions = await prisma.dailyContribution.findMany({
      where: { userId: sessionUser.id },
      orderBy: { date: 'desc' },
    })

    const stats = await prisma.userStats.findUnique({
      where: { userId: sessionUser.id },
    })

    const achievements = await prisma.userAchievement.findMany({
      where: { userId: sessionUser.id },
    })

    const goals = await prisma.userGoal.findMany({
      where: { userId: sessionUser.id },
    })

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      stats,
      activities: activities.map(a => ({
        startTime: a.startTime,
        endTime: a.endTime,
        duration: a.duration,
        language: a.language,
        fileType: a.fileType,
      })),
      dailyContributions: contributions,
      achievements,
      goals,
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="vs-integrate-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}

// DELETE /api/privacy/export - Delete all user activity data
export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Delete all activity data (keep the user account)
    await prisma.userAchievement.deleteMany({ where: { userId: sessionUser.id } })
    await prisma.userGoal.deleteMany({ where: { userId: sessionUser.id } })
    await prisma.activity.deleteMany({ where: { userId: sessionUser.id } })
    await prisma.dailyContribution.deleteMany({ where: { userId: sessionUser.id } })
    await prisma.userStats.deleteMany({ where: { userId: sessionUser.id } })

    return NextResponse.json({ success: true, message: "All activity data deleted" })
  } catch (error) {
    console.error("Error deleting data:", error)
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 })
  }
}
