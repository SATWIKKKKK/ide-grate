import { NextRequest, NextResponse } from "next/server"
import { requireServerUser } from "@/lib/serverAuth"
import prisma from "@/lib/prisma"
import { sendGoalAchievedEmail } from "@/lib/email"

// GET /api/goals - Get user goals
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const goals = await prisma.userGoal.findMany({
      where: { userId: sessionUser.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    const now = new Date()
    const todayStart = new Date(now.toISOString().split('T')[0])
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    // Get all contributions for date-wise lookup
    const allContribs = await prisma.dailyContribution.findMany({
      where: {
        userId: sessionUser.id,
        date: { gte: weekStart },
      },
    })

    const weeklyHours = allContribs.reduce((s, c) => s + c.hours, 0)

    const stats = await prisma.userStats.findUnique({
      where: { userId: sessionUser.id },
    })

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { email: true, name: true },
    })

    const goalsWithProgress = await Promise.all(goals.map(async (goal) => {
      let current = 0

      if (goal.targetDate) {
        const goalDateStr = new Date(goal.targetDate).toISOString().split('T')[0]
        const contrib = allContribs.find(c =>
          new Date(c.date).toISOString().split('T')[0] === goalDateStr
        ) || await prisma.dailyContribution.findFirst({
          where: { userId: sessionUser.id, date: new Date(goalDateStr) },
        })

        switch (goal.type) {
          case 'daily_hours': current = contrib?.hours || 0; break
          case 'weekly_hours': current = weeklyHours; break
          case 'streak_days': current = stats?.currentStreak || 0; break
        }
      } else {
        const todayContrib = allContribs.find(c =>
          new Date(c.date).toISOString().split('T')[0] === todayStart.toISOString().split('T')[0]
        )
        switch (goal.type) {
          case 'daily_hours': current = todayContrib?.hours || 0; break
          case 'weekly_hours': current = weeklyHours; break
          case 'streak_days': current = stats?.currentStreak || 0; break
        }
      }

      const isAchieved = current >= goal.target

      // Send email if newly achieved
      if (isAchieved && !goal.emailSent && !goal.achieved && user?.email) {
        try {
          await sendGoalAchievedEmail(
            user.email, goal.type, goal.target,
            goal.targetDate ? goal.targetDate.toISOString() : null,
            user.name
          )
          await prisma.userGoal.update({
            where: { id: goal.id },
            data: { achieved: true, emailSent: true },
          })
        } catch (emailErr) {
          console.error("Failed to send goal achievement email:", emailErr)
          await prisma.userGoal.update({
            where: { id: goal.id },
            data: { achieved: true },
          })
        }
      } else if (isAchieved && !goal.achieved) {
        await prisma.userGoal.update({
          where: { id: goal.id },
          data: { achieved: true },
        })
      }

      return {
        ...goal,
        current: parseFloat(current.toFixed(1)),
        percentage: Math.min(100, Math.round((current / goal.target) * 100)),
        achieved: isAchieved,
      }
    }))

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

    const { type, target, targetDate } = await request.json()

    if (!type || !target || !['daily_hours', 'weekly_hours', 'streak_days'].includes(type)) {
      return NextResponse.json({ error: "Invalid goal type or target" }, { status: 400 })
    }

    let parsedDate: Date | null = null
    if (targetDate) {
      parsedDate = new Date(targetDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (parsedDate < today) {
        return NextResponse.json({ error: "Target date must be today or in the future" }, { status: 400 })
      }
    }

    if (parsedDate) {
      await prisma.userGoal.updateMany({
        where: { userId: sessionUser.id, type, targetDate: parsedDate, isActive: true },
        data: { isActive: false },
      })
    } else {
      await prisma.userGoal.updateMany({
        where: { userId: sessionUser.id, type, isActive: true, targetDate: null },
        data: { isActive: false },
      })
    }

    const goal = await prisma.userGoal.create({
      data: {
        userId: sessionUser.id,
        type,
        target: parseFloat(target),
        targetDate: parsedDate,
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
