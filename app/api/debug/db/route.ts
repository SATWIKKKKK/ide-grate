import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/debug/db — Test database connectivity (remove after testing)
export async function GET() {
  try {
    // Test connection with a simple query
    const userCount = await prisma.user.count()

    return NextResponse.json({
      connected: true,
      timestamp: new Date().toISOString(),
      userCount,
      databaseUrl: process.env.DATABASE_URL
        ? `${process.env.DATABASE_URL.substring(0, 35)}...`
        : "NOT SET ❌",
      isNeon: process.env.DATABASE_URL?.includes("neon.tech") ?? false,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        error: err.message,
        databaseUrl: process.env.DATABASE_URL
          ? "Set but connection failed"
          : "NOT SET ❌",
      },
      { status: 500 }
    )
  }
}
