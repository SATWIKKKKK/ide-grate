import { NextRequest, NextResponse } from "next/server"
import { requireServerUser } from "@/lib/serverAuth"
import prisma from "@/lib/prisma"
import { ACHIEVEMENTS } from "@/lib/achievements"

// GET /api/achievements - Get user achievements
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get existing achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: sessionUser.id },
    })

    const unlockedIds = new Set(userAchievements.map(a => a.achievementId))

    // Get stats for evaluation
    const stats = await prisma.userStats.findUnique({
      where: { userId: sessionUser.id },
    })

    const activities = await prisma.activity.findMany({
      where: { userId: sessionUser.id },
      select: { startTime: true, duration: true, language: true },
    })

    const contributions = await prisma.dailyContribution.findMany({
      where: { userId: sessionUser.id },
    })

    // Calculate achievement stats
    const uniqueLanguages = new Set(activities.map(a => a.language).filter(Boolean)).size
    const hasEarlySession = activities.some(a => new Date(a.startTime).getHours() < 7)
    const hasLateSession = activities.some(a => {
      const h = new Date(a.startTime).getHours()
      return h >= 0 && h < 4
    })

    const dayHours: Record<string, number> = {}
    contributions.forEach(c => {
      dayHours[new Date(c.date).toISOString().split('T')[0]] = c.hours
    })
    const maxDayHours = Math.max(0, ...Object.values(dayHours))
    const activeDays = Object.values(dayHours).filter(h => h > 0).length

    const achievementStats = {
      totalSessions: stats?.totalSessions || activities.length,
      totalHours: stats?.totalHours || 0,
      longestStreak: stats?.longestStreak || 0,
      currentStreak: stats?.currentStreak || 0,
      uniqueLanguages,
      hasEarlySession,
      hasLateSession,
      maxDayHours,
      activeDays,
    }

    // Check for newly unlocked achievements
    const newlyUnlocked: string[] = []
    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedIds.has(achievement.id) && achievement.condition(achievementStats)) {
        newlyUnlocked.push(achievement.id)
      }
    }

    // Save newly unlocked achievements
    if (newlyUnlocked.length > 0) {
      await prisma.userAchievement.createMany({
        data: newlyUnlocked.map(id => ({
          userId: sessionUser.id,
          achievementId: id,
        })),
        skipDuplicates: true,
      })
    }

    // Return all achievements with unlock status
    const allAchievements = ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: unlockedIds.has(a.id) || newlyUnlocked.includes(a.id),
      unlockedAt: userAchievements.find(ua => ua.achievementId === a.id)?.unlockedAt || null,
      condition: undefined, // Don't send function to client
    }))

    return NextResponse.json({
      achievements: allAchievements,
      newlyUnlocked: newlyUnlocked.map(id => ACHIEVEMENTS.find(a => a.id === id)),
      totalUnlocked: unlockedIds.size + newlyUnlocked.length,
      total: ACHIEVEMENTS.length,
    })
  } catch (error) {
    console.error("Error fetching achievements:", error)
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 })
  }
}
