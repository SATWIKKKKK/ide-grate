import { NextRequest, NextResponse } from "next/server"
import { requireServerUser } from "@/lib/serverAuth"
import prisma from "@/lib/prisma"

// GET /api/goals - Get user goals
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const goals = await prisma.userGoal.findMany({
      where: { userId: sessionUser.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate progress for each goal
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    // Get today's contribution
    const todayContrib = await prisma.dailyContribution.findFirst({
      where: {
        userId: sessionUser.id,
        date: todayStart,
      },
    })

    // Get this week's contributions
    const weekContribs = await prisma.dailyContribution.findMany({
      where: {
        userId: sessionUser.id,
        date: { gte: weekStart },
      },
    })

    const weeklyHours = weekContribs.reduce((s, c) => s + c.hours, 0)

    // Get streak
    const stats = await prisma.userStats.findUnique({
      where: { userId: sessionUser.id },
    })

    const goalsWithProgress = goals.map(goal => {
      let current = 0
      switch (goal.type) {
        case 'daily_hours':
          current = todayContrib?.hours || 0
          break
        case 'weekly_hours':
          current = weeklyHours
          break
        case 'streak_days':
          current = stats?.currentStreak || 0
          break
      }

      return {
        ...goal,
        current: parseFloat(current.toFixed(1)),
        percentage: Math.min(100, Math.round((current / goal.target) * 100)),
        achieved: current >= goal.target,
      }
    })

    return NextResponse.json({ goals: goalsWithProgress })
  } catch (error) {
    console.error("Error fetching goals:", error)
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { type, target } = await request.json()

    if (!type || !target || !['daily_hours', 'weekly_hours', 'streak_days'].includes(type)) {
      return NextResponse.json({ error: "Invalid goal type or target" }, { status: 400 })
    }

    // Deactivate existing goal of same type
    await prisma.userGoal.updateMany({
      where: { userId: sessionUser.id, type, isActive: true },
      data: { isActive: false },
    })

    const goal = await prisma.userGoal.create({
      data: {
        userId: sessionUser.id,
        type,
        target: parseFloat(target),
      },
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error("Error creating goal:", error)
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 })
  }
}

// DELETE /api/goals - Delete a goal
export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get('id')

    if (!goalId) {
      return NextResponse.json({ error: "Goal ID required" }, { status: 400 })
    }

    await prisma.userGoal.updateMany({
      where: { id: goalId, userId: sessionUser.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting goal:", error)
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 })
  }
}
