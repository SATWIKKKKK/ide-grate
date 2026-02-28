import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/profile/[username] - Get public profile data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const user = await prisma.user.findFirst({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        profilePublic: true,
        showHours: true,
        showLanguages: true,
        showStreak: true,
        showHeatmap: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.profilePublic) {
      return NextResponse.json({ error: "Profile is private" }, { status: 403 })
    }

    // Get stats
    const stats = await prisma.userStats.findUnique({
      where: { userId: user.id },
    })

    // Get contributions for heatmap (last 365 days)
    const yearAgo = new Date()
    yearAgo.setDate(yearAgo.getDate() - 365)

    let activityData: Record<string, number> = {}
    if (user.showHeatmap) {
      const contributions = await prisma.dailyContribution.findMany({
        where: {
          userId: user.id,
          date: { gte: yearAgo },
        },
        orderBy: { date: 'asc' },
      })
      contributions.forEach(c => {
        activityData[new Date(c.date).toISOString().split('T')[0]] = c.hours
      })
    }

    // Get top languages
    let topLanguages: { language: string; hours: number; percentage: number }[] = []
    if (user.showLanguages && stats?.topLanguages) {
      const langs = stats.topLanguages as any[]
      topLanguages = Array.isArray(langs) ? langs.slice(0, 5) : []
    }

    // Get achievements
    const achievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      orderBy: { unlockedAt: 'desc' },
    })

    const activeDays = Object.values(activityData).filter(h => h > 0).length

    return NextResponse.json({
      username: user.username,
      displayName: user.name,
      bio: user.bio,
      avatar: user.image,
      memberSince: user.createdAt,
      // Conditionally include stats based on privacy settings
      totalHours: user.showHours ? parseFloat((stats?.totalHours || 0).toFixed(1)) : null,
      currentStreak: user.showStreak ? (stats?.currentStreak || 0) : null,
      longestStreak: user.showStreak ? (stats?.longestStreak || 0) : null,
      totalSessions: user.showHours ? (stats?.totalSessions || 0) : null,
      activeDays: user.showHours ? activeDays : null,
      topLanguage: topLanguages.length > 0 ? topLanguages[0].language : null,
      topLanguages: user.showLanguages ? topLanguages : [],
      activityData: user.showHeatmap ? activityData : {},
      achievements: achievements.map(a => a.achievementId),
    })
  } catch (error) {
    console.error("Error fetching public profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
