import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { requireServerUser } from "@/lib/serverAuth"

// GET /api/activities - Get user's activities
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")
    const days = parseInt(searchParams.get("days") || "30")

    let startDate: Date
    let endDate: Date | undefined

    if (fromParam) {
      startDate = new Date(fromParam)
      if (toParam) {
        endDate = new Date(toParam)
        endDate.setHours(23, 59, 59, 999)
      }
    } else {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
    }

    const activities = await prisma.activity.findMany({
      where: {
        userId: sessionUser.id,
        startTime: {
          gte: startDate,
          ...(endDate ? { lte: endDate } : {}),
        },
      },
      orderBy: {
        startTime: "desc",
      },
      take: 100,
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    )
  }
}

// POST /api/activities - Log a new activity
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { startTime, endTime, duration, language, fileType, extensions, idleTime } = body

    if (!startTime || !duration) {
      return NextResponse.json(
        { error: "startTime and duration are required" },
        { status: 400 }
      )
    }

    // Create the activity
    const activity = await prisma.activity.create({
      data: {
        userId: sessionUser.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime || new Date()),
        duration: parseInt(duration),
        language: language || null,
        fileType: fileType || null,
        extensions: extensions || [],
        idleTime: idleTime || 0,
      },
    })

    // Update daily contribution
    const activityDate = new Date(startTime)
    activityDate.setHours(0, 0, 0, 0)
    const hours = duration / 3600 // Convert seconds to hours

    await prisma.dailyContribution.upsert({
      where: {
        userId_date: {
          userId: sessionUser.id,
          date: activityDate,
        },
      },
      update: {
        hours: { increment: hours },
        sessions: { increment: 1 },
        languages: language ? { push: language } : undefined,
      },
      create: {
        userId: sessionUser.id,
        date: activityDate,
        hours,
        sessions: 1,
        languages: language ? [language] : [],
      },
    })

    // Update user stats
    await updateUserStats(sessionUser.id, duration, language)

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error("Error logging activity:", error)
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    )
  }
}

async function updateUserStats(userId: string, duration: number, language?: string) {
  const hours = duration / 3600
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = await prisma.userStats.findUnique({
    where: { userId },
  })

  if (!stats) {
    await prisma.userStats.create({
      data: {
        userId,
        totalHours: hours,
        totalSessions: 1,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
        topLanguages: language ? [{ language, hours }] : [],
      },
    })
    return
  }

  // Calculate streak
  let newCurrentStreak = stats.currentStreak
  let newLongestStreak = stats.longestStreak

  if (stats.lastActiveDate) {
    const lastActive = new Date(stats.lastActiveDate)
    lastActive.setHours(0, 0, 0, 0)
    
    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      // Same day, no streak change
    } else if (diffDays === 1) {
      // Consecutive day
      newCurrentStreak += 1
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak
      }
    } else {
      // Streak broken
      newCurrentStreak = 1
    }
  }

  // Update top languages
  let topLanguages = stats.topLanguages as { language: string; hours: number }[]
  if (language) {
    const existingLang = topLanguages.find((l) => l.language === language)
    if (existingLang) {
      existingLang.hours += hours
    } else {
      topLanguages.push({ language, hours })
    }
    topLanguages.sort((a, b) => b.hours - a.hours)
    topLanguages = topLanguages.slice(0, 10) // Keep top 10
  }

  await prisma.userStats.update({
    where: { userId },
    data: {
      totalHours: { increment: hours },
      totalSessions: { increment: 1 },
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: today,
      topLanguages,
    },
  })
}
