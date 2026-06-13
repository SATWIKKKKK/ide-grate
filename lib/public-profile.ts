import prisma from "@/lib/prisma"
import { IDE_CONFIG, IDE_OPTIONS } from "@/lib/ide-config"

export async function getPublicProfile(username: string) {
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
      showProjects: true,
      createdAt: true,
    },
  })

  if (!user) return { status: 404 as const, body: { error: "User not found" } }
  if (!user.profilePublic) return { status: 403 as const, body: { error: "Profile is private" } }

  const yearAgo = new Date()
  yearAgo.setDate(yearAgo.getDate() - 365)

  const [stats, contributions, achievements, setups] = await Promise.all([
    prisma.userStats.findUnique({ where: { userId: user.id } }),
    prisma.dailyContribution.findMany({
      where: { userId: user.id, date: { gte: yearAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.userAchievement.findMany({
      where: { userId: user.id },
      orderBy: { unlockedAt: "desc" },
    }),
    prisma.userIdeSetup.findMany({
      where: { userId: user.id, isActive: true },
      select: { ide: true, lastHeartbeat: true },
    }),
  ])

  const activityData: Record<string, number> = {}
  if (user.showHeatmap) {
    contributions.forEach((c) => {
      const key = c.date.toISOString().split("T")[0]
      activityData[key] = Math.round(((activityData[key] || 0) + c.hours) * 100) / 100
    })
  }

  const topLanguages = user.showLanguages ? formatTopLanguages(stats?.topLanguages) : []
  const activeDays = new Set(contributions.filter((c) => c.hours > 0).map((c) => c.date.toISOString().split("T")[0])).size
  const publicSetups = setups.map((setup) => {
    const id = setup.ide as keyof typeof IDE_CONFIG
    const config = IDE_CONFIG[id]
    return {
      id: setup.ide,
      name: config?.shortName || setup.ide,
      color: config?.color || "#111111",
      lastHeartbeat: setup.lastHeartbeat?.toISOString() || null,
    }
  })

  return {
    status: 200 as const,
    body: {
      user: {
        name: user.name,
        username: user.username,
        image: user.image,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
      },
      stats: user.showHours || user.showStreak ? {
        totalHours: user.showHours ? parseFloat((stats?.totalHours || 0).toFixed(1)) : 0,
        totalSessions: user.showHours ? (stats?.totalSessions || 0) : 0,
        currentStreak: user.showStreak ? (stats?.currentStreak || 0) : 0,
        longestStreak: user.showStreak ? (stats?.longestStreak || 0) : 0,
        activeDays: user.showHours ? activeDays : 0,
      } : null,
      languages: topLanguages,
      achievements: achievements.map((a) => a.achievementId),
      contributions: user.showHeatmap ? activityData : null,
      ideSetups: publicSetups,
      supportedIdeCount: IDE_OPTIONS.length,
      privacy: {
        showHours: user.showHours,
        showLanguages: user.showLanguages,
        showStreak: user.showStreak,
        showHeatmap: user.showHeatmap,
        showProjects: user.showProjects,
      },
    },
  }
}

function formatTopLanguages(raw: unknown) {
  const totals: Record<string, number> = {}
  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      const entry = item as { language?: unknown; hours?: unknown; seconds?: unknown }
      const language = typeof entry.language === "string" ? entry.language.toLowerCase() : ""
      if (!language) return
      if (typeof entry.seconds === "number") totals[language] = (totals[language] || 0) + entry.seconds
      if (typeof entry.hours === "number") totals[language] = (totals[language] || 0) + entry.hours * 3600
    })
  } else if (raw && typeof raw === "object") {
    Object.entries(raw as Record<string, unknown>).forEach(([language, seconds]) => {
      if (typeof seconds === "number" && Number.isFinite(seconds)) totals[language.toLowerCase()] = seconds
    })
  }

  const totalSeconds = Object.values(totals).reduce((sum, seconds) => sum + seconds, 0) || 1
  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([language, seconds]) => ({
      language,
      hours: parseFloat((seconds / 3600).toFixed(1)),
      percentage: Math.round((seconds / totalSeconds) * 100),
    }))
}
