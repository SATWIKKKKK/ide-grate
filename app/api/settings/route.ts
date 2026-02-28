import { NextRequest, NextResponse } from "next/server"
import { requireServerUser } from "@/lib/serverAuth"
import prisma from "@/lib/prisma"

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        username: true,
        bio: true,
        profilePublic: true,
        showHours: true,
        showLanguages: true,
        showStreak: true,
        showHeatmap: true,
        showProjects: true,
        dailyDigest: true,
        streakReminder: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()

    // Whitelist fields that can be updated
    const allowedFields = [
      'username', 'bio', 'profilePublic',
      'showHours', 'showLanguages', 'showStreak', 'showHeatmap', 'showProjects',
      'dailyDigest', 'streakReminder',
    ]

    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Validate username if provided
    if (updateData.username) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
      if (!usernameRegex.test(updateData.username)) {
        return NextResponse.json(
          { error: "Username must be 3-30 characters, letters, numbers, hyphens, and underscores only" },
          { status: 400 }
        )
      }

      // Check uniqueness
      const existing = await prisma.user.findFirst({
        where: { username: updateData.username, NOT: { id: sessionUser.id } },
      })
      if (existing) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 })
      }
    }

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data: updateData,
      select: {
        username: true,
        bio: true,
        profilePublic: true,
        showHours: true,
        showLanguages: true,
        showStreak: true,
        showHeatmap: true,
        showProjects: true,
        dailyDigest: true,
        streakReminder: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
