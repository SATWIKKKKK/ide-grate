import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"

// GET /api/contributions - Get contribution graph data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "365")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const contributions = await prisma.dailyContribution.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    // Create a map for all days in range
    const contributionMap: Record<string, { hours: number; sessions: number; level: number }> = {}
    
    // Fill with zeros first
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      contributionMap[dateStr] = { hours: 0, sessions: 0, level: 0 }
    }

    // Fill with actual data
    contributions.forEach((c) => {
      const dateStr = new Date(c.date).toISOString().split("T")[0]
      const level = getContributionLevel(c.hours)
      contributionMap[dateStr] = {
        hours: c.hours,
        sessions: c.sessions,
        level,
      }
    })

    // Calculate stats
    const totalHours = contributions.reduce((sum, c) => sum + c.hours, 0)
    const activeDays = contributions.filter((c) => c.hours > 0).length
    const avgHoursPerDay = activeDays > 0 ? totalHours / activeDays : 0

    return NextResponse.json({
      contributions: contributionMap,
      stats: {
        totalHours: Math.round(totalHours * 10) / 10,
        activeDays,
        avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      },
    })
  } catch (error) {
    console.error("Error fetching contributions:", error)
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    )
  }
}

function getContributionLevel(hours: number): number {
  if (hours === 0) return 0
  if (hours < 1) return 1
  if (hours < 3) return 2
  if (hours < 5) return 3
  return 4
}
