import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { SUPERADMIN_COOKIE, verifySuperadminToken } from "@/lib/superadmin-auth"
import { normalizeLanguageKey } from "@/lib/languages"

export async function GET() {
  const cookieStore = await cookies()
  if (!verifySuperadminToken(cookieStore.get(SUPERADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [users, contributions, activities] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        profilePublic: true,
        createdAt: true,
        updatedAt: true,
        stats: {
          select: {
            currentStreak: true,
            longestStreak: true,
            totalSessions: true,
            lastActiveDate: true,
          },
        },
        ideSetups: {
          select: {
            ide: true,
            isActive: true,
            lastHeartbeat: true,
          },
        },
      },
    }),
    prisma.dailyContribution.findMany({
      select: { userId: true, ide: true, date: true, hours: true, sessions: true },
    }),
    prisma.activity.findMany({
      select: { userId: true, ide: true, language: true, duration: true, endTime: true },
      orderBy: { endTime: "desc" },
    }),
  ])

  const rows = users.map((user) => {
    const userContribs = contributions.filter((item) => item.userId === user.id)
    const userActivities = activities.filter((item) => item.userId === user.id)
    const totalHours = userContribs.reduce((sum, item) => sum + item.hours, 0)
    const totalSessions = userContribs.reduce((sum, item) => sum + item.sessions, 0) || user.stats?.totalSessions || 0
    const activeDays = new Set(userContribs.filter((item) => item.hours > 0).map((item) => item.date.toISOString().split("T")[0])).size
    const ideBreakdown = Object.values(userContribs.reduce<Record<string, { ide: string; hours: number; sessions: number }>>((acc, item) => {
      acc[item.ide] ||= { ide: item.ide, hours: 0, sessions: 0 }
      acc[item.ide].hours += item.hours
      acc[item.ide].sessions += item.sessions
      return acc
    }, {})).sort((a, b) => b.hours - a.hours)
    const languageBreakdown = Object.values(userActivities.reduce<Record<string, { language: string; seconds: number }>>((acc, item) => {
      const language = normalizeLanguageKey(item.language)
      if (!language) return acc
      acc[language] ||= { language, seconds: 0 }
      acc[language].seconds += item.duration
      return acc
    }, {})).sort((a, b) => b.seconds - a.seconds).slice(0, 5)

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      image: user.image,
      profilePublic: user.profilePublic,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      totalHours: parseFloat(totalHours.toFixed(1)),
      totalSessions,
      activeDays,
      currentStreak: user.stats?.currentStreak || 0,
      longestStreak: user.stats?.longestStreak || 0,
      lastActiveDate: user.stats?.lastActiveDate?.toISOString() || userActivities[0]?.endTime.toISOString() || null,
      ideSetups: user.ideSetups.map((setup) => ({
        ide: setup.ide,
        isActive: setup.isActive,
        lastHeartbeat: setup.lastHeartbeat?.toISOString() || null,
      })),
      ideBreakdown: ideBreakdown.map((item) => ({ ...item, hours: parseFloat(item.hours.toFixed(1)) })),
      languageBreakdown: languageBreakdown.map((item) => ({ language: item.language, hours: parseFloat((item.seconds / 3600).toFixed(1)) })),
    }
  })

  return NextResponse.json({
    totals: {
      users: users.length,
      hours: parseFloat(rows.reduce((sum, user) => sum + user.totalHours, 0).toFixed(1)),
      sessions: rows.reduce((sum, user) => sum + user.totalSessions, 0),
      publicProfiles: rows.filter((user) => user.profilePublic).length,
    },
    users: rows,
  })
}
