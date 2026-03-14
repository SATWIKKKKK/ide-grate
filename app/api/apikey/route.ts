import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import crypto from "crypto"
import { requireServerUser } from "@/lib/serverAuth"

// GET /api/apikey - Get current API key
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { apiKey: true },
    })

    return NextResponse.json({
      apiKey: user?.apiKey || null,
      hasKey: !!user?.apiKey,
    })
  } catch (error) {
    console.error("Error fetching API key:", error)
    return NextResponse.json(
      { error: "Failed to fetch API key" },
      { status: 500 }
    )
  }
}

// POST /api/apikey - Generate new API key
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Generate a secure random API key
    const apiKey = `vsi_${crypto.randomBytes(32).toString('hex')}`

    // Update user with new API key
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { apiKey },
    })

    return NextResponse.json({
      apiKey,
      message: "API key generated successfully",
    })
  } catch (error) {
    console.error("Error generating API key:", error)
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    )
  }
}

// DELETE /api/apikey - Revoke API key
export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await requireServerUser()
    if (!sessionUser?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { apiKey: null },
    })

    // Set sessionBoundary flag so the next heartbeat creates a new session
    try {
      const stats = await prisma.userStats.findUnique({
        where: { userId: sessionUser.id },
        select: { monthlyData: true },
      })
      const md = (stats?.monthlyData as Record<string, unknown>) || {}
      await prisma.userStats.update({
        where: { userId: sessionUser.id },
        data: { monthlyData: { ...md, sessionBoundary: true } },
      })
    } catch { /* non-critical */ }

    return NextResponse.json({
      message: "API key revoked successfully",
    })
  } catch (error) {
    console.error("Error revoking API key:", error)
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    )
  }
}
